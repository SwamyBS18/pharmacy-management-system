import { Router } from "express";
import { pool, ensureConnection } from "../db.js";

const router = Router();

// Get all prescriptions
router.get("/", async (req, res) => {
  try {
    await ensureConnection();
    const { page = 1, limit = 50, customerId, doctorName, status } = req.query;
    
    let query = `
      SELECT p.*, c.name as customer_name, c.phone as customer_phone
      FROM prescriptions p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;
    
    if (customerId) {
      query += ` AND p.customer_id = $${paramCount}`;
      params.push(customerId);
      paramCount++;
    }
    
    if (doctorName) {
      query += ` AND p.doctor_name ILIKE $${paramCount}`;
      params.push(`%${doctorName}%`);
      paramCount++;
    }
    
    if (status) {
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    query += ` ORDER BY p.prescription_date DESC, p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = "SELECT COUNT(*) FROM prescriptions WHERE 1=1";
    const countParams: any[] = [];
    let countParamCount = 1;
    
    if (customerId) {
      countQuery += ` AND customer_id = $${countParamCount}`;
      countParams.push(customerId);
      countParamCount++;
    }
    if (doctorName) {
      countQuery += ` AND doctor_name ILIKE $${countParamCount}`;
      countParams.push(`%${doctorName}%`);
      countParamCount++;
    }
    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
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
  } catch (error: any) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch prescriptions", details: error.message });
  }
});

// Get single prescription with items
router.get("/:id", async (req, res) => {
  try {
    await ensureConnection();
    const { id } = req.params;
    
    const prescriptionResult = await pool.query(
      `SELECT p.*, c.name as customer_name, c.phone as customer_phone
       FROM prescriptions p
       LEFT JOIN customers c ON p.customer_id = c.id
       WHERE p.id = $1`,
      [id]
    );
    
    if (prescriptionResult.rows.length === 0) {
      return res.status(404).json({ error: "Prescription not found" });
    }
    
    const itemsResult = await pool.query(
      "SELECT * FROM prescription_items WHERE prescription_id = $1",
      [id]
    );
    
    res.json({
      ...prescriptionResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error: any) {
    console.error("Error fetching prescription:", error);
    res.status(500).json({ error: "Failed to fetch prescription", details: error.message });
  }
});

// Create new prescription
router.post("/", async (req, res) => {
  const client = await pool.connect();
  
  try {
    await ensureConnection();
    await client.query("BEGIN");
    
    const {
      customer_id,
      doctor_name,
      doctor_id,
      doctor_contact,
      prescription_date,
      expiry_date,
      image_url,
      notes,
      items,
    } = req.body;
    
    if (!doctor_name || !prescription_date) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Doctor name and prescription date are required" });
    }
    
    // Create prescription
    const prescriptionResult = await client.query(
      `INSERT INTO prescriptions (
        customer_id, doctor_name, doctor_id, doctor_contact,
        prescription_date, expiry_date, image_url, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        customer_id || null,
        doctor_name,
        doctor_id || null,
        doctor_contact || null,
        prescription_date,
        expiry_date || null,
        image_url || null,
        notes || null,
      ]
    );
    
    const prescription = prescriptionResult.rows[0];
    
    // Create prescription items
    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(
          `INSERT INTO prescription_items (
            prescription_id, medicine_id, medicine_name, quantity,
            dosage, frequency, duration, instructions
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            prescription.id,
            item.medicine_id,
            item.medicine_name,
            item.quantity || 1,
            item.dosage || null,
            item.frequency || null,
            item.duration || null,
            item.instructions || null,
          ]
        );
      }
    }
    
    await client.query("COMMIT");
    
    // Fetch complete prescription
    const completePrescription = await pool.query(
      `SELECT p.*, c.name as customer_name
       FROM prescriptions p
       LEFT JOIN customers c ON p.customer_id = c.id
       WHERE p.id = $1`,
      [prescription.id]
    );
    
    const prescriptionItems = await pool.query(
      "SELECT * FROM prescription_items WHERE prescription_id = $1",
      [prescription.id]
    );
    
    res.status(201).json({
      ...completePrescription.rows[0],
      items: prescriptionItems.rows,
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Error creating prescription:", error);
    res.status(500).json({ error: "Failed to create prescription", details: error.message });
  } finally {
    client.release();
  }
});

// Update prescription
router.put("/:id", async (req, res) => {
  try {
    await ensureConnection();
    const { id } = req.params;
    const updates = req.body;
    
    const allowedFields = [
      "doctor_name", "doctor_id", "doctor_contact",
      "prescription_date", "expiry_date", "image_url", "notes", "status"
    ];
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
      `UPDATE prescriptions SET ${updateFields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Prescription not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error updating prescription:", error);
    res.status(500).json({ error: "Failed to update prescription", details: error.message });
  }
});

// Get expired prescriptions
router.get("/expired/list", async (req, res) => {
  try {
    await ensureConnection();
    const result = await pool.query(
      `SELECT p.*, c.name as customer_name
       FROM prescriptions p
       LEFT JOIN customers c ON p.customer_id = c.id
       WHERE p.expiry_date < CURRENT_DATE AND p.status = 'active'
       ORDER BY p.expiry_date DESC`
    );
    
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching expired prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch expired prescriptions", details: error.message });
  }
});

export default router;

