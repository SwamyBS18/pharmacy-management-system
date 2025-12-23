"""
Dashboard API Routes
Provides statistics and analytics for dashboard
"""
from flask import Blueprint, request, jsonify
from db import execute_query
import logging

logger = logging.getLogger(__name__)
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
def get_dashboard_stats():
    """Get overall dashboard statistics"""
    try:
        # Total medicines
        medicines_query = "SELECT COUNT(*) as total FROM medicines"
        medicines_result = execute_query(medicines_query, fetch_one=True)
        
        # Total suppliers
        suppliers_query = "SELECT COUNT(*) as total FROM suppliers"
        suppliers_result = execute_query(suppliers_query, fetch_one=True)
        
        # Total customers
        customers_query = "SELECT COUNT(*) as total FROM customers"
        customers_result = execute_query(customers_query, fetch_one=True)
        
        # Low stock count
        low_stock_query = "SELECT COUNT(*) as total FROM medicines WHERE stock < 50"
        low_stock_result = execute_query(low_stock_query, fetch_one=True)
        
        # Out of stock count
        out_of_stock_query = "SELECT COUNT(*) as total FROM medicines WHERE stock <= 0"
        out_of_stock_result = execute_query(out_of_stock_query, fetch_one=True)
        
        # Expired medicines count
        expired_query = "SELECT COUNT(*) as total FROM inventory WHERE expiry_date < CURRENT_DATE"
        expired_result = execute_query(expired_query, fetch_one=True)
        
        # Today's sales
        today_sales_query = """
            SELECT COALESCE(SUM(final_amount), 0) as total,
                   COALESCE(COUNT(*), 0) as count
            FROM sales 
            WHERE DATE(created_at) = CURRENT_DATE
        """
        today_sales = execute_query(today_sales_query, fetch_one=True)
        
        # This month's sales
        month_sales_query = """
            SELECT COALESCE(SUM(final_amount), 0) as total,
                   COALESCE(COUNT(*), 0) as count
            FROM sales 
            WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
        """
        month_sales = execute_query(month_sales_query, fetch_one=True)
        
        # Pending orders
        pending_orders_query = "SELECT COUNT(*) as total FROM orders WHERE status = 'pending'"
        pending_orders = execute_query(pending_orders_query, fetch_one=True)
        
        return jsonify({
            'medicines': {
                'total': medicines_result['total'],
                'lowStock': low_stock_result['total'],
                'outOfStock': out_of_stock_result['total']
            },
            'suppliers': {
                'total': suppliers_result['total']
            },
            'customers': {
                'total': customers_result['total']
            },
            'inventory': {
                'expired': expired_result['total'],
                'lowStock': low_stock_result['total'],
                'outOfStock': out_of_stock_result['total']
            },
            'sales': {
                'today': {
                    'amount': float(today_sales['total']),
                    'count': today_sales['count']
                },
                'thisMonth': {
                    'amount': float(month_sales['total']),
                    'count': month_sales['count']
                }
            },
            'orders': {
                'pending': pending_orders['total']
            }
        }), 200
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        return jsonify({'error': 'Failed to fetch dashboard stats', 'details': str(e)}), 500

@dashboard_bp.route('/recent-activity', methods=['GET'])
def get_recent_activity():
    """Get recent activity"""
    try:
        limit = int(request.args.get('limit', 10))
        
        # Recent sales
        sales_query = """
            SELECT s.id, s.invoice_number, s.final_amount, s.created_at,
                   c.name as customer_name, 'sale' as activity_type
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            ORDER BY s.created_at DESC
            LIMIT %s
        """
        recent_sales = execute_query(sales_query, (limit,))
        
        # Recent orders
        orders_query = """
            SELECT id, doctor_name as name, total, status, created_at, 'order' as activity_type
            FROM orders
            ORDER BY created_at DESC
            LIMIT %s
        """
        recent_orders = execute_query(orders_query, (limit,))
        
        # Combine and sort
        activities = list(recent_sales) + list(recent_orders)
        activities.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify(activities[:limit]), 200
    except Exception as e:
        logger.error(f"Error fetching recent activity: {e}")
        return jsonify({'error': 'Failed to fetch recent activity', 'details': str(e)}), 500

@dashboard_bp.route('/alerts', methods=['GET'])
def get_alerts():
    """Get system alerts"""
    try:
        alerts = []
        
        # Low stock alerts
        low_stock_query = """
            SELECT id, medicine_name, stock
            FROM medicines
            WHERE stock > 0 AND stock < 50
            ORDER BY stock ASC
            LIMIT 5
        """
        low_stock = execute_query(low_stock_query)
        for item in low_stock:
            alerts.append({
                'type': 'warning',
                'category': 'low_stock',
                'message': f"{item['medicine_name']} is running low (Stock: {item['stock']})",
                'medicine_id': item['id']
            })
        
        # Out of stock alerts
        out_of_stock_query = """
            SELECT id, medicine_name
            FROM medicines
            WHERE stock <= 0
            LIMIT 5
        """
        out_of_stock = execute_query(out_of_stock_query)
        for item in out_of_stock:
            alerts.append({
                'type': 'danger',
                'category': 'out_of_stock',
                'message': f"{item['medicine_name']} is out of stock",
                'medicine_id': item['id']
            })
        
        # Expired medicines
        expired_query = """
            SELECT i.id, m.medicine_name, i.expiry_date
            FROM inventory i
            JOIN medicines m ON i.medicine_id = m.id
            WHERE i.expiry_date < CURRENT_DATE
            ORDER BY i.expiry_date DESC
            LIMIT 5
        """
        expired = execute_query(expired_query)
        for item in expired:
            alerts.append({
                'type': 'danger',
                'category': 'expired',
                'message': f"{item['medicine_name']} has expired (Expiry: {item['expiry_date']})",
                'inventory_id': item['id']
            })
        
        # Expiring soon (within 30 days)
        expiring_query = """
            SELECT i.id, m.medicine_name, i.expiry_date
            FROM inventory i
            JOIN medicines m ON i.medicine_id = m.id
            WHERE i.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
            ORDER BY i.expiry_date ASC
            LIMIT 5
        """
        expiring = execute_query(expiring_query)
        for item in expiring:
            alerts.append({
                'type': 'warning',
                'category': 'expiring_soon',
                'message': f"{item['medicine_name']} expiring soon (Expiry: {item['expiry_date']})",
                'inventory_id': item['id']
            })
        
        return jsonify(alerts), 200
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        return jsonify({'error': 'Failed to fetch alerts', 'details': str(e)}), 500
