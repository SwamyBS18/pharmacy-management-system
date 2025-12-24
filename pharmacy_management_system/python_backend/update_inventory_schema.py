import os
import sys
import logging

# Ensure we can import from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import execute_query

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_schema():
    try:
        # Check if column exists
        check_query = """
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='inventory' AND column_name='manufacturing_date';
        """
        col_exists = execute_query(check_query, fetch_one=True)
        
        if not col_exists:
            logger.info("Adding 'manufacturing_date' column to inventory table...")
            add_col_query = "ALTER TABLE inventory ADD COLUMN IF NOT EXISTS manufacturing_date DATE;"
            execute_query(add_col_query, fetch_all=False)
            logger.info("'manufacturing_date' column added successfully.")
        else:
            logger.info("'manufacturing_date' column already exists.")
            
    except Exception as e:
        logger.error(f"Error updating schema: {e}")

if __name__ == "__main__":
    update_schema()
