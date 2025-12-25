"""
Pharmacy Management API Routes
Handles pharmacy profile operations
"""
from flask import Blueprint, request, jsonify
from db import execute_query
import logging
from middleware import require_auth, require_role

logger = logging.getLogger(__name__)
pharmacy_bp = Blueprint('pharmacy', __name__)

@pharmacy_bp.route('/profile', methods=['GET'])
@require_auth
def get_pharmacy_profile():
    """Get pharmacy profile"""
    try:
        user = request.current_user
        
        query = """
            SELECT id, pharmacy_name, address, phone, license_number, gst_number, 
                   email, is_profile_complete, created_at
            FROM pharmacy
            WHERE id = %s
        """
        pharmacy = execute_query(query, (user['pharmacy_id'],), fetch_one=True)
        
        if not pharmacy:
            return jsonify({'error': 'Pharmacy not found'}), 404
        
        return jsonify(pharmacy), 200
        
    except Exception as e:
        logger.error(f"Error fetching pharmacy profile: {e}")
        return jsonify({'error': 'Failed to fetch pharmacy profile'}), 500

@pharmacy_bp.route('/profile', methods=['PUT'])
@require_role('ADMIN')
def update_pharmacy_profile():
    """Update pharmacy profile (Admin only)"""
    try:
        data = request.get_json()
        user = request.current_user
        
        # Build update query dynamically based on provided fields
        update_fields = []
        params = []
        
        if 'pharmacy_name' in data:
            update_fields.append('pharmacy_name = %s')
            params.append(data['pharmacy_name'])
        
        if 'address' in data:
            update_fields.append('address = %s')
            params.append(data['address'])
        
        if 'phone' in data:
            update_fields.append('phone = %s')
            params.append(data['phone'])
        
        if 'license_number' in data:
            update_fields.append('license_number = %s')
            params.append(data['license_number'])
        
        if 'gst_number' in data:
            update_fields.append('gst_number = %s')
            params.append(data['gst_number'])
        
        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400
        
        update_fields.append('updated_at = CURRENT_TIMESTAMP')
        params.append(user['pharmacy_id'])
        
        query = f"""
            UPDATE pharmacy
            SET {', '.join(update_fields)}
            WHERE id = %s
            RETURNING id, pharmacy_name, address, phone, license_number, gst_number, 
                      email, is_profile_complete
        """
        
        pharmacy = execute_query(query, tuple(params), fetch_one=True)
        
        return jsonify({
            'message': 'Pharmacy profile updated successfully',
            'pharmacy': pharmacy
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating pharmacy profile: {e}")
        return jsonify({'error': 'Failed to update pharmacy profile'}), 500
