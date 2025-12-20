import { Router } from "express";
import { pool, ensureConnection } from "../db.js";

const router = Router();

// Get all medicines
router.get("/", async (req, res) => {
  try {
    console.log("📦 Fetching medicines from database...");
    
    // Ensure database connection is ready
    await ensureConnection();
    
    const { search, manufacturer, category, page = 1, limit = 50 } = req.query;
    
    let query = "SELECT * FROM medicines WHERE 1=1";
    const params: any[] = [];
    let paramCount = 1;
    
    if (search) {
      query += ` AND (medicine_name ILIKE $${paramCount} OR composition ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    if (manufacturer) {
      query += ` AND manufacturer = $${paramCount}`;
      params.push(manufacturer);
      paramCount++;
    }
    
    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ` ORDER BY medicine_name LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);
    // Note: paramCount increment not needed here as we're done with query construction
    
    console.log("Executing query:", query.substring(0, 200));
    console.log("Query parameters:", params);
    const result = await pool.query(query, params);
    console.log(`✅ Found ${result.rows.length} medicines`);
    
    // Get total count
    let countQuery = "SELECT COUNT(*) FROM medicines WHERE 1=1";
    const countParams: any[] = [];
    let countParamCount = 1;
    
    if (search) {
      countQuery += ` AND (medicine_name ILIKE $${countParamCount} OR composition ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }
    
    if (manufacturer) {
      countQuery += ` AND manufacturer = $${countParamCount}`;
      countParams.push(manufacturer);
      countParamCount++;
    }
    
    if (category) {
      countQuery += ` AND category = $${countParamCount}`;
      countParams.push(category);
      countParamCount++;
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
    console.error("❌ Error fetching medicines:", error);
    console.error("Error details:", error.message);
    console.error("Error code:", error.code);
    console.error("Stack:", error.stack);
    
    // Provide more specific error messages
    let errorMessage = "Failed to fetch medicines";
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      errorMessage = "Database connection failed. Please check if PostgreSQL is running.";
    } else if (error.code === "28P01") {
      errorMessage = "Database authentication failed. Please check your database credentials.";
    } else if (error.code === "3D000") {
      errorMessage = "Database does not exist. Please create the database first.";
    } else if (error.message) {
      errorMessage = `Database error: ${error.message}`;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.message,
      code: error.code
    });
  }
});

// Get medicine by barcode
router.get("/barcode/:barcode", async (req, res) => {
  try {
    const { barcode } = req.params;
    const result = await pool.query("SELECT * FROM medicines WHERE barcode = $1", [barcode]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Medicine not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching medicine by barcode:", error);
    res.status(500).json({ error: "Failed to fetch medicine" });
  }
});

// Get single medicine by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM medicines WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Medicine not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching medicine:", error);
    res.status(500).json({ error: "Failed to fetch medicine" });
  }
});

// Create new medicine
router.post("/", async (req, res) => {
  try {
    const {
      medicine_name,
      composition,
      uses,
      side_effects,
      image_url,
      manufacturer,
      excellent_review_percent,
      average_review_percent,
      poor_review_percent,
      price,
      stock,
      category,
      barcode,
    } = req.body;
    
    // Generate barcode if not provided
    let finalBarcode = barcode;
    if (!finalBarcode) {
      // Get the next ID to generate barcode
      const idResult = await pool.query("SELECT nextval('medicines_id_seq')");
      const nextId = idResult.rows[0].nextval;
      finalBarcode = '200' + String(nextId).padStart(10, '0');
    }
    
    const result = await pool.query(
      `INSERT INTO medicines (
        medicine_name, composition, uses, side_effects, image_url,
        manufacturer, excellent_review_percent, average_review_percent, poor_review_percent,
        price, stock, category, barcode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        medicine_name,
        composition,
        uses,
        side_effects,
        image_url,
        manufacturer,
        excellent_review_percent || 0,
        average_review_percent || 0,
        poor_review_percent || 0,
        price || 0,
        stock || 0,
        category,
        finalBarcode,
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating medicine:", error);
    res.status(500).json({ error: "Failed to create medicine" });
  }
});

// Update medicine
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      medicine_name,
      composition,
      uses,
      side_effects,
      image_url,
      manufacturer,
      excellent_review_percent,
      average_review_percent,
      poor_review_percent,
      price,
      stock,
      category,
    } = req.body;
    
    const result = await pool.query(
      `UPDATE medicines SET
        medicine_name = COALESCE($1, medicine_name),
        composition = COALESCE($2, composition),
        uses = COALESCE($3, uses),
        side_effects = COALESCE($4, side_effects),
        image_url = COALESCE($5, image_url),
        manufacturer = COALESCE($6, manufacturer),
        excellent_review_percent = COALESCE($7, excellent_review_percent),
        average_review_percent = COALESCE($8, average_review_percent),
        poor_review_percent = COALESCE($9, poor_review_percent),
        price = COALESCE($10, price),
        stock = COALESCE($11, stock),
        category = COALESCE($12, category),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *`,
      [
        medicine_name,
        composition,
        uses,
        side_effects,
        image_url,
        manufacturer,
        excellent_review_percent,
        average_review_percent,
        poor_review_percent,
        price,
        stock,
        category,
        id,
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Medicine not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating medicine:", error);
    res.status(500).json({ error: "Failed to update medicine" });
  }
});

// Delete medicine
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM medicines WHERE id = $1 RETURNING *", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Medicine not found" });
    }
    
    res.json({ message: "Medicine deleted successfully" });
  } catch (error) {
    console.error("Error deleting medicine:", error);
    res.status(500).json({ error: "Failed to delete medicine" });
  }
});

// Get unique manufacturers
router.get("/manufacturers/list", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT manufacturer FROM medicines WHERE manufacturer IS NOT NULL AND manufacturer != '' ORDER BY manufacturer"
    );
    res.json(result.rows.map(row => row.manufacturer));
  } catch (error) {
    console.error("Error fetching manufacturers:", error);
    res.status(500).json({ error: "Failed to fetch manufacturers" });
  }
});

export default router;

