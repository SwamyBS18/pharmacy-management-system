"""
Sales API Routes
Handles POS checkout, sales tracking, and statistics
"""
from flask import Blueprint, request, jsonify
from db import execute_query, execute_transaction, get_db_connection, release_db_connection
from psycopg2 import extras
import logging
from datetime import datetime
import random

logger = logging.getLogger(__name__)
sales_bp = Blueprint('sales', __name__)

def generate_invoice_number():
    """Generate unique invoice number"""
    timestamp = int(datetime.now().timestamp() * 1000)
    random_num = random.randint(100, 999)
    return f"INV-{timestamp}-{random_num}"

@sales_bp.route('/', methods=['GET'])
def get_sales():
    """Get all sales with pagination and filtering"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        start_date = request.args.get('startDate', '')
        end_date = request.args.get('endDate', '')
        customer_id = request.args.get('customerId', '')
        
        query = """
            SELECT s.*, c.name as customer_name, c.phone as customer_phone,
                   u.name as sold_by_name
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON s.sold_by = u.id
            WHERE 1=1
        """
        count_query = "SELECT COUNT(*) as count FROM sales WHERE 1=1"
        params = []
        
        if start_date:
            query += " AND DATE(s.created_at) >= %s"
            count_query += " AND DATE(created_at) >= %s"
            params.append(start_date)
        
        if end_date:
            query += " AND DATE(s.created_at) <= %s"
            count_query += " AND DATE(created_at) <= %s"
            params.append(end_date)
        
        if customer_id:
            query += " AND s.customer_id = %s"
            count_query += " AND customer_id = %s"
            params.append(customer_id)
        
        # Get total count
        total_result = execute_query(count_query, tuple(params) if params else None, fetch_one=True)
        total = total_result['count'] if total_result else 0
        
        # Add pagination
        offset = (page - 1) * limit
        query += " ORDER BY s.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        sales = execute_query(query, tuple(params) if params else None)
        
        return jsonify({
            'data': sales,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'totalPages': (total + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        logger.error(f"Error fetching sales: {e}")
        return jsonify({'error': 'Failed to fetch sales', 'details': str(e)}), 500

@sales_bp.route('/<int:sale_id>', methods=['GET'])
def get_sale(sale_id):
    """Get single sale with items"""
    try:
        sale_query = """
            SELECT s.*, c.name as customer_name, c.phone as customer_phone,
                   u.name as sold_by_name
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON s.sold_by = u.id
            WHERE s.id = %s
        """
        sale = execute_query(sale_query, (sale_id,), fetch_one=True)
        
        if not sale:
            return jsonify({'error': 'Sale not found'}), 404
        
        items_query = "SELECT * FROM sales_items WHERE sale_id = %s"
        items = execute_query(items_query, (sale_id,))
        
        result = dict(sale)
        result['items'] = items
        
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error fetching sale: {e}")
        return jsonify({'error': 'Failed to fetch sale', 'details': str(e)}), 500

@sales_bp.route('/', methods=['POST'])
def create_sale():
    """Create new sale (POS checkout)"""
    conn = None
    try:
        data = request.get_json()
        items = data.get('items', [])
        
        if not items:
            return jsonify({'error': 'Cart is empty'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
        
        # Calculate totals
        total_amount = sum(float(item['unit_price']) * int(item['quantity']) for item in items)
        tax_amount = total_amount * 0.10  # 10% tax
        discount_amount = float(data.get('discount_amount', 0))
        final_amount = total_amount + tax_amount - discount_amount
        
        # Generate invoice number
        invoice_number = generate_invoice_number()
        
        # Create sale record
        sale_query = """
            INSERT INTO sales (
                customer_id, invoice_number, total_amount, tax_amount, discount_amount,
                final_amount, payment_method, payment_status, sold_by, notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        sale_params = (
            data.get('customer_id'),
            invoice_number,
            total_amount,
            tax_amount,
            discount_amount,
            final_amount,
            data.get('payment_method', 'cash'),
            data.get('payment_status', 'paid'),
            data.get('sold_by', 1),
            data.get('notes')
        )
        
        cursor.execute(sale_query, sale_params)
        sale = cursor.fetchone()
        
        # Create sale items and update stock
        for item in items:
            # Insert sale item
            item_query = """
                INSERT INTO sales_items (
                    sale_id, medicine_id, medicine_name, quantity, unit_price, total_price, batch_id, expiry_date
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            item_params = (
                sale['id'],
                item['medicine_id'],
                item['medicine_name'],
                item['quantity'],
                item['unit_price'],
                item['unit_price'] * item['quantity'],
                item.get('batch_id'),
                item.get('expiry_date')
            )
            cursor.execute(item_query, item_params)
            
            # Update medicine stock
            cursor.execute(
                "UPDATE medicines SET stock = stock - %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (item['quantity'], item['medicine_id'])
            )
            
            # Update inventory if batch_id provided
            if item.get('batch_id'):
                cursor.execute(
                    "UPDATE inventory SET quantity = quantity - %s, updated_at = CURRENT_TIMESTAMP WHERE medicine_id = %s AND batch_id = %s",
                    (item['quantity'], item['medicine_id'], item['batch_id'])
                )
        
        # Update customer stats if customer_id provided
        if data.get('customer_id'):
            cursor.execute(
                """UPDATE customers SET 
                   total_purchases = total_purchases + %s,
                   last_purchase_date = CURRENT_DATE,
                   loyalty_points = loyalty_points + FLOOR(%s / 100),
                   updated_at = CURRENT_TIMESTAMP
                   WHERE id = %s""",
                (final_amount, final_amount, data['customer_id'])
            )
        
        conn.commit()
        
        # Fetch complete sale with items
        cursor.execute(
            """SELECT s.*, c.name as customer_name, c.phone as customer_phone
               FROM sales s
               LEFT JOIN customers c ON s.customer_id = c.id
               WHERE s.id = %s""",
            (sale['id'],)
        )
        complete_sale = cursor.fetchone()
        
        cursor.execute("SELECT * FROM sales_items WHERE sale_id = %s", (sale['id'],))
        sale_items = cursor.fetchall()
        
        cursor.close()
        
        result = dict(complete_sale)
        result['items'] = sale_items
        result['invoice_url'] = f'/api/billing/invoice/{sale["id"]}'
        result['download_url'] = f'/api/billing/download/{sale["id"]}'
        
        return jsonify(result), 201
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Error creating sale: {e}")
        return jsonify({'error': 'Failed to create sale', 'details': str(e)}), 500
    finally:
        if conn:
            release_db_connection(conn)

@sales_bp.route('/stats/summary', methods=['GET'])
def get_sales_stats():
    """Get sales statistics"""
    try:
        start_date = request.args.get('startDate', '')
        end_date = request.args.get('endDate', '')
        
        date_filter = ""
        params = []
        
        if start_date and end_date:
            date_filter = "WHERE DATE(created_at) BETWEEN %s AND %s"
            params = [start_date, end_date]
        elif start_date:
            date_filter = "WHERE DATE(created_at) >= %s"
            params = [start_date]
        elif end_date:
            date_filter = "WHERE DATE(created_at) <= %s"
            params = [end_date]
        
        # Total sales
        total_query = f"""
            SELECT COALESCE(SUM(final_amount), 0) as total_sales,
                   COALESCE(COUNT(*), 0) as total_transactions,
                   COALESCE(AVG(final_amount), 0) as avg_sale
            FROM sales {date_filter}
        """
        total_stats = execute_query(total_query, tuple(params) if params else None, fetch_one=True)
        
        # Daily sales
        daily_query = f"""
            SELECT DATE(created_at) as date,
                   COUNT(*) as transactions,
                   SUM(final_amount) as sales
            FROM sales {date_filter if date_filter else 'WHERE 1=1'}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        """
        daily_sales = execute_query(daily_query, tuple(params) if params else None)
        
        # Top selling medicines
        top_query = f"""
            SELECT si.medicine_id, si.medicine_name,
                   SUM(si.quantity) as total_quantity,
                   SUM(si.total_price) as total_revenue
            FROM sales_items si
            JOIN sales s ON si.sale_id = s.id
            {date_filter.replace('WHERE', 'WHERE s.') if date_filter else ''}
            GROUP BY si.medicine_id, si.medicine_name
            ORDER BY total_quantity DESC
            LIMIT 10
        """
        top_medicines = execute_query(top_query, tuple(params) if params else None)
        
        return jsonify({
            'summary': total_stats,
            'dailySales': daily_sales,
            'topMedicines': top_medicines
        }), 200
    except Exception as e:
        logger.error(f"Error fetching sales stats: {e}")
        return jsonify({'error': 'Failed to fetch sales stats', 'details': str(e)}), 500
