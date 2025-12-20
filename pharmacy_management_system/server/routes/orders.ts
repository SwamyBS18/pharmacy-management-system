import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Get all orders
router.get("/", async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    let query = "SELECT * FROM orders WHERE 1=1";
    const params: any[] = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    query += ` ORDER BY order_date DESC, created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = "SELECT COUNT(*) FROM orders WHERE 1=1";
    const countParams: any[] = [];
    
    if (status) {
      countQuery += " AND status = $1";
      countParams.push(status);
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
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get single order
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Create new order
router.post("/", async (req, res) => {
  try {
    const {
      doctor_name,
      doctor_id,
      contact,
      email,
      drugs,
      quantity,
      total,
      status,
      order_date,
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO orders (
        doctor_name, doctor_id, contact, email, drugs, quantity, total, status, order_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [doctor_name, doctor_id, contact, email, drugs, quantity, total, status || "pending", order_date]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Update order
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, ...otherFields } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;
    
    Object.keys(otherFields).forEach((key) => {
      updates.push(`${key} = $${paramCount}`);
      params.push(otherFields[key]);
      paramCount++;
    });
    
    if (status) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);
    
    const result = await pool.query(
      `UPDATE orders SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// Delete order
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM orders WHERE id = $1 RETURNING *", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

export default router;

