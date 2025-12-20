import { Router } from "express";
import { pool, ensureConnection } from "../db.js";

const router = Router();

// Get all customers
router.get("/", async (req, res) => {
  try {
    await ensureConnection();
    const { page = 1, limit = 50, search } = req.query;
    
    let query = "SELECT * FROM customers WHERE 1=1";
    const params: any[] = [];
    let paramCount = 1;
    
    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR phone ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = "SELECT COUNT(*) FROM customers WHERE 1=1";
    const countParams: any[] = [];
    if (search) {
      countQuery += " AND (name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1)";
      countParams.push(`%${search}%`);
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
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers", details: error.message });
  }
});

// Get single customer with purchase history
router.get("/:id", async (req, res) => {
  try {
    await ensureConnection();
    const { id } = req.params;
    
    const customerResult = await pool.query(
      "SELECT * FROM customers WHERE id = $1",
      [id]
    );
    
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    const salesResult = await pool.query(
      `SELECT s.*, 
              (SELECT COUNT(*) FROM sales_items WHERE sale_id = s.id) as item_count
       FROM sales s
       WHERE s.customer_id = $1
       ORDER BY s.created_at DESC
       LIMIT 50`,
      [id]
    );
    
    const prescriptionsResult = await pool.query(
      "SELECT * FROM prescriptions WHERE customer_id = $1 ORDER BY created_at DESC",
      [id]
    );
    
    res.json({
      ...customerResult.rows[0],
      purchaseHistory: salesResult.rows,
      prescriptions: prescriptionsResult.rows,
    });
  } catch (error: any) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Failed to fetch customer", details: error.message });
  }
});

// Create new customer
router.post("/", async (req, res) => {
  try {
    await ensureConnection();
    const {
      name,
      email,
      phone,
      address,
      date_of_birth,
      gender,
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Customer name is required" });
    }
    
    const result = await pool.query(
      `INSERT INTO customers (name, email, phone, address, date_of_birth, gender)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, email || null, phone || null, address || null, date_of_birth || null, gender || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating customer:", error);
    if (error.code === "23505") {
      return res.status(400).json({ error: "Customer with this email or phone already exists" });
    }
    res.status(500).json({ error: "Failed to create customer", details: error.message });
  }
});

// Update customer
router.put("/:id", async (req, res) => {
  try {
    await ensureConnection();
    const { id } = req.params;
    const updates = req.body;
    
    const allowedFields = ["name", "email", "phone", "address", "date_of_birth", "gender"];
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramCount = 1;
    
    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        params.push(updates[key]);
        paramCount++;
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);
    
    const result = await pool.query(
      `UPDATE customers SET ${updateFields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Failed to update customer", details: error.message });
  }
});

// Delete customer
router.delete("/:id", async (req, res) => {
  try {
    await ensureConnection();
    const { id } = req.params;
    const result = await pool.query("DELETE FROM customers WHERE id = $1 RETURNING *", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    res.json({ message: "Customer deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ error: "Failed to delete customer", details: error.message });
  }
});

export default router;

