"""
Inventory API Routes
Handles inventory management, stock tracking, and reorder suggestions
"""
from flask import Blueprint, request, jsonify
from db import execute_query, get_db_connection, release_db_connection
from psycopg2 import extras
import logging

logger = logging.getLogger(__name__)
inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/', methods=['GET'])
def get_inventory():
    """Get inventory with medicine details"""
    try:
        query = """
            SELECT 
                i.*,
                m.medicine_name,
                m.manufacturer,
                m.category,
                CASE 
                    WHEN i.expiry_date < CURRENT_DATE THEN 'expired'
                    WHEN i.quantity <= 0 THEN 'out_of_stock'
                    WHEN i.quantity < 50 THEN 'low'
                    ELSE 'normal'
                END as status
            FROM inventory i
            LEFT JOIN medicines m ON i.medicine_id = m.id
            ORDER BY i.expiry_date ASC, i.quantity ASC
        """
        inventory = execute_query(query)
        return jsonify(inventory), 200
    except Exception as e:
        logger.error(f"Error fetching inventory: {e}")
        return jsonify({'error': 'Failed to fetch inventory'}), 500

@inventory_bp.route('/expired', methods=['GET'])
def get_expired_drugs():
    """Get expired drugs"""
    try:
        query = """
            SELECT 
                i.*,
                m.medicine_name,
                m.manufacturer,
                s.name as supplier_name,
                s.email as supplier_email
            FROM inventory i
            LEFT JOIN medicines m ON i.medicine_id = m.id
            LEFT JOIN suppliers s ON i.supplier_id = s.id
            WHERE i.expiry_date < CURRENT_DATE
            ORDER BY i.expiry_date ASC
        """
        expired = execute_query(query)
        return jsonify(expired), 200
    except Exception as e:
        logger.error(f"Error fetching expired drugs: {e}")
        return jsonify({'error': 'Failed to fetch expired drugs'}), 500

@inventory_bp.route('/out-of-stock', methods=['GET'])
def get_out_of_stock():
    """Get out of stock items"""
    try:
        query = """
            SELECT 
                i.*,
                m.medicine_name,
                m.manufacturer,
                s.name as supplier_name,
                s.email as supplier_email
            FROM inventory i
            LEFT JOIN medicines m ON i.medicine_id = m.id
            LEFT JOIN suppliers s ON i.supplier_id = s.id
            WHERE i.quantity <= 0
            ORDER BY m.medicine_name
        """
        out_of_stock = execute_query(query)
        return jsonify(out_of_stock), 200
    except Exception as e:
        logger.error(f"Error fetching out of stock items: {e}")
        return jsonify({'error': 'Failed to fetch out of stock items'}), 500

@inventory_bp.route('/low-stock', methods=['GET'])
def get_low_stock():
    """Get low stock items"""
    try:
        query = """
            SELECT 
                i.*,
                m.medicine_name,
                m.manufacturer
            FROM inventory i
            LEFT JOIN medicines m ON i.medicine_id = m.id
            WHERE i.quantity > 0 AND i.quantity < 50
            ORDER BY i.quantity ASC
        """
        low_stock = execute_query(query)
        return jsonify(low_stock), 200
    except Exception as e:
        logger.error(f"Error fetching low stock items: {e}")
        return jsonify({'error': 'Failed to fetch low stock items'}), 500

@inventory_bp.route('/reorder-suggestions', methods=['GET'])
def get_reorder_suggestions():
    """Get reorder suggestions"""
    try:
        query = """
            SELECT 
                m.id as medicine_id,
                m.medicine_name,
                m.manufacturer,
                m.stock as current_stock,
                COALESCE(lst.threshold_quantity, 50) as threshold_quantity,
                COALESCE(lst.reorder_quantity, 100) as suggested_reorder_quantity,
                s.id as supplier_id,
                s.name as supplier_name,
                s.contact as supplier_contact
            FROM medicines m
            LEFT JOIN low_stock_thresholds lst ON m.id = lst.medicine_id
            LEFT JOIN inventory i ON m.id = i.medicine_id
            LEFT JOIN suppliers s ON i.supplier_id = s.id
            WHERE m.stock <= COALESCE(lst.threshold_quantity, 50)
            GROUP BY m.id, m.medicine_name, m.manufacturer, m.stock, 
                     lst.threshold_quantity, lst.reorder_quantity, s.id, s.name, s.contact
            ORDER BY m.stock ASC
        """
        suggestions = execute_query(query)
        return jsonify(suggestions), 200
    except Exception as e:
        logger.error(f"Error fetching reorder suggestions: {e}")
        return jsonify({'error': 'Failed to fetch reorder suggestions'}), 500

