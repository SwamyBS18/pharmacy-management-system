import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:5000/api"

def test_create_sale_walk_in():
    print("Testing Create Sale (Walk-in)...")
    
    # 1. Get/Create User for sold_by
    user_id = 1
    try:
        # Try to get users
        with urllib.request.urlopen(f"{BASE_URL}/users") as response:
            users = json.loads(response.read().decode())
            if isinstance(users, list) and len(users) > 0:
                user_id = users[0]['id']
                print(f"Using existing user ID: {user_id}")
            else:
                # Create user
                print("No users found. Creating 'Admin' user...")
                user_payload = {
                    "name": "Admin",
                    "email": "admin@example.com",
                    "password": "password123", # Insecure but fine for dev
                    "role": "admin",
                    "status": "active"
                }
                req = urllib.request.Request(
                    f"{BASE_URL}/users/",
                    data=json.dumps(user_payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                with urllib.request.urlopen(req) as resp:
                    new_user = json.loads(resp.read().decode())
                    user_id = new_user['id']
                    print(f"Created new user ID: {user_id}")
    except Exception as e:
        print(f"Error managing users: {e}")
        # Proceeding with default 1, might fail if constraint
    
    # 2. Get a medicine to sell (so we have a valid ID)
    try:
        with urllib.request.urlopen(f"{BASE_URL}/medicines") as response:
            response_data = json.loads(response.read().decode())
            if isinstance(response_data, dict) and 'data' in response_data:
                medicines = response_data['data']
            else:
                medicines = response_data
                
            if not medicines:
                print("No medicines found to sell.")
                return
            medicine = medicines[0]
            print(f"Selling medicine: {medicine['medicine_name']} (ID: {medicine['id']})")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error fetching medicines: {e}")
        return

    # 3. Create Sale Payload (Walk-in: customer_id is None)
    payload = {
        "customer_id": None,
        "sold_by": user_id,
        "items": [
            {
                "medicine_id": medicine['id'],
                "medicine_name": medicine['medicine_name'],
                "quantity": 1,
                "unit_price": medicine['price'] or 10.0,
                "batch_id": None,
                "expiry_date": None
            }
        ],
        "payment_method": "cash",
        "payment_status": "paid",
        "discount_amount": 0,
        "notes": "Test walk-in sale"
    }

    req = urllib.request.Request(
        f"{BASE_URL}/sales/",
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )

    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print("Sale Created Successfully:")
            print(json.dumps(data, indent=2))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}")
        error_body = e.read().decode()
        print(f"Body: {error_body}")
    except Exception as e:
        print(f"Error creating sale: {e}")

if __name__ == "__main__":
    test_create_sale_walk_in()
