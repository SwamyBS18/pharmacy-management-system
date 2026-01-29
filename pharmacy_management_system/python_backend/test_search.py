import urllib.request
import json
import urllib.parse
import sys

BASE_URL = "http://127.0.0.1:5000/api/medicines"
OUTPUT_FILE = "test_output.txt"

def log(msg):
    with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg)

# Clear file
with open(OUTPUT_FILE, "w") as f:
    pass

def search(query=None):
    url = BASE_URL
    params = {'limit': 100}
    if query:
        params['search'] = query
    
    query_string = urllib.parse.urlencode(params)
    full_url = f"{url}?{query_string}"
    
    try:
        with urllib.request.urlopen(full_url) as response:
            data = json.loads(response.read().decode())
            return data['data']
    except Exception as e:
        log(f"Error fetching {full_url}: {e}")
        return []

log("--- Fetching all medicines (limit 100) ---")
all_meds = search()
log(f"Found {len(all_meds)} medicines.")

if not all_meds:
    log("No medicines found, cannot test search.")
    sys.exit()

target_med = all_meds[0]['medicine_name']
log(f"First medicine: {target_med}")

# Test substring
if len(target_med) >= 3:
    substring = target_med[1:3]
else:
    substring = target_med
    
log(f"\n--- Searching for substring '{substring}' (from '{target_med}') ---")
results = search(substring)
log(f"Found {len(results)} matches.")
found = False
for m in results:
    if m['medicine_name'] == target_med:
        found = True
        break

if found:
    log(f"SUCCESS: Found '{target_med}' when searching for '{substring}'.")
else:
    log(f"FAILURE: Did NOT find '{target_med}' when searching for '{substring}'.")

# Test startswith
first_char = target_med[0]
log(f"\n--- Searching for start char '{first_char}' ---")
results_start = search(first_char)
log(f"Found {len(results_start)} matches for start char '{first_char}'.")
