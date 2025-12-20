import { Router } from "express";
import { pool, ensureConnection } from "../db.js";

const router = Router();

// Get fulfillment for an order
router.get("/order/:orderId", async (req, res) => {
  try {
    await ensureConnection();
    const { orderId } = req.params;
    
    const result = await pool.query(
      `SELECT of.*, m.medicine_name, m.manufacturer,
              u.name as fulfilled_by_name
       FROM order_fulfillment of
       JOIN medicines m ON of.medicine_id = m.id
       LEFT JOIN users u ON of.fulfilled_by = u.id
       WHERE of.order_id = $1
       ORDER BY of.created_at DESC`,
      [orderId]
    );
    
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching order fulfillment:", error);
    res.status(500).json({ error: "Failed to fetch order fulfillment", details: error.message });
  }
});

// Allocate stock to order
router.post("/allocate", async (req, res) => {
  const client = await pool.connect();
  
  try {
    await ensureConnection();
    await client.query("BEGIN");
    
    const { order_id, allocations, fulfilled_by = 1 } = req.body;
    
    if (!order_id || !allocations || allocations.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Order ID and allocations are required" });
    }
    
    // Get order details
    const orderResult = await client.query(
      "SELECT * FROM orders WHERE id = $1",
      [order_id]
    );
    
    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Create fulfillment records
    for (const allocation of allocations) {
      const { medicine_id, quantity_allocated, batch_id } = allocation;
      
      // Check stock availability
      const stockResult = await client.query(
        "SELECT stock FROM medicines WHERE id = $1",
        [medicine_id]
      );
      
      if (stockResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: `Medicine ID ${medicine_id} not found` });
      }
      
      const availableStock = stockResult.rows[0].stock;
      
      if (availableStock < quantity_allocated) {
        await client.query("ROLLBACK");
        return res.status(400).json({ 
          error: `Insufficient stock for medicine ID ${medicine_id}. Available: ${availableStock}, Required: ${quantity_allocated}` 
        });
      }
      
      // Create fulfillment record
      await client.query(
        `INSERT INTO order_fulfillment (
          order_id, medicine_id, quantity_allocated, batch_id, status, fulfilled_by
        ) VALUES ($1, $2, $3, $4, 'allocated', $5)`,
        [order_id, medicine_id, quantity_allocated, batch_id || null, fulfilled_by]
      );
      
      // Reserve stock (don't deduct yet, only when shipped)
      // This is optional - you might want to track reserved vs available stock
    }
    
    // Update order status
    await client.query(
      "UPDATE orders SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [order_id]
    );
    
    await client.query("COMMIT");
    
    res.status(201).json({ message: "Stock allocated successfully", order_id });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Error allocating stock:", error);
    res.status(500).json({ error: "Failed to allocate stock", details: error.message });
  } finally {
    client.release();
  }
});

// Update fulfillment status
router.put("/:id", async (req, res) => {
  try {
    await ensureConnection();
    const { id } = req.params;
    const { status, delivery_date, tracking_number, notes } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;
    
    if (status) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    
    if (delivery_date) {
      updates.push(`delivery_date = $${paramCount}`);
      params.push(delivery_date);
      paramCount++;
    }
    
    if (tracking_number) {
      updates.push(`tracking_number = $${paramCount}`);
      params.push(tracking_number);
      paramCount++;
    }
    
    if (notes) {
      updates.push(`notes = $${paramCount}`);
      params.push(notes);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);
    
    const result = await pool.query(
      `UPDATE order_fulfillment SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Fulfillment record not found" });
    }
    
    // If status is shipped, deduct stock
    if (status === "shipped") {
      const fulfillment = result.rows[0];
      await pool.query(
        "UPDATE medicines SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [fulfillment.quantity_allocated, fulfillment.medicine_id]
      );
    }
    
    // Check if all items are delivered, update order status
    if (status === "delivered") {
      const fulfillment = result.rows[0];
      const allDelivered = await pool.query(
        `SELECT COUNT(*) as total, 
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered
         FROM order_fulfillment
         WHERE order_id = $1`,
        [fulfillment.order_id]
      );
      
      if (allDelivered.rows[0].total === allDelivered.rows[0].delivered) {
        await pool.query(
          "UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
          [fulfillment.order_id]
        );
      }
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error updating fulfillment:", error);
    res.status(500).json({ error: "Failed to update fulfillment", details: error.message });
  }
});

// Get order history for a doctor
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    await ensureConnection();
    const { doctorId } = req.params;
    
    const result = await pool.query(
      `SELECT o.*, 
              COUNT(DISTINCT of.id) as fulfillment_count,
              SUM(CASE WHEN of.status = 'delivered' THEN 1 ELSE 0 END) as delivered_count
       FROM orders o
       LEFT JOIN order_fulfillment of ON o.id = of.order_id
       WHERE o.doctor_id = $1
       GROUP BY o.id
       ORDER BY o.order_date DESC, o.created_at DESC`,
      [doctorId]
    );
    
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching doctor order history:", error);
    res.status(500).json({ error: "Failed to fetch doctor order history", details: error.message });
  }
});

export default router;

