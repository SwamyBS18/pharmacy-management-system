"""
Test script to verify sales API endpoints return data correctly
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5000/api"

def test_sales_stats():
    """Test the sales stats summary endpoint"""
    print("=" * 60)
    print("Testing Sales Stats Summary Endpoint")
    print("=" * 60)
    
    # Calculate date range (last 30 days)
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    
    url = f"{BASE_URL}/sales/stats/summary"
    params = {
        'startDate': start_date,
        'endDate': end_date
    }
    
    print(f"\nRequest URL: {url}")
    print(f"Parameters: {params}")
    
    try:
        response = requests.get(url, params=params)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ SUCCESS - Response received")
            print("\n" + "=" * 60)
            print("RESPONSE DATA:")
            print("=" * 60)
            print(json.dumps(data, indent=2, default=str))
            
            # Check data structure
            print("\n" + "=" * 60)
            print("DATA ANALYSIS:")
            print("=" * 60)
            
            if 'summary' in data:
                print(f"\n✅ Summary data present:")
                print(f"   - Total Sales: {data['summary'].get('total_sales', 0)}")
                print(f"   - Total Transactions: {data['summary'].get('total_transactions', 0)}")
                print(f"   - Average Sale: {data['summary'].get('avg_sale', 0)}")
            else:
                print("\n❌ No summary data found")
            
            if 'dailySales' in data:
                daily_count = len(data['dailySales'])
                print(f"\n✅ Daily Sales data present: {daily_count} days")
                if daily_count > 0:
                    print(f"   First entry: {data['dailySales'][0]}")
                    print(f"   Last entry: {data['dailySales'][-1]}")
                else:
                    print("   ⚠️  No daily sales records found")
            else:
                print("\n❌ No dailySales data found")
            
            if 'topMedicines' in data:
                top_count = len(data['topMedicines'])
                print(f"\n✅ Top Medicines data present: {top_count} medicines")
                if top_count > 0:
                    print(f"   Top medicine: {data['topMedicines'][0]}")
                else:
                    print("   ⚠️  No top medicines records found")
            else:
                print("\n❌ No topMedicines data found")
                
        else:
            print(f"\n❌ ERROR - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"\n❌ EXCEPTION occurred: {str(e)}")

def test_sales_list():
    """Test the sales list endpoint"""
    print("\n\n" + "=" * 60)
    print("Testing Sales List Endpoint")
    print("=" * 60)
    
    url = f"{BASE_URL}/sales"
    params = {'limit': 10}
    
    print(f"\nRequest URL: {url}")
    print(f"Parameters: {params}")
    
    try:
        response = requests.get(url, params=params)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ SUCCESS - Response received")
            
            if 'data' in data:
                sales_count = len(data['data'])
                print(f"\n✅ Sales records found: {sales_count}")
                if sales_count > 0:
                    print(f"\nFirst sale record:")
                    print(json.dumps(data['data'][0], indent=2, default=str))
            else:
                print("\n❌ No 'data' field in response")
                
            if 'pagination' in data:
                print(f"\n✅ Pagination info:")
                print(f"   Total records: {data['pagination'].get('total', 0)}")
            
        else:
            print(f"\n❌ ERROR - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"\n❌ EXCEPTION occurred: {str(e)}")

if __name__ == "__main__":
    print("\n🔍 SALES API TEST SCRIPT")
    print("=" * 60)
    print("This script tests the sales API endpoints")
    print("Make sure the backend server is running on localhost:5000")
    print("=" * 60)
    
    test_sales_stats()
    test_sales_list()
    
    print("\n\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