@inventory_bp.route('/', methods=['POST'])
def create_inventory_item():
    """Create new inventory batch and update medicine stock"""
    conn = None
    try:
        data = request.get_json()
        
        if not data.get('medicine_id') or not data.get('quantity'):
            return jsonify({'error': 'Medicine ID and quantity are required'}), 400
        
        medicine_id = data.get('medicine_id')
        quantity = int(data.get('quantity'))
        batch_id = data.get('batch_id')
        expiry_date = data.get('expiry_date')
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
        
        # Fetch medicine barcode for batch barcode generation
        med_query = "SELECT barcode FROM medicines WHERE id = %s"
        cursor.execute(med_query, (medicine_id,))
        medicine = cursor.fetchone()
        
        if not medicine or not medicine.get('barcode'):
            conn.rollback()
            return jsonify({'error': 'Medicine not found or has no barcode'}), 404
        
        # Generate batch barcode: {medicine_barcode}-BATCH{batch_id}-EXP{YYYYMMDD}
        medicine_barcode = medicine['barcode']
        expiry_formatted = expiry_date.replace('-', '') if expiry_date else 'NOEXP'
        batch_barcode = f"{medicine_barcode}-BATCH{batch_id}-EXP{expiry_formatted}"
        
        # 1. Insert into inventory with batch barcode
        inv_query = """
            INSERT INTO inventory (
                medicine_id, batch_id, quantity, expiry_date, 
                manufacturing_date, supplier_id, price, batch_barcode
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        inv_params = (
            medicine_id,
            batch_id,
            quantity,
            expiry_date,
            data.get('manufacturing_date'),
            data.get('supplier_id'),
            data.get('price'),
            batch_barcode
        )
        
        cursor.execute(inv_query, inv_params)
        inventory_item = cursor.fetchone()
        
        # 2. Update total stock in medicines table
        update_stock_query = """
            UPDATE medicines 
            SET stock = stock + %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        cursor.execute(update_stock_query, (quantity, medicine_id))
        
        conn.commit()
        cursor.close()
        
        return jsonify(inventory_item), 201
        
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Error creating inventory item: {e}")
        return jsonify({'error': 'Failed to create inventory item', 'details': str(e)}), 500
    finally:
        if conn:
            release_db_connection(conn)

@inventory_bp.route('/<int:inventory_id>', methods=['PUT'])
def update_inventory_item(inventory_id):
    """Update inventory item"""
    try:
        data = request.get_json()
        
        query = """
            UPDATE inventory SET
                batch_id = COALESCE(%s, batch_id),
                quantity = COALESCE(%s, quantity),
                expiry_date = COALESCE(%s, expiry_date),
                supplier_id = COALESCE(%s, supplier_id),
                price = COALESCE(%s, price),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING *
        """
        params = (
            data.get('batch_id'),
            data.get('quantity'),
            data.get('expiry_date'),
            data.get('supplier_id'),
            data.get('price'),
            inventory_id
        )
        
        inventory_item = execute_query(query, params, fetch_one=True)
        
        if not inventory_item:
            return jsonify({'error': 'Inventory item not found'}), 404
        
        return jsonify(inventory_item), 200
    except Exception as e:
        logger.error(f"Error updating inventory item: {e}")
        return jsonify({'error': 'Failed to update inventory item'}), 500

