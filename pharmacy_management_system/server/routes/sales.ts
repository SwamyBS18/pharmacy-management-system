import { Router } from "express";
import { pool, ensureConnection } from "../db.js";

const router = Router();

// Generate unique invoice number
function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `INV-${timestamp}-${random}`;
}

// Get all sales
router.get("/", async (req, res) => {
  try {
    await ensureConnection();
    const { page = 1, limit = 50, startDate, endDate, customerId } = req.query;
    
    let query = `
      SELECT s.*, c.name as customer_name, c.phone as customer_phone,
             u.name as sold_by_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.sold_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;
    
    if (startDate) {
      query += ` AND DATE(s.created_at) >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      query += ` AND DATE(s.created_at) <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }
    
    if (customerId) {
      query += ` AND s.customer_id = $${paramCount}`;
      params.push(customerId);
      paramCount++;
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    query += ` ORDER BY s.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = "SELECT COUNT(*) FROM sales WHERE 1=1";
    const countParams: any[] = [];
    let countParamCount = 1;
    
    if (startDate) {
      countQuery += ` AND DATE(created_at) >= $${countParamCount}`;
      countParams.push(startDate);
      countParamCount++;
    }
    if (endDate) {
      countQuery += ` AND DATE(created_at) <= $${countParamCount}`;
      countParams.push(endDate);
      countParamCount++;
    }
    if (customerId) {
      countQuery += ` AND customer_id = $${countParamCount}`;
      countParams.push(customerId);
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
    console.error("Error fetching sales:", error);
    res.status(500).json({ error: "Failed to fetch sales", details: error.message });
  }
});

// Get single sale with items
router.get("/:id", async (req, res) => {
  try {
    await ensureConnection();
    const { id } = req.params;
    
    const saleResult = await pool.query(
      `SELECT s.*, c.name as customer_name, c.phone as customer_phone,
              u.name as sold_by_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN users u ON s.sold_by = u.id
       WHERE s.id = $1`,
      [id]
    );
    
    if (saleResult.rows.length === 0) {
      return res.status(404).json({ error: "Sale not found" });
    }
    
    const itemsResult = await pool.query(
      "SELECT * FROM sales_items WHERE sale_id = $1",
      [id]
    );
    
    res.json({
      ...saleResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error: any) {
    console.error("Error fetching sale:", error);
    res.status(500).json({ error: "Failed to fetch sale", details: error.message });
  }
});

// Create new sale (checkout)
router.post("/", async (req, res) => {
  const client = await pool.connect();
  
  try {
    await ensureConnection();
    await client.query("BEGIN");
    
    const {
      customer_id,
      items,
      payment_method = "cash",
      payment_status = "paid",
      discount_amount = 0,
      notes,
      sold_by = 1, // Default user ID, should come from auth
    } = req.body;
    
    if (!items || items.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cart is empty" });
    }
    
    // Calculate totals
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.unit_price * item.quantity;
    }
    
    const taxAmount = totalAmount * 0.10; // 10% tax
    const finalAmount = totalAmount + taxAmount - discount_amount;
    
    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();
    
    // Create sale record
    const saleResult = await client.query(
      `INSERT INTO sales (
        customer_id, invoice_number, total_amount, tax_amount, discount_amount,
        final_amount, payment_method, payment_status, sold_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        customer_id || null,
        invoiceNumber,
        totalAmount,
        taxAmount,
        discount_amount,
        finalAmount,
        payment_method,
        payment_status,
        sold_by,
        notes || null,
      ]
    );
    
    const sale = saleResult.rows[0];
    
    // Create sale items and update stock
    for (const item of items) {
      // Insert sale item
      await client.query(
        `INSERT INTO sales_items (
          sale_id, medicine_id, medicine_name, quantity, unit_price, total_price, batch_id, expiry_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          sale.id,
          item.medicine_id,
          item.medicine_name,
          item.quantity,
          item.unit_price,
          item.unit_price * item.quantity,
          item.batch_id || null,
          item.expiry_date || null,
        ]
      );
      
      // Update medicine stock
      await client.query(
        "UPDATE medicines SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [item.quantity, item.medicine_id]
      );
      
      // Update inventory if batch_id provided
      if (item.batch_id) {
        await client.query(
          "UPDATE inventory SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE medicine_id = $2 AND batch_id = $3",
          [item.quantity, item.medicine_id, item.batch_id]
        );
      }
    }
    
    // Update customer stats if customer_id provided
    if (customer_id) {
      await client.query(
        `UPDATE customers SET 
          total_purchases = total_purchases + $1,
          last_purchase_date = CURRENT_DATE,
          loyalty_points = loyalty_points + FLOOR($1 / 100),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [finalAmount, customer_id]
      );
    }
    
    await client.query("COMMIT");
    
    // Fetch complete sale with items
    const completeSale = await pool.query(
      `SELECT s.*, c.name as customer_name, c.phone as customer_phone
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = $1`,
      [sale.id]
    );
    
    const saleItems = await pool.query(
      "SELECT * FROM sales_items WHERE sale_id = $1",
      [sale.id]
    );
    
    res.status(201).json({
      ...completeSale.rows[0],
      items: saleItems.rows,
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Error creating sale:", error);
    res.status(500).json({ error: "Failed to create sale", details: error.message });
  } finally {
    client.release();
  }
});

// Get sales statistics
router.get("/stats/summary", async (req, res) => {
  try {
    await ensureConnection();
    const { startDate, endDate } = req.query;
    
    let dateFilter = "";
    const params: any[] = [];
    
    if (startDate && endDate) {
      dateFilter = "WHERE DATE(created_at) BETWEEN $1 AND $2";
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = "WHERE DATE(created_at) >= $1";
      params.push(startDate);
    } else if (endDate) {
      dateFilter = "WHERE DATE(created_at) <= $1";
      params.push(endDate);
    }
    
    // Total sales
    const totalSalesResult = await pool.query(
      `SELECT COALESCE(SUM(final_amount), 0) as total_sales,
              COALESCE(COUNT(*), 0) as total_transactions,
              COALESCE(AVG(final_amount), 0) as avg_sale
       FROM sales ${dateFilter}`,
      params
    );
    
    // Daily sales
    const dailySalesResult = await pool.query(
      `SELECT DATE(created_at) as date,
              COUNT(*) as transactions,
              SUM(final_amount) as sales
       FROM sales ${dateFilter ? dateFilter.replace("WHERE", "WHERE") : "WHERE 1=1"}
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`,
      params
    );
    
    // Top selling medicines
    const topMedicinesResult = await pool.query(
      `SELECT si.medicine_id, si.medicine_name,
              SUM(si.quantity) as total_quantity,
              SUM(si.total_price) as total_revenue
       FROM sales_items si
       JOIN sales s ON si.sale_id = s.id
       ${dateFilter ? dateFilter.replace("WHERE", "WHERE s.") : ""}
       GROUP BY si.medicine_id, si.medicine_name
       ORDER BY total_quantity DESC
       LIMIT 10`,
      params
    );
    
    res.json({
      summary: totalSalesResult.rows[0],
      dailySales: dailySalesResult.rows,
      topMedicines: topMedicinesResult.rows,
    });
  } catch (error: any) {
    console.error("Error fetching sales stats:", error);
    res.status(500).json({ error: "Failed to fetch sales stats", details: error.message });
  }
});

export default router;

