"""
Suppliers API Routes
Handles CRUD operations for supplier management
"""
from flask import Blueprint, request, jsonify
from db import execute_query
import logging

logger = logging.getLogger(__name__)
suppliers_bp = Blueprint('suppliers', __name__)

@suppliers_bp.route('/', methods=['GET'])
def get_suppliers():
    """Get all suppliers"""
    try:
        query = "SELECT * FROM suppliers ORDER BY name"
        suppliers = execute_query(query)
        return jsonify(suppliers), 200
    except Exception as e:
        logger.error(f"Error fetching suppliers: {e}")
        return jsonify({'error': 'Failed to fetch suppliers'}), 500

@suppliers_bp.route('/<int:supplier_id>', methods=['GET'])
def get_supplier(supplier_id):
    """Get single supplier by ID"""
    try:
        query = "SELECT * FROM suppliers WHERE id = %s"
        supplier = execute_query(query, (supplier_id,), fetch_one=True)
        
        if not supplier:
            return jsonify({'error': 'Supplier not found'}), 404
        
        return jsonify(supplier), 200
    except Exception as e:
        logger.error(f"Error fetching supplier: {e}")
        return jsonify({'error': 'Failed to fetch supplier'}), 500

@suppliers_bp.route('/', methods=['POST'])
def create_supplier():
    """Create new supplier"""
    try:
        data = request.get_json()
        
        query = """
            INSERT INTO suppliers (name, email, contact, address)
            VALUES (%s, %s, %s, %s)
            RETURNING *
        """
        params = (
            data.get('name'),
            data.get('email'),
            data.get('contact'),
            data.get('address')
        )
        
        supplier = execute_query(query, params, fetch_one=True)
        return jsonify(supplier), 201
    except Exception as e:
        logger.error(f"Error creating supplier: {e}")
        return jsonify({'error': 'Failed to create supplier'}), 500

@suppliers_bp.route('/<int:supplier_id>', methods=['PUT'])
def update_supplier(supplier_id):
    """Update supplier"""
    try:
        data = request.get_json()
        
        query = """
            UPDATE suppliers SET
                name = COALESCE(%s, name),
                email = COALESCE(%s, email),
                contact = COALESCE(%s, contact),
                address = COALESCE(%s, address),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING *
        """
        params = (
            data.get('name'),
            data.get('email'),
            data.get('contact'),
            data.get('address'),
            supplier_id
        )
        
        supplier = execute_query(query, params, fetch_one=True)
        
        if not supplier:
            return jsonify({'error': 'Supplier not found'}), 404
        
        return jsonify(supplier), 200
    except Exception as e:
        logger.error(f"Error updating supplier: {e}")
        return jsonify({'error': 'Failed to update supplier'}), 500

@suppliers_bp.route('/<int:supplier_id>', methods=['DELETE'])
def delete_supplier(supplier_id):
    """Delete supplier"""
    try:
        query = "DELETE FROM suppliers WHERE id = %s RETURNING *"
        supplier = execute_query(query, (supplier_id,), fetch_one=True)
        
        if not supplier:
            return jsonify({'error': 'Supplier not found'}), 404
        
        return jsonify({'message': 'Supplier deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting supplier: {e}")
        return jsonify({'error': 'Failed to delete supplier'}), 500
