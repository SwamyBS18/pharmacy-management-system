// Quick test script to verify database connection
import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, ".env") });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "pharmacy_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

console.log("🔍 Testing database connection...");
console.log("Configuration:");
console.log(`  Host: ${process.env.DB_HOST || "localhost"}`);
console.log(`  Port: ${process.env.DB_PORT || "5432"}`);
console.log(`  Database: ${process.env.DB_NAME || "pharmacy_db"}`);
console.log(`  User: ${process.env.DB_USER || "postgres"}`);
console.log(`  Password: ${process.env.DB_PASSWORD ? "***" : "not set"}`);

pool.query("SELECT COUNT(*) as count FROM medicines")
  .then((result) => {
    console.log("\n✅ Connection successful!");
    console.log(`📊 Total medicines in database: ${result.rows[0].count}`);
    return pool.query("SELECT medicine_name, manufacturer FROM medicines LIMIT 3");
  })
  .then((result) => {
    console.log("\n📋 Sample medicines:");
    result.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.medicine_name} - ${row.manufacturer || "N/A"}`);
    });
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Connection failed!");
    console.error("Error:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Make sure PostgreSQL is running");
    console.error("2. Check your .env file exists and has correct credentials");
    console.error("3. Verify the database 'pharmacy_db' exists");
    console.error("4. Check your PostgreSQL password is correct");
    process.exit(1);
  });


