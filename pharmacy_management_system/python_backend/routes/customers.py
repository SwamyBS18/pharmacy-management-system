"""
Customers API Routes
Handles customer management and purchase history
"""
from flask import Blueprint, request, jsonify
from db import execute_query
import logging

logger = logging.getLogger(__name__)
customers_bp = Blueprint('customers', __name__)

@customers_bp.route('/', methods=['GET'])
def get_customers():
    """Get all customers with pagination and search"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        search = request.args.get('search', '')
        
        query = "SELECT * FROM customers WHERE 1=1"
        count_query = "SELECT COUNT(*) as count FROM customers WHERE 1=1"
        params = []
        
        if search:
            query += " AND (name ILIKE %s OR phone ILIKE %s OR email ILIKE %s)"
            count_query += " AND (name ILIKE %s OR phone ILIKE %s OR email ILIKE %s)"
            search_param = f'%{search}%'
            params.extend([search_param, search_param, search_param])
        
        # Get total count
        total_result = execute_query(count_query, tuple(params) if params else None, fetch_one=True)
        total = total_result['count'] if total_result else 0
        
        # Add pagination
        offset = (page - 1) * limit
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        customers = execute_query(query, tuple(params) if params else None)
        
        return jsonify({
            'data': customers,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'totalPages': (total + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        logger.error(f"Error fetching customers: {e}")
        return jsonify({'error': 'Failed to fetch customers', 'details': str(e)}), 500

@customers_bp.route('/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    """Get single customer with purchase history"""
    try:
        # Get customer
        customer_query = "SELECT * FROM customers WHERE id = %s"
        customer = execute_query(customer_query, (customer_id,), fetch_one=True)
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Get purchase history
        sales_query = """
            SELECT s.*, 
                   (SELECT COUNT(*) FROM sales_items WHERE sale_id = s.id) as item_count
            FROM sales s
            WHERE s.customer_id = %s
            ORDER BY s.created_at DESC
            LIMIT 50
        """
        purchase_history = execute_query(sales_query, (customer_id,))
        
        # Get prescriptions
        prescriptions_query = """
            SELECT * FROM prescriptions 
            WHERE customer_id = %s 
            ORDER BY created_at DESC
        """
        prescriptions = execute_query(prescriptions_query, (customer_id,))
        
        result = dict(customer)
        result['purchaseHistory'] = purchase_history
        result['prescriptions'] = prescriptions
        
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error fetching customer: {e}")
        return jsonify({'error': 'Failed to fetch customer', 'details': str(e)}), 500

@customers_bp.route('/', methods=['POST'])
def create_customer():
    """Create new customer"""
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'error': 'Customer name is required'}), 400
        
        query = """
            INSERT INTO customers (name, email, phone, address, date_of_birth, gender)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        params = (
            data.get('name'),
            data.get('email'),
            data.get('phone'),
            data.get('address'),
            data.get('date_of_birth'),
            data.get('gender')
        )
        
        customer = execute_query(query, params, fetch_one=True)
        return jsonify(customer), 201
    except Exception as e:
        logger.error(f"Error creating customer: {e}")
        if 'duplicate key' in str(e).lower():
            return jsonify({'error': 'Customer with this email or phone already exists'}), 400
        return jsonify({'error': 'Failed to create customer', 'details': str(e)}), 500

@customers_bp.route('/<int:customer_id>', methods=['PUT'])
def update_customer(customer_id):
    """Update customer"""
    try:
        data = request.get_json()
        
        allowed_fields = ['name', 'email', 'phone', 'address', 'date_of_birth', 'gender']
        update_fields = []
        params = []
        
        for field in allowed_fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                params.append(data[field])
        
        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(customer_id)
        
        query = f"UPDATE customers SET {', '.join(update_fields)} WHERE id = %s RETURNING *"
        customer = execute_query(query, tuple(params), fetch_one=True)
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        return jsonify(customer), 200
    except Exception as e:
        logger.error(f"Error updating customer: {e}")
        return jsonify({'error': 'Failed to update customer', 'details': str(e)}), 500

@customers_bp.route('/<int:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    """Delete customer"""
    try:
        query = "DELETE FROM customers WHERE id = %s RETURNING *"
        customer = execute_query(query, (customer_id,), fetch_one=True)
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        return jsonify({'message': 'Customer deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting customer: {e}")
        return jsonify({'error': 'Failed to delete customer', 'details': str(e)}), 500
