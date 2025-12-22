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

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await pool.query(statement);
        // Extract table name from CREATE TABLE statements
        const match = statement.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)/i);
        if (match) {
          console.log(`  ✓ Created table: ${match[1]}`);
        } else if (statement.includes("CREATE INDEX")) {
          const indexMatch = statement.match(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+(\w+)/i);
          if (indexMatch) {
            console.log(`  ✓ Created index: ${indexMatch[1]}`);
          }
        }
      } catch (error: any) {
        console.error(`  ✗ Failed to execute statement ${i + 1}:`, error.message);
        console.error(`    Statement: ${statement.substring(0, 100)}...`);
        throw error;
      }
    }

    console.log("✅ Database schema initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
}

// Run init if executed directly
const isMainModule = process.argv[1] && (
  process.argv[1].includes('init.ts') ||
  process.argv[1].includes('init.js')
);

if (isMainModule) {
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

