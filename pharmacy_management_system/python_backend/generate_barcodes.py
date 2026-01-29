"""
Generate barcodes for all medicines that don't have one
"""
import sys
import os

# Add parent directory to path to import db module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db import execute_query, init_db_pool
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_barcodes():
    """Generate barcodes for medicines that don't have one"""
    try:
        # Find all medicines without barcodes
        query = """
            SELECT id, medicine_name 
            FROM medicines 
            WHERE barcode IS NULL OR barcode = ''
        """
        medicines_without_barcodes = execute_query(query)
        
        if not medicines_without_barcodes:
            logger.info("✅ All medicines already have barcodes!")
            return
        
        logger.info(f"📋 Found {len(medicines_without_barcodes)} medicines without barcodes")
        
        # Update each medicine with a barcode
        updated_count = 0
        for medicine in medicines_without_barcodes:
            medicine_id = medicine['id']
            medicine_name = medicine['medicine_name']
            
            # Generate barcode: '200' + zero-padded ID (10 digits total after '200')
            barcode = '200' + str(medicine_id).zfill(10)
            
            # Update the medicine
            update_query = """
                UPDATE medicines 
                SET barcode = %s 
                WHERE id = %s
            """
            execute_query(update_query, (barcode, medicine_id), fetch_all=False)
            
            updated_count += 1
            logger.info(f"  ✓ Generated barcode {barcode} for: {medicine_name}")
        
        logger.info(f"\n✅ Successfully generated {updated_count} barcodes!")
        
        # Verify all medicines now have barcodes
        verify_query = """
            SELECT COUNT(*) as count 
            FROM medicines 
            WHERE barcode IS NULL OR barcode = ''
        """
        result = execute_query(verify_query, fetch_one=True)
        remaining = result['count']
        
        if remaining == 0:
            logger.info("✅ Verification: All medicines now have barcodes!")
        else:
            logger.warning(f"⚠️  Warning: {remaining} medicines still without barcodes")
            
    except Exception as e:
        logger.error(f"❌ Error generating barcodes: {e}")
        raise

if __name__ == '__main__':
    logger.info("🚀 Starting barcode generation...")
    
    # Initialize database connection pool
    if not init_db_pool():
        logger.error("❌ Failed to initialize database connection")
        sys.exit(1)
    
    generate_barcodes()
    logger.info("🎉 Done!")
