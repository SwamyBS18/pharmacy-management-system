import fs from "fs";
import path from "path";
import { pool } from "../db.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  try {
    console.log("🔧 Initializing database schema...");
    
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    
    for (const statement of statements) {
      await pool.query(statement);
    }
    
    console.log("✅ Database schema initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
}

// Run init if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase()
    .then(() => {
      console.log("✅ Database initialization completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Database initialization failed:", error);
      process.exit(1);
    });
}

export { initDatabase };

