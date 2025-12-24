import urllib.request
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:5000/api"

def test_add_inventory():
    try:
        # 1. Get a medicine ID first
        logger.info("Fetching medicines...")
        try:
            with urllib.request.urlopen(f"{BASE_URL}/medicines?limit=1") as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch medicines: {response.status}")
                    return
                data = json.loads(response.read().decode())
                medicines = data.get('data', [])
        except Exception as e:
            logger.error(f"Error fetching medicines: {e}")
            return
        
        if not medicines:
            logger.error("No medicines found to test with.")
            # If no medicines, we can't test adding stock properly unless we create one, 
            # but let's assume there are medicines or existing DB has content.
            return
            
        medicine_id = medicines[0]['id']
        logger.info(f"Testing with Medicine ID: {medicine_id}")

        # 2. Try to add stock
        payload = {
            "medicine_id": str(medicine_id),
            "batch_id": "TEST_BATCH_URLLIB",
            "quantity": "5",
            "price": "100",
            "manufacturing_date": "2024-01-01",
            "expiry_date": "2025-01-01",
            "supplier_id": "2"
        }
        
        data_json = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            f"{BASE_URL}/inventory/", 
            data=data_json, 
            headers={'Content-Type': 'application/json'}
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                logger.info(f"Response Status: {response.status}")
                logger.info(f"Response Body: {response.read().decode()}")
        except urllib.request.HTTPError as e:
            logger.error(f"HTTP Error: {e.code} - {e.read().decode()}")
        except Exception as e:
            logger.error(f"Request failed: {e}")
        
    except Exception as e:
        logger.error(f"Test failed with exception: {e}")

if __name__ == "__main__":
    test_add_inventory()
