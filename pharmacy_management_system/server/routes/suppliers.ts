import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Get all suppliers
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM suppliers ORDER BY name");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

// Get single supplier
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM suppliers WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching supplier:", error);
    res.status(500).json({ error: "Failed to fetch supplier" });
  }
});

// Create supplier
router.post("/", async (req, res) => {
  try {
    const { name, email, contact, address } = req.body;
    
    const result = await pool.query(
      "INSERT INTO suppliers (name, email, contact, address) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, contact, address]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating supplier:", error);
    res.status(500).json({ error: "Failed to create supplier" });
  }
});

// Update supplier
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, contact, address } = req.body;
    
    const result = await pool.query(
      `UPDATE suppliers SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        contact = COALESCE($3, contact),
        address = COALESCE($4, address),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *`,
      [name, email, contact, address, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(500).json({ error: "Failed to update supplier" });
  }
});

// Delete supplier
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM suppliers WHERE id = $1 RETURNING *", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    
    res.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});

export default router;

