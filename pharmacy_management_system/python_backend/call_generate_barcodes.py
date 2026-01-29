import urllib.request
import json

url = "http://localhost:5000/api/medicines/generate-barcodes"

try:
    req = urllib.request.Request(url, method='POST')
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error: {e}")