@inventory_bp.route('/<int:inventory_id>', methods=['DELETE'])
def delete_inventory_item(inventory_id):
    """Delete inventory item"""
    try:
        query = "DELETE FROM inventory WHERE id = %s RETURNING *"
        inventory_item = execute_query(query, (inventory_id,), fetch_one=True)
        
        if not inventory_item:
            return jsonify({'error': 'Inventory item not found'}), 404
        
        return jsonify({'message': 'Inventory item deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting inventory item: {e}")
        return jsonify({'error': 'Failed to delete inventory item'}), 500

@inventory_bp.route('/barcode/<barcode>', methods=['GET'])
def lookup_by_barcode(barcode):
    """Look up inventory batch by barcode and validate expiry"""
    try:
        from datetime import datetime, date
        
        # Try to find batch by batch_barcode first
        query = """
            SELECT i.*, m.medicine_name, m.manufacturer, m.category, m.price as medicine_price
            FROM inventory i
            JOIN medicines m ON i.medicine_id = m.id
            WHERE i.batch_barcode = %s
        """
        batch = execute_query(query, (barcode,), fetch_one=True)
        
        if not batch:
            # If not found, try medicine barcode (get all batches for that medicine)
            query = """
                SELECT i.*, m.medicine_name, m.manufacturer, m.category, m.price as medicine_price
                FROM inventory i
                JOIN medicines m ON i.medicine_id = m.id
                WHERE m.barcode = %s AND i.quantity > 0
                ORDER BY i.expiry_date ASC
            """
            batches = execute_query(query, (barcode,))
            
            if not batches:
                return jsonify({'error': 'No inventory found for this barcode'}), 404
            
            # Return first non-expired batch (FIFO)
            today = date.today()
            for batch in batches:
                expiry = batch.get('expiry_date')
                if expiry:
                    if isinstance(expiry, str):
                        expiry = datetime.strptime(expiry, '%Y-%m-%d').date()
                    
                    batch['is_expired'] = expiry < today
                    batch['days_until_expiry'] = (expiry - today).days
                else:
                    batch['is_expired'] = False
                    batch['days_until_expiry'] = None
            
            # Find first non-expired batch
            non_expired = [b for b in batches if not b['is_expired']]
            if non_expired:
                batch = non_expired[0]
                batch['alternative_batches'] = len(batches) - 1
            else:
                # All expired, return first with warning
                batch = batches[0]
                batch['all_expired'] = True
                batch['alternative_batches'] = len(batches) - 1
        else:
            # Single batch found, check expiry
            expiry = batch.get('expiry_date')
            today = date.today()
            
            if expiry:
                if isinstance(expiry, str):
                    expiry = datetime.strptime(expiry, '%Y-%m-%d').date()
                
                batch['is_expired'] = expiry < today
                batch['days_until_expiry'] = (expiry - today).days
            else:
                batch['is_expired'] = False
                batch['days_until_expiry'] = None
        
        return jsonify(batch), 200
        
    except Exception as e:
        logger.error(f"Error looking up barcode: {e}")
        return jsonify({'error': 'Failed to lookup barcode', 'details': str(e)}), 500

@inventory_bp.route('/thresholds', methods=['POST'])
def set_threshold():
    """Set low stock threshold"""
    try:
        data = request.get_json()
        
        if not data.get('medicine_id') or not data.get('threshold_quantity'):
            return jsonify({'error': 'Medicine ID and threshold quantity are required'}), 400
        
        query = """
            INSERT INTO low_stock_thresholds (medicine_id, threshold_quantity, auto_reorder, reorder_quantity)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (medicine_id) 
            DO UPDATE SET 
                threshold_quantity = EXCLUDED.threshold_quantity,
                auto_reorder = EXCLUDED.auto_reorder,
                reorder_quantity = EXCLUDED.reorder_quantity,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        """
        params = (
            data.get('medicine_id'),
            data.get('threshold_quantity'),
            data.get('auto_reorder', False),
            data.get('reorder_quantity', 100)
        )
        
        threshold = execute_query(query, params, fetch_one=True)
        return jsonify(threshold), 201
    except Exception as e:
        logger.error(f"Error setting threshold: {e}")
        return jsonify({'error': 'Failed to set threshold'}), 500
