import os
import sys
from db import execute_query

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def list_suppliers():
    try:
        suppliers = execute_query("SELECT id, name FROM suppliers LIMIT 5;")
        for s in suppliers:
            print(f"ID: {s['id']}, Name: {s['name']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_suppliers()
