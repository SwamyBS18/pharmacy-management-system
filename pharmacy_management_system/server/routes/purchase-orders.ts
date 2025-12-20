import { Router } from "express";
import { pool, ensureConnection } from "../db.js";

const router = Router();

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `PO-${timestamp}-${random}`;
}

// Get all purchase orders
router.get("/", async (req, res) => {
  try {
    await ensureConnection();
    const { page = 1, limit = 50, status, supplierId } = req.query;
    
    let query = `
      SELECT po.*, s.name as supplier_name, s.contact as supplier_contact,
             u.name as created_by_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND po.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (supplierId) {
      query += ` AND po.supplier_id = $${paramCount}`;
      params.push(supplierId);
      paramCount++;
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    query += ` ORDER BY po.order_date DESC, po.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = "SELECT COUNT(*) FROM purchase_orders WHERE 1=1";
    const countParams: any[] = [];
    let countParamCount = 1;
    
    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }
    if (supplierId) {
      countQuery += ` AND supplier_id = $${countParamCount}`;
      countParams.push(supplierId);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({ error: "Failed to fetch purchase orders", details: error.message });
  }
});

// Get single purchase order with items
router.get("/:id", async (req, res) => {
  try {
    await ensureConnection();
    const { id } = req.params;
    
    const orderResult = await pool.query(
      `SELECT po.*, s.name as supplier_name, s.contact as supplier_contact,
              u.name as created_by_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       LEFT JOIN users u ON po.created_by = u.id
       WHERE po.id = $1`,
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Purchase order not found" });
    }
    
    const itemsResult = await pool.query(
      "SELECT * FROM purchase_order_items WHERE purchase_order_id = $1",
      [id]
    );
    
    res.json({
      ...orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error: any) {
    console.error("Error fetching purchase order:", error);
    res.status(500).json({ error: "Failed to fetch purchase order", details: error.message });
  }
});

// Create new purchase order
router.post("/", async (req, res) => {
  const client = await pool.connect();
  
  try {
    await ensureConnection();
    await client.query("BEGIN");
    
    const {
      supplier_id,
      items,
      expected_delivery_date,
      notes,
      created_by = 1,
    } = req.body;
    
    if (!supplier_id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Supplier ID is required" });
    }
    
    if (!items || items.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Order items are required" });
    }
    
    // Calculate total
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.unit_cost * item.quantity;
    }
    
    const orderNumber = generateOrderNumber();
    
    // Create purchase order
    const orderResult = await client.query(
      `INSERT INTO purchase_orders (
        order_number, supplier_id, total_amount, expected_delivery_date, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [orderNumber, supplier_id, totalAmount, expected_delivery_date || null, notes || null, created_by]
    );
    
    const order = orderResult.rows[0];
    
    // Create order items
    for (const item of items) {
      await client.query(
        `INSERT INTO purchase_order_items (
          purchase_order_id, medicine_id, medicine_name, quantity, unit_cost, total_cost
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.id,
          item.medicine_id,
          item.medicine_name,
          item.quantity,
          item.unit_cost,
          item.unit_cost * item.quantity,
        ]
      );
    }
    
    await client.query("COMMIT");
    
    // Fetch complete order with items
    const completeOrder = await pool.query(
      `SELECT po.*, s.name as supplier_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.id = $1`,
      [order.id]
    );
    
    const orderItems = await pool.query(
      "SELECT * FROM purchase_order_items WHERE purchase_order_id = $1",
      [order.id]
    );
    
    res.status(201).json({
      ...completeOrder.rows[0],
      items: orderItems.rows,
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Error creating purchase order:", error);
    res.status(500).json({ error: "Failed to create purchase order", details: error.message });
  } finally {
    client.release();
  }
});

// Receive purchase order (update stock)
router.post("/:id/receive", async (req, res) => {
  const client = await pool.connect();
  
  try {
    await ensureConnection();
    await client.query("BEGIN");
    
    const { id } = req.params;
    const { received_items, invoice_number } = req.body;
    
    // Get purchase order
    const orderResult = await client.query(
      "SELECT * FROM purchase_orders WHERE id = $1",
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Purchase order not found" });
    }
    
    const order = orderResult.rows[0];
    
    if (order.status === "received") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Order already received" });
    }
    
    // Update received quantities and stock
    for (const receivedItem of received_items) {
      const { item_id, received_quantity, batch_id, expiry_date, supplier_id } = receivedItem;
      
      // Update purchase order item
      await client.query(
        `UPDATE purchase_order_items 
         SET received_quantity = received_quantity + $1
         WHERE id = $2`,
        [received_quantity, item_id]
      );
      
      // Get medicine info
      const itemResult = await client.query(
        "SELECT medicine_id, medicine_name FROM purchase_order_items WHERE id = $1",
        [item_id]
      );
      
      if (itemResult.rows.length > 0) {
        const { medicine_id, medicine_name } = itemResult.rows[0];
        
        // Update medicine stock
        await client.query(
          "UPDATE medicines SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [received_quantity, medicine_id]
        );
        
        // Add to inventory
        await client.query(
          `INSERT INTO inventory (medicine_id, batch_id, quantity, expiry_date, supplier_id, price)
           VALUES ($1, $2, $3, $4, $5, 
             (SELECT unit_cost FROM purchase_order_items WHERE id = $6))
           ON CONFLICT DO NOTHING`,
          [medicine_id, batch_id || null, received_quantity, expiry_date || null, supplier_id || null, item_id]
        );
      }
    }
    
    // Update purchase order status
    await client.query(
      `UPDATE purchase_orders 
       SET status = 'received', 
           received_date = CURRENT_DATE,
           invoice_number = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [invoice_number || null, id]
    );
    
    await client.query("COMMIT");
    
    res.json({ message: "Purchase order received successfully", order_id: id });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Error receiving purchase order:", error);
    res.status(500).json({ error: "Failed to receive purchase order", details: error.message });
  } finally {
    client.release();
  }
});

// Update purchase order status
router.put("/:id", async (req, res) => {
  try {
    await ensureConnection();
    const { id } = req.params;
    const { status, ...otherFields } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;
    
    Object.keys(otherFields).forEach((key) => {
      if (["expected_delivery_date", "invoice_number", "notes"].includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        params.push(otherFields[key]);
        paramCount++;
      }
    });
    
    if (status) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);
    
    const result = await pool.query(
      `UPDATE purchase_orders SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Purchase order not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error updating purchase order:", error);
    res.status(500).json({ error: "Failed to update purchase order", details: error.message });
  }
});

export default router;

