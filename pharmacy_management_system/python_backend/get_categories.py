import urllib.request
import json

url = "http://localhost:5000/api/medicines?limit=5000"

try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())
        medicines = data['data']
        
        # Get unique categories
        categories = set()
        for med in medicines:
            if med.get('category'):
                categories.add(med['category'])
        
        print(f"Found {len(categories)} unique categories:\n")
        for cat in sorted(categories):
            print(f"  - {cat}")
            
except Exception as e:
    print(f"Error: {e}")
