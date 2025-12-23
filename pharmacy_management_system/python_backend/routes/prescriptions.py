"""
Prescriptions API Routes
Handles prescription management with customer linking
"""
from flask import Blueprint, request, jsonify
from db import execute_query, get_db_connection, release_db_connection
from psycopg2 import extras
import logging

logger = logging.getLogger(__name__)
prescriptions_bp = Blueprint('prescriptions', __name__)

@prescriptions_bp.route('/', methods=['GET'])
def get_prescriptions():
    """Get all prescriptions with pagination and filtering"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        customer_id = request.args.get('customerId', '')
        doctor_name = request.args.get('doctorName', '')
        status = request.args.get('status', '')
        
        query = """
            SELECT p.*, c.name as customer_name, c.phone as customer_phone
            FROM prescriptions p
            LEFT JOIN customers c ON p.customer_id = c.id
            WHERE 1=1
        """
        count_query = "SELECT COUNT(*) as count FROM prescriptions WHERE 1=1"
        params = []
        
        if customer_id:
            query += " AND p.customer_id = %s"
            count_query += " AND customer_id = %s"
            params.append(customer_id)
        
        if doctor_name:
            query += " AND p.doctor_name ILIKE %s"
            count_query += " AND doctor_name ILIKE %s"
            params.append(f'%{doctor_name}%')
        
        if status:
            query += " AND p.status = %s"
            count_query += " AND status = %s"
            params.append(status)
        
        # Get total count
        total_result = execute_query(count_query, tuple(params) if params else None, fetch_one=True)
        total = total_result['count'] if total_result else 0
        
        # Add pagination
        offset = (page - 1) * limit
        query += " ORDER BY p.prescription_date DESC, p.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        prescriptions = execute_query(query, tuple(params) if params else None)
        
        return jsonify({
            'data': prescriptions,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'totalPages': (total + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        logger.error(f"Error fetching prescriptions: {e}")
        return jsonify({'error': 'Failed to fetch prescriptions', 'details': str(e)}), 500

@prescriptions_bp.route('/<int:prescription_id>', methods=['GET'])
def get_prescription(prescription_id):
    """Get single prescription with items"""
    try:
        prescription_query = """
            SELECT p.*, c.name as customer_name, c.phone as customer_phone
            FROM prescriptions p
            LEFT JOIN customers c ON p.customer_id = c.id
            WHERE p.id = %s
        """
        prescription = execute_query(prescription_query, (prescription_id,), fetch_one=True)
        
        if not prescription:
            return jsonify({'error': 'Prescription not found'}), 404
        
        items_query = "SELECT * FROM prescription_items WHERE prescription_id = %s"
        items = execute_query(items_query, (prescription_id,))
        
        result = dict(prescription)
        result['items'] = items
        
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error fetching prescription: {e}")
        return jsonify({'error': 'Failed to fetch prescription', 'details': str(e)}), 500

@prescriptions_bp.route('/', methods=['POST'])
def create_prescription():
    """Create new prescription"""
    conn = None
    try:
        data = request.get_json()
        
        if not data.get('doctor_name') or not data.get('prescription_date'):
            return jsonify({'error': 'Doctor name and prescription date are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
        
        # Create prescription
        prescription_query = """
            INSERT INTO prescriptions (
                customer_id, doctor_name, doctor_id, doctor_contact,
                prescription_date, expiry_date, image_url, notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        prescription_params = (
            data.get('customer_id'),
            data.get('doctor_name'),
            data.get('doctor_id'),
            data.get('doctor_contact'),
            data.get('prescription_date'),
            data.get('expiry_date'),
            data.get('image_url'),
            data.get('notes')
        )
        
        cursor.execute(prescription_query, prescription_params)
        prescription = cursor.fetchone()
        
        # Create prescription items
        items = data.get('items', [])
        if items:
            for item in items:
                item_query = """
                    INSERT INTO prescription_items (
                        prescription_id, medicine_id, medicine_name, quantity,
                        dosage, frequency, duration, instructions
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                item_params = (
                    prescription['id'],
                    item.get('medicine_id'),
                    item.get('medicine_name'),
                    item.get('quantity', 1),
                    item.get('dosage'),
                    item.get('frequency'),
                    item.get('duration'),
                    item.get('instructions')
                )
                cursor.execute(item_query, item_params)
        
        conn.commit()
        
        # Fetch complete prescription
        cursor.execute(
            """SELECT p.*, c.name as customer_name
               FROM prescriptions p
               LEFT JOIN customers c ON p.customer_id = c.id
               WHERE p.id = %s""",
            (prescription['id'],)
        )
        complete_prescription = cursor.fetchone()
        
        cursor.execute("SELECT * FROM prescription_items WHERE prescription_id = %s", (prescription['id'],))
        prescription_items = cursor.fetchall()
        
        cursor.close()
        
        result = dict(complete_prescription)
        result['items'] = prescription_items
        
        return jsonify(result), 201
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Error creating prescription: {e}")
        return jsonify({'error': 'Failed to create prescription', 'details': str(e)}), 500
    finally:
        if conn:
            release_db_connection(conn)

@prescriptions_bp.route('/<int:prescription_id>', methods=['PUT'])
def update_prescription(prescription_id):
    """Update prescription"""
    try:
        data = request.get_json()
        
        allowed_fields = [
            'doctor_name', 'doctor_id', 'doctor_contact',
            'prescription_date', 'expiry_date', 'image_url', 'notes', 'status'
        ]
        update_fields = []
        params = []
        
        for field in allowed_fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                params.append(data[field])
        
        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(prescription_id)
        
        query = f"UPDATE prescriptions SET {', '.join(update_fields)} WHERE id = %s RETURNING *"
        prescription = execute_query(query, tuple(params), fetch_one=True)
        
        if not prescription:
            return jsonify({'error': 'Prescription not found'}), 404
        
        return jsonify(prescription), 200
    except Exception as e:
        logger.error(f"Error updating prescription: {e}")
        return jsonify({'error': 'Failed to update prescription', 'details': str(e)}), 500

@prescriptions_bp.route('/expired/list', methods=['GET'])
def get_expired_prescriptions():
    """Get expired prescriptions"""
    try:
        query = """
            SELECT p.*, c.name as customer_name
            FROM prescriptions p
            LEFT JOIN customers c ON p.customer_id = c.id
            WHERE p.expiry_date < CURRENT_DATE AND p.status = 'active'
            ORDER BY p.expiry_date DESC
        """
        expired = execute_query(query)
        return jsonify(expired), 200
    except Exception as e:
        logger.error(f"Error fetching expired prescriptions: {e}")
        return jsonify({'error': 'Failed to fetch expired prescriptions', 'details': str(e)}), 500
