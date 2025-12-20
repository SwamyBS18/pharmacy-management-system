import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "pharmacy_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

// Test connection
pool.on("connect", (client) => {
  console.log("✅ Connected to PostgreSQL database");
  console.log(`   Database: ${process.env.DB_NAME || "pharmacy_db"}`);
  console.log(`   Host: ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}`);
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL connection error:", err);
});

// Test connection on startup
let connectionTested = false;
let connectionError: Error | null = null;

async function testConnection() {
  if (connectionTested) return;
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Database connection test successful");
    connectionTested = true;
    connectionError = null;
  } catch (err: any) {
    console.error("❌ Database connection test failed:", err.message);
    console.error("   Check your .env file and PostgreSQL is running");
    console.error("   Config:", {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || "5432",
      database: process.env.DB_NAME || "pharmacy_db",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD ? "***" : "not set",
    });
    connectionError = err;
  }
}

// Test immediately (fire and forget, but will be checked on first query)
testConnection().catch(console.error);

// Export function to check connection status
export async function ensureConnection() {
  if (!connectionTested) {
    await testConnection();
  }
  if (connectionError) {
    throw new Error(`Database connection failed: ${connectionError.message}`);
  }
}

export default pool;

