"""
Orders API Routes
Handles order management with status filtering
"""
from flask import Blueprint, request, jsonify
from db import execute_query
import logging

logger = logging.getLogger(__name__)
orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/', methods=['GET'])
def get_orders():
    """Get all orders with pagination and filtering"""
    try:
        status = request.args.get('status', '')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        
        query = "SELECT * FROM orders WHERE 1=1"
        count_query = "SELECT COUNT(*) as count FROM orders WHERE 1=1"
        params = []
        
        if status:
            query += " AND status = %s"
            count_query += " AND status = %s"
            params.append(status)
        
        # Get total count
        total_result = execute_query(count_query, tuple(params) if params else None, fetch_one=True)
        total = total_result['count'] if total_result else 0
        
        # Add pagination
        offset = (page - 1) * limit
        query += " ORDER BY order_date DESC, created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        orders = execute_query(query, tuple(params) if params else None)
        
        return jsonify({
            'data': orders,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'totalPages': (total + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        logger.error(f"Error fetching orders: {e}")
        return jsonify({'error': 'Failed to fetch orders'}), 500

@orders_bp.route('/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """Get single order"""
    try:
        query = "SELECT * FROM orders WHERE id = %s"
        order = execute_query(query, (order_id,), fetch_one=True)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        return jsonify(order), 200
    except Exception as e:
        logger.error(f"Error fetching order: {e}")
        return jsonify({'error': 'Failed to fetch order'}), 500

@orders_bp.route('/', methods=['POST'])
def create_order():
    """Create new order"""
    try:
        data = request.get_json()
        
        query = """
            INSERT INTO orders (
                doctor_name, doctor_id, contact, email, drugs, quantity, total, status, order_date
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        params = (
            data.get('doctor_name'),
            data.get('doctor_id'),
            data.get('contact'),
            data.get('email'),
            data.get('drugs'),
            data.get('quantity'),
            data.get('total'),
            data.get('status', 'pending'),
            data.get('order_date')
        )
        
        order = execute_query(query, params, fetch_one=True)
        return jsonify(order), 201
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        return jsonify({'error': 'Failed to create order'}), 500

@orders_bp.route('/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    """Update order"""
    try:
        data = request.get_json()
        
        update_fields = []
        params = []
        
        for key, value in data.items():
            if key not in ['id', 'created_at']:
                update_fields.append(f"{key} = %s")
                params.append(value)
        
        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(order_id)
        
        query = f"UPDATE orders SET {', '.join(update_fields)} WHERE id = %s RETURNING *"
        order = execute_query(query, tuple(params), fetch_one=True)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        return jsonify(order), 200
    except Exception as e:
        logger.error(f"Error updating order: {e}")
        return jsonify({'error': 'Failed to update order'}), 500

@orders_bp.route('/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    """Delete order"""
    try:
        query = "DELETE FROM orders WHERE id = %s RETURNING *"
        order = execute_query(query, (order_id,), fetch_one=True)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        return jsonify({'message': 'Order deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting order: {e}")
        return jsonify({'error': 'Failed to delete order'}), 500
