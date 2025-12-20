import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Get all users
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role, status, created_at FROM users ORDER BY name");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get single user
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, name, email, role, status, created_at FROM users WHERE id = $1",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Create user
router.post("/", async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;
    
    // In production, hash the password!
    const result = await pool.query(
      "INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, status, created_at",
      [name, email, password, role || "staff", status || "active"]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update user
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;
    
    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        role = COALESCE($3, role),
        status = COALESCE($4, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, email, role, status, created_at`,
      [name, email, role, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;

