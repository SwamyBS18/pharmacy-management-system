import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Get inventory with medicine details
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT 
        i.*,
        m.medicine_name,
        m.manufacturer,
        m.category,
        CASE 
          WHEN i.expiry_date < CURRENT_DATE THEN 'expired'
          WHEN i.quantity <= 0 THEN 'out_of_stock'
          WHEN i.quantity < 50 THEN 'low'
          ELSE 'normal'
        END as status
      FROM inventory i
      LEFT JOIN medicines m ON i.medicine_id = m.id
      ORDER BY i.expiry_date ASC, i.quantity ASC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// Get expired drugs
router.get("/expired", async (req, res) => {
  try {
    const query = `
      SELECT 
        i.*,
        m.medicine_name,
        m.manufacturer,
        s.name as supplier_name,
        s.email as supplier_email
      FROM inventory i
      LEFT JOIN medicines m ON i.medicine_id = m.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.expiry_date < CURRENT_DATE
      ORDER BY i.expiry_date ASC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching expired drugs:", error);
    res.status(500).json({ error: "Failed to fetch expired drugs" });
  }
});

// Get out of stock items
router.get("/out-of-stock", async (req, res) => {
  try {
    const query = `
      SELECT 
        i.*,
        m.medicine_name,
        m.manufacturer,
        s.name as supplier_name,
        s.email as supplier_email
      FROM inventory i
      LEFT JOIN medicines m ON i.medicine_id = m.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.quantity <= 0
      ORDER BY m.medicine_name
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching out of stock items:", error);
    res.status(500).json({ error: "Failed to fetch out of stock items" });
  }
});

// Get low stock items
router.get("/low-stock", async (req, res) => {
  try {
    const query = `
      SELECT 
        i.*,
        m.medicine_name,
        m.manufacturer
      FROM inventory i
      LEFT JOIN medicines m ON i.medicine_id = m.id
      WHERE i.quantity > 0 AND i.quantity < 50
      ORDER BY i.quantity ASC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    res.status(500).json({ error: "Failed to fetch low stock items" });
  }
});

// Get reorder suggestions
router.get("/reorder-suggestions", async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id as medicine_id,
        m.medicine_name,
        m.manufacturer,
        m.stock as current_stock,
        COALESCE(lst.threshold_quantity, 50) as threshold_quantity,
        COALESCE(lst.reorder_quantity, 100) as suggested_reorder_quantity,
        s.id as supplier_id,
        s.name as supplier_name,
        s.contact as supplier_contact
      FROM medicines m
      LEFT JOIN low_stock_thresholds lst ON m.id = lst.medicine_id
      LEFT JOIN inventory i ON m.id = i.medicine_id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE m.stock <= COALESCE(lst.threshold_quantity, 50)
      GROUP BY m.id, m.medicine_name, m.manufacturer, m.stock, lst.threshold_quantity, lst.reorder_quantity, s.id, s.name, s.contact
      ORDER BY m.stock ASC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching reorder suggestions:", error);
    res.status(500).json({ error: "Failed to fetch reorder suggestions" });
  }
});

// Set low stock threshold
router.post("/thresholds", async (req, res) => {
  try {
    const { medicine_id, threshold_quantity, auto_reorder, reorder_quantity } = req.body;

    if (!medicine_id || !threshold_quantity) {
      return res.status(400).json({ error: "Medicine ID and threshold quantity are required" });
    }

    const result = await pool.query(
      `INSERT INTO low_stock_thresholds (medicine_id, threshold_quantity, auto_reorder, reorder_quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (medicine_id) 
       DO UPDATE SET 
         threshold_quantity = EXCLUDED.threshold_quantity,
         auto_reorder = EXCLUDED.auto_reorder,
         reorder_quantity = EXCLUDED.reorder_quantity,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [medicine_id, threshold_quantity, auto_reorder || false, reorder_quantity || 100]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error setting threshold:", error);
    res.status(500).json({ error: "Failed to set threshold" });
  }
});

// Create new inventory batch
router.post("/", async (req, res) => {
  try {
    const { medicine_id, batch_id, quantity, expiry_date, supplier_id, price } = req.body;

    if (!medicine_id || !quantity) {
      return res.status(400).json({ error: "Medicine ID and quantity are required" });
    }

    const result = await pool.query(
      `INSERT INTO inventory (medicine_id, batch_id, quantity, expiry_date, supplier_id, price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [medicine_id, batch_id || null, quantity, expiry_date || null, supplier_id || null, price || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating inventory item:", error);
    res.status(500).json({ error: "Failed to create inventory item" });
  }
});

// Update inventory item
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { batch_id, quantity, expiry_date, supplier_id, price } = req.body;

    const result = await pool.query(
      `UPDATE inventory SET
        batch_id = COALESCE($1, batch_id),
        quantity = COALESCE($2, quantity),
        expiry_date = COALESCE($3, expiry_date),
        supplier_id = COALESCE($4, supplier_id),
        price = COALESCE($5, price),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *`,
      [batch_id, quantity, expiry_date, supplier_id, price, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    res.status(500).json({ error: "Failed to update inventory item" });
  }
});

// Delete inventory item
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM inventory WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    res.json({ message: "Inventory item deleted successfully" });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({ error: "Failed to delete inventory item" });
  }
});

export default router;

