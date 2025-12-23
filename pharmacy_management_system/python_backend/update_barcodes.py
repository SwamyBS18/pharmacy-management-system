import csv
import os
import sys
import logging

# Ensure we can import from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import execute_query

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def update_barcodes():
    """
    Reads medicines_with_barcode.csv and updates the barcode column 
    in the medicines table for matching medicine names.
    """
    
    # Path to the CSV file (one level up from python_backend)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_file_path = os.path.join(base_dir, 'medicines_with_barcode.csv')
    
    if not os.path.exists(csv_file_path):
        logger.error(f"CSV file not found at: {csv_file_path}")
        return

    logger.info(f"Reading CSV file from: {csv_file_path}")
    
    # Check if barcode column exists, if not attempt to add it
    try:
        check_col_query = """
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='medicines' AND column_name='barcode';
        """
        col_exists = execute_query(check_col_query, fetch_one=True)
        
        if not col_exists:
            logger.info("Adding 'barcode' column to medicines table...")
            add_col_query = "ALTER TABLE medicines ADD COLUMN IF NOT EXISTS barcode VARCHAR(50);"
            execute_query(add_col_query)
            logger.info("'barcode' column added successfully.")
    except Exception as e:
        logger.error(f"Error checking/adding column: {e}")
        return

    updated_count = 0
    not_found_count = 0
    error_count = 0
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            # Verify CSV headers
            if 'Medicine Name' not in reader.fieldnames or 'barcode_value' not in reader.fieldnames:
                logger.error("CSV must contain 'Medicine Name' and 'barcode_value' columns.")
                return

            for row in reader:
                medicine_name = row['Medicine Name'].strip()
                barcode_value = row['barcode_value'].strip()
                
                if not medicine_name or not barcode_value:
                    continue
                    
                try:
                    # Update query
                    update_query = """
                        UPDATE medicines 
                        SET barcode = %s
                        WHERE medicine_name = %s AND (barcode IS NULL OR barcode = '')
                        RETURNING id;
                    """
                    result = execute_query(update_query, (barcode_value, medicine_name), fetch_one=True)
                    
                    if result:
                        updated_count += 1
                        if updated_count % 100 == 0:
                            logger.info(f"Updated {updated_count} medicines...")
                    else:
                        # Try case-insensitive matching if exact match failed
                        update_query_insensitive = """
                            UPDATE medicines 
                            SET barcode = %s
                            WHERE medicine_name ILIKE %s AND (barcode IS NULL OR barcode = '')
                            RETURNING id;
                        """
                        result = execute_query(update_query_insensitive, (barcode_value, medicine_name), fetch_one=True)
                        if result:
                            updated_count += 1
                        else:
                            not_found_count += 1
                            # logger.debug(f"Medicine not found or already has barcode: {medicine_name}")

                except Exception as e:
                    error_count += 1
                    logger.error(f"Error updating {medicine_name}: {e}")

        logger.info("------------------------------------------------")
        logger.info(f"Import Completed.")
        logger.info(f"Total Updated: {updated_count}")
        logger.info(f"Not Found / No Update Needed: {not_found_count}")
        logger.info(f"Errors: {error_count}")
        logger.info("------------------------------------------------")

    except Exception as e:
        logger.error(f"Error reading CSV or executing updates: {e}")

if __name__ == "__main__":
    update_barcodes()
