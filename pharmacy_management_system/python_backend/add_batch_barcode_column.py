"""
Add batch_barcode column to inventory table
This allows tracking batch-specific barcodes with expiry information
"""
from db import execute_query
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_batch_barcode_column():
    """Add batch_barcode column to inventory table if it doesn't exist"""
    try:
        # Check if column exists
        check_query = """
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'inventory' 
            AND column_name = 'batch_barcode'
        """
        result = execute_query(check_query, fetch_one=True)
        
        if result:
            logger.info("✅ Column 'batch_barcode' already exists in inventory table")
            return True
        
        # Add the column
        alter_query = """
            ALTER TABLE inventory 
            ADD COLUMN batch_barcode VARCHAR(255) UNIQUE
        """
        execute_query(alter_query, fetch_all=False)
        
        logger.info("✅ Successfully added 'batch_barcode' column to inventory table")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error adding batch_barcode column: {e}")
        return False

if __name__ == "__main__":
    logger.info("Starting database migration: Add batch_barcode column")
    success = add_batch_barcode_column()
    if success:
        logger.info("✅ Migration completed successfully")
    else:
        logger.error("❌ Migration failed")
