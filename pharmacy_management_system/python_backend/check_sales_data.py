"""
Check if sales data exists in the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import execute_query

print("=" * 60)
print("CHECKING SALES DATA IN DATABASE")
print("=" * 60)

# Check sales table
print("\n1. Checking sales table...")
sales_query = "SELECT COUNT(*) as count FROM sales"
sales_result = execute_query(sales_query, fetch_one=True)
sales_count = sales_result['count'] if sales_result else 0
print(f"   Total sales records: {sales_count}")

if sales_count > 0:
    # Get recent sales
    recent_sales = execute_query("SELECT * FROM sales ORDER BY created_at DESC LIMIT 3")
    print(f"\n   Recent sales:")
    for sale in recent_sales:
        print(f"   - ID: {sale['id']}, Amount: {sale['final_amount']}, Date: {sale['created_at']}")

# Check sales_items table
print("\n2. Checking sales_items table...")
items_query = "SELECT COUNT(*) as count FROM sales_items"
items_result = execute_query(items_query, fetch_one=True)
items_count = items_result['count'] if items_result else 0
print(f"   Total sales items: {items_count}")

if items_count > 0:
    # Get sample items
    sample_items = execute_query("SELECT * FROM sales_items LIMIT 3")
    print(f"\n   Sample items:")
    for item in sample_items:
        print(f"   - Medicine: {item['medicine_name']}, Qty: {item['quantity']}, Price: {item['total_price']}")

# Test the daily sales query
print("\n3. Testing daily sales query...")
daily_query = """
    SELECT DATE(created_at) as date,
           COUNT(*) as transactions,
           SUM(final_amount) as sales
    FROM sales
    WHERE 1=1
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 5
"""
daily_results = execute_query(daily_query)
print(f"   Daily sales records found: {len(daily_results)}")
if daily_results:
    for day in daily_results:
        print(f"   - Date: {day['date']}, Transactions: {day['transactions']}, Sales: {day['sales']}")

# Test the top medicines query
print("\n4. Testing top medicines query...")
top_query = """
    SELECT si.medicine_id, si.medicine_name,
           SUM(si.quantity) as total_quantity,
           SUM(si.total_price) as total_revenue
    FROM sales_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE 1=1
    GROUP BY si.medicine_id, si.medicine_name
    ORDER BY total_quantity DESC
    LIMIT 5
"""
top_results = execute_query(top_query)
print(f"   Top medicines found: {len(top_results)}")
if top_results:
    for med in top_results:
        print(f"   - {med['medicine_name']}: {med['total_quantity']} units, Revenue: {med['total_revenue']}")

print("\n" + "=" * 60)
print("DATABASE CHECK COMPLETE")
print("=" * 60)
