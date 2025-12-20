import fs from "fs";
import path from "path";
import { pool } from "../db.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addBarcodeColumn() {
  try {
    console.log("🔧 Adding barcode column to medicines table...");
    
    // Check if column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'medicines' AND column_name = 'barcode'
    `);
    
    if (checkColumn.rows.length === 0) {
      // Add barcode column
      await pool.query(`
        ALTER TABLE medicines 
        ADD COLUMN barcode VARCHAR(50) UNIQUE
      `);
      console.log("✅ Barcode column added successfully!");
    } else {
      console.log("ℹ️  Barcode column already exists, skipping...");
    }
    
    // Create index if it doesn't exist
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode)
      `);
    } catch (error: any) {
      // Index might already exist, ignore
      if (!error.message.includes("already exists")) {
        console.log("Note: Index creation:", error.message);
      }
    }
    
    // Generate barcodes for medicines that don't have one
    console.log("🔧 Generating barcodes for existing medicines...");
    const updateResult = await pool.query(`
      UPDATE medicines 
      SET barcode = '200' || LPAD(id::text, 10, '0')
      WHERE barcode IS NULL OR barcode = ''
    `);
    console.log(`✅ Updated ${updateResult.rowCount} medicines with barcodes!`);
    
    // Verify
    const countResult = await pool.query(
      "SELECT COUNT(*) as total, COUNT(barcode) as with_barcode FROM medicines"
    );
    console.log(`📊 Total medicines: ${countResult.rows[0].total}`);
    console.log(`📊 Medicines with barcode: ${countResult.rows[0].with_barcode}`);
    
  } catch (error: any) {
    console.error("❌ Error adding barcode column:", error);
    console.error("Error details:", error.message);
    throw error;
  }
}

// Run the migration
addBarcodeColumn()
  .then(() => {
    console.log("✅ Barcode migration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Barcode migration failed:", error);
    process.exit(1);
  });

export { addBarcodeColumn };

