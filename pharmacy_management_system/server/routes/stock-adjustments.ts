import { Router } from "express";
import { pool, ensureConnection } from "../db.js";

const router = Router();

// Get all stock adjustments
router.get("/", async (req, res) => {
  try {
    await ensureConnection();
    const { page = 1, limit = 50, medicineId, adjustmentType } = req.query;
    
    let query = `
      SELECT sa.*, m.medicine_name, m.manufacturer,
             u.name as adjusted_by_name
      FROM stock_adjustments sa
      JOIN medicines m ON sa.medicine_id = m.id
      LEFT JOIN users u ON sa.adjusted_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;
    
    if (medicineId) {
      query += ` AND sa.medicine_id = $${paramCount}`;
      params.push(medicineId);
      paramCount++;
    }
    
    if (adjustmentType) {
      query += ` AND sa.adjustment_type = $${paramCount}`;
      params.push(adjustmentType);
      paramCount++;
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    query += ` ORDER BY sa.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = "SELECT COUNT(*) FROM stock_adjustments WHERE 1=1";
    const countParams: any[] = [];
    let countParamCount = 1;
    
    if (medicineId) {
      countQuery += ` AND medicine_id = $${countParamCount}`;
      countParams.push(medicineId);
      countParamCount++;
    }
    if (adjustmentType) {
      countQuery += ` AND adjustment_type = $${countParamCount}`;
      countParams.push(adjustmentType);
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
    console.error("Error fetching stock adjustments:", error);
    res.status(500).json({ error: "Failed to fetch stock adjustments", details: error.message });
  }
});

// Create stock adjustment
router.post("/", async (req, res) => {
  const client = await pool.connect();
  
  try {
    await ensureConnection();
    await client.query("BEGIN");
    
    const {
      medicine_id,
      batch_id,
      adjustment_type,
      quantity,
      reason,
      reference_number,
      adjusted_by = 1,
    } = req.body;
    
    if (!medicine_id || !adjustment_type || !quantity) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Medicine ID, adjustment type, and quantity are required" });
    }
    
    const validTypes = ["add", "remove", "transfer", "damage", "expired"];
    if (!validTypes.includes(adjustment_type)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `Invalid adjustment type. Must be one of: ${validTypes.join(", ")}` });
    }
    
    // Get current stock
    const medicineResult = await client.query(
      "SELECT stock FROM medicines WHERE id = $1",
      [medicine_id]
    );
    
    if (medicineResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Medicine not found" });
    }
    
    const currentStock = medicineResult.rows[0].stock;
    
    // Calculate new stock based on adjustment type
    let newStock = currentStock;
    if (adjustment_type === "add") {
      newStock = currentStock + quantity;
    } else if (["remove", "damage", "expired"].includes(adjustment_type)) {
      newStock = Math.max(0, currentStock - quantity);
    }
    // transfer doesn't change total stock, just moves it
    
    // Create adjustment record
    const adjustmentResult = await client.query(
      `INSERT INTO stock_adjustments (
        medicine_id, batch_id, adjustment_type, quantity, reason, reference_number, adjusted_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [medicine_id, batch_id || null, adjustment_type, quantity, reason || null, reference_number || null, adjusted_by]
    );
    
    // Update medicine stock (except for transfers)
    if (adjustment_type !== "transfer") {
      await client.query(
        "UPDATE medicines SET stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [newStock, medicine_id]
      );
      
      // Update inventory if batch_id provided
      if (batch_id) {
        if (adjustment_type === "add") {
          await client.query(
            `UPDATE inventory SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
             WHERE medicine_id = $2 AND batch_id = $3`,
            [quantity, medicine_id, batch_id]
          );
        } else {
          await client.query(
            `UPDATE inventory SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP
             WHERE medicine_id = $2 AND batch_id = $3`,
            [quantity, medicine_id, batch_id]
          );
        }
      }
    }
    
    await client.query("COMMIT");
    
    res.status(201).json(adjustmentResult.rows[0]);
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Error creating stock adjustment:", error);
    res.status(500).json({ error: "Failed to create stock adjustment", details: error.message });
  } finally {
    client.release();
  }
});

export default router;

