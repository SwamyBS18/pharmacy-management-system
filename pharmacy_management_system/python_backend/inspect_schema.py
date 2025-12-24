import os
import sys
import logging

# Ensure we can import from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import execute_query

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def inspect_schema():
    try:
        # Check inventory columns
        query = """
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'inventory';
        """
        columns = execute_query(query)
        logger.info("Inventory Table Columns:")
        if columns:
            for col in columns:
                logger.info(f"{col['column_name']} ({col['data_type']})")
        else:
            logger.info("No columns found or table does not exist.")

    except Exception as e:
        logger.error(f"Error inspecting schema: {e}")

if __name__ == "__main__":
    inspect_schema()
