import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { pool } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initExtensions() {
  try {
    console.log("📦 Initializing extended database schema...");

    const schemaPath = join(__dirname, "schema-extensions.sql");
    const schemaSQL = readFileSync(schemaPath, "utf-8");

    // Execute the schema
    await pool.query(schemaSQL);

    console.log("✅ Extended schema initialized successfully!");
    console.log("   - Customers table");
    console.log("   - Sales and Sales Items tables");
    console.log("   - Purchase Orders tables");
    console.log("   - Prescriptions tables");
    console.log("   - Stock Adjustments table");
    console.log("   - Order Fulfillment table");
    console.log("   - Low Stock Thresholds table");

  } catch (error: any) {
    console.error("❌ Error initializing extended schema:", error.message);
    process.exit(1);
  }
}

initExtensions();

