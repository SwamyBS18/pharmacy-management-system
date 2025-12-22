import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { pool } from "../db.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MedicineRow {
  "Medicine_ID": string;
  "Medicine Name": string;
  Composition: string;
  Uses: string;
  "Side_effects": string;
  "Image URL": string;
  Manufacturer: string;
  "Excellent Review %": string;
  "Average Review %": string;
  "Poor Review %": string;
  Category: string;
  Price: string;
}

async function importCSV() {
  const csvPath = path.join(__dirname, "../../model/Medicine_Details_Categorized.csv");

  if (!fs.existsSync(csvPath)) {
    console.error("❌ CSV file not found at:", csvPath);
    process.exit(1);
  }

  console.log("📂 Reading CSV file from:", csvPath);

  const medicines: MedicineRow[] = [];

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row: MedicineRow) => {
        medicines.push(row);
      })
      .on("end", async () => {
        console.log(`✅ Parsed ${medicines.length} medicines from CSV`);

        try {
          // Clear existing data
          await pool.query("TRUNCATE TABLE medicines RESTART IDENTITY CASCADE");
          console.log("🗑️  Cleared existing medicines data");

          // Insert medicines in batches
          const batchSize = 100;
          let inserted = 0;

          for (let i = 0; i < medicines.length; i += batchSize) {
            const batch = medicines.slice(i, i + batchSize);

            // Build parameterized query for batch insert
            const params: any[] = [];
            const placeholders: string[] = [];

            batch.forEach((med, batchIndex) => {
              const offset = batchIndex * 11;
              placeholders.push(
                `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11})`
              );

              params.push(
                med["Medicine Name"] || "",
                med.Composition || "",
                med.Uses || "",
                med["Side_effects"] || "",
                med["Image URL"] || "",
                med.Manufacturer || "",
                parseInt(med["Excellent Review %"] || "0"),
                parseInt(med["Average Review %"] || "0"),
                parseInt(med["Poor Review %"] || "0"),
                med.Category || "",
                parseFloat(med.Price || "0")
              );
            });

            const query = `
              INSERT INTO medicines (
                medicine_name, composition, uses, side_effects, image_url, 
                manufacturer, excellent_review_percent, average_review_percent, poor_review_percent,
                category, price
              ) VALUES ${placeholders.join(", ")}
            `;

            await pool.query(query, params);
            inserted += batch.length;
            console.log(`📦 Inserted ${inserted}/${medicines.length} medicines...`);
          }

          console.log(`✅ Successfully imported ${inserted} medicines into database!`);
          await pool.end();
          resolve();
        } catch (error) {
          console.error("❌ Error importing data:", error);
          await pool.end();
          reject(error);
        }
      })
      .on("error", (error) => {
        console.error("❌ Error reading CSV:", error);
        reject(error);
      });
  });
}

// Run import if executed directly
const isMainModule = process.argv[1] && (
  process.argv[1].includes('import-csv.ts') ||
  process.argv[1].includes('import-csv.js')
);

if (isMainModule) {
  importCSV()
    .then(() => {
      console.log("✅ Import completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Import failed:", error);
      process.exit(1);
    });
}

export { importCSV };

