"""
Medicines API Routes
Handles medicine management with search, filtering, and barcode lookup
"""
from flask import Blueprint, request, jsonify
from db import execute_query
import logging

logger = logging.getLogger(__name__)
medicines_bp = Blueprint('medicines', __name__)

@medicines_bp.route('/', methods=['GET'])
def get_medicines():
    """Get all medicines with pagination and filtering"""
    try:
        search = request.args.get('search', '')
        manufacturer = request.args.get('manufacturer', '')
        category = request.args.get('category', '')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        
        # Build query
        query = "SELECT * FROM medicines WHERE 1=1"
        count_query = "SELECT COUNT(*) as count FROM medicines WHERE 1=1"
        params = []
        param_count = 1
        
        if search:
            query += f" AND (medicine_name ILIKE %s OR composition ILIKE %s)"
            count_query += f" AND (medicine_name ILIKE %s OR composition ILIKE %s)"
            params.extend([f'%{search}%', f'%{search}%'])
            param_count += 2
        
        if manufacturer:
            query += f" AND manufacturer = %s"
            count_query += f" AND manufacturer = %s"
            params.append(manufacturer)
            param_count += 1
        
        if category:
            query += f" AND category = %s"
            count_query += f" AND category = %s"
            params.append(category)
            param_count += 1
        
        # Get total count
        total_result = execute_query(count_query, tuple(params) if params else None, fetch_one=True)
        total = total_result['count'] if total_result else 0
        
        # Add pagination
        offset = (page - 1) * limit
        query += f" ORDER BY medicine_name LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        medicines = execute_query(query, tuple(params) if params else None)
        
        return jsonify({
            'data': medicines,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'totalPages': (total + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        logger.error(f"Error fetching medicines: {e}")
        return jsonify({'error': 'Failed to fetch medicines', 'details': str(e)}), 500

@medicines_bp.route('/<int:medicine_id>', methods=['GET'])
def get_medicine(medicine_id):
    """Get single medicine by ID"""
    try:
        query = "SELECT * FROM medicines WHERE id = %s"
        medicine = execute_query(query, (medicine_id,), fetch_one=True)
        
        if not medicine:
            return jsonify({'error': 'Medicine not found'}), 404
        
        return jsonify(medicine), 200
    except Exception as e:
        logger.error(f"Error fetching medicine: {e}")
        return jsonify({'error': 'Failed to fetch medicine'}), 500

@medicines_bp.route('/barcode/<barcode>', methods=['GET'])
def get_medicine_by_barcode(barcode):
    """Get medicine by barcode"""
    try:
        query = "SELECT * FROM medicines WHERE barcode = %s"
        medicine = execute_query(query, (barcode,), fetch_one=True)
        
        if not medicine:
            return jsonify({'error': 'Medicine not found'}), 404
        
        return jsonify(medicine), 200
    except Exception as e:
        logger.error(f"Error fetching medicine by barcode: {e}")
        return jsonify({'error': 'Failed to fetch medicine'}), 500

@medicines_bp.route('/manufacturers/list', methods=['GET'])
def get_manufacturers():
    """Get unique manufacturers list"""
    try:
        query = """
            SELECT DISTINCT manufacturer 
            FROM medicines 
            WHERE manufacturer IS NOT NULL AND manufacturer != '' 
            ORDER BY manufacturer
        """
        results = execute_query(query)
        manufacturers = [row['manufacturer'] for row in results]
        return jsonify(manufacturers), 200
    except Exception as e:
        logger.error(f"Error fetching manufacturers: {e}")
        return jsonify({'error': 'Failed to fetch manufacturers'}), 500

@medicines_bp.route('/categories/list', methods=['GET'])
def get_categories():
    """Get unique categories list"""
    try:
        query = """
            SELECT DISTINCT category 
            FROM medicines 
            WHERE category IS NOT NULL AND category != '' 
            ORDER BY category
        """
        results = execute_query(query)
        categories = [row['category'] for row in results]
        return jsonify(categories), 200
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        return jsonify({'error': 'Failed to fetch categories'}), 500

@medicines_bp.route('/', methods=['POST'])
def create_medicine():
    """Create new medicine"""
    try:
        data = request.get_json()
        
        # Generate barcode if not provided
        barcode = data.get('barcode')
        if not barcode:
            # Get next ID for barcode generation
            id_query = "SELECT nextval('medicines_id_seq')"
            result = execute_query(id_query, fetch_one=True)
            next_id = result['nextval']
            barcode = '200' + str(next_id).zfill(10)
        
        query = """
            INSERT INTO medicines (
                medicine_name, composition, uses, side_effects, image_url,
                manufacturer, excellent_review_percent, average_review_percent, 
                poor_review_percent, price, stock, category, barcode
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        params = (
            data.get('medicine_name'),
            data.get('composition'),
            data.get('uses'),
            data.get('side_effects'),
            data.get('image_url'),
            data.get('manufacturer'),
            data.get('excellent_review_percent', 0),
            data.get('average_review_percent', 0),
            data.get('poor_review_percent', 0),
            data.get('price', 0),
            data.get('stock', 0),
            data.get('category'),
            barcode
        )
        
        medicine = execute_query(query, params, fetch_one=True)
        return jsonify(medicine), 201
    except Exception as e:
        logger.error(f"Error creating medicine: {e}")
        return jsonify({'error': 'Failed to create medicine'}), 500

@medicines_bp.route('/<int:medicine_id>', methods=['PUT'])
def update_medicine(medicine_id):
    """Update medicine"""
    try:
        data = request.get_json()
        
        query = """
            UPDATE medicines SET
                medicine_name = COALESCE(%s, medicine_name),
                composition = COALESCE(%s, composition),
                uses = COALESCE(%s, uses),
                side_effects = COALESCE(%s, side_effects),
                image_url = COALESCE(%s, image_url),
                manufacturer = COALESCE(%s, manufacturer),
                excellent_review_percent = COALESCE(%s, excellent_review_percent),
                average_review_percent = COALESCE(%s, average_review_percent),
                poor_review_percent = COALESCE(%s, poor_review_percent),
                price = COALESCE(%s, price),
                stock = COALESCE(%s, stock),
                category = COALESCE(%s, category),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING *
        """
        params = (
            data.get('medicine_name'),
            data.get('composition'),
            data.get('uses'),
            data.get('side_effects'),
            data.get('image_url'),
            data.get('manufacturer'),
            data.get('excellent_review_percent'),
            data.get('average_review_percent'),
            data.get('poor_review_percent'),
            data.get('price'),
            data.get('stock'),
            data.get('category'),
            medicine_id
        )
        
        medicine = execute_query(query, params, fetch_one=True)
        
        if not medicine:
            return jsonify({'error': 'Medicine not found'}), 404
        
        return jsonify(medicine), 200
    except Exception as e:
        logger.error(f"Error updating medicine: {e}")
        return jsonify({'error': 'Failed to update medicine'}), 500

@medicines_bp.route('/<int:medicine_id>', methods=['DELETE'])
def delete_medicine(medicine_id):
    """Delete medicine"""
    try:
        query = "DELETE FROM medicines WHERE id = %s RETURNING *"
        medicine = execute_query(query, (medicine_id,), fetch_one=True)
        
        if not medicine:
            return jsonify({'error': 'Medicine not found'}), 404
        
        return jsonify({'message': 'Medicine deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting medicine: {e}")
        return jsonify({'error': 'Failed to delete medicine'}), 500

@medicines_bp.route('/generate-barcodes', methods=['POST'])
def generate_missing_barcodes():
    """Generate barcodes for all medicines that don't have one"""
    try:
        # Find all medicines without barcodes
        query = """
            SELECT id, medicine_name 
            FROM medicines 
            WHERE barcode IS NULL OR barcode = ''
        """
        medicines_without_barcodes = execute_query(query)
        
        if not medicines_without_barcodes:
            return jsonify({
                'message': 'All medicines already have barcodes',
                'updated': 0
            }), 200
        
        # Update each medicine with a barcode
        updated_count = 0
        updated_medicines = []
        
        for medicine in medicines_without_barcodes:
            medicine_id = medicine['id']
            medicine_name = medicine['medicine_name']
            
            # Generate barcode: '200' + zero-padded ID (10 digits total after '200')
            barcode = '200' + str(medicine_id).zfill(10)
            
            # Update the medicine
            update_query = """
                UPDATE medicines 
                SET barcode = %s 
                WHERE id = %s
                RETURNING id, medicine_name, barcode
            """
            result = execute_query(update_query, (barcode, medicine_id), fetch_one=True)
            
            if result:
                updated_count += 1
                updated_medicines.append({
                    'id': result['id'],
                    'name': result['medicine_name'],
                    'barcode': result['barcode']
                })
        
        return jsonify({
            'message': f'Successfully generated {updated_count} barcodes',
            'updated': updated_count,
            'medicines': updated_medicines
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating barcodes: {e}")
        return jsonify({'error': 'Failed to generate barcodes', 'details': str(e)}), 500

@medicines_bp.route('/simplify-categories', methods=['POST'])
def simplify_categories():
    """Update medicine categories from technical to simple names"""
    try:
        # Mapping from technical to simple names
        category_mapping = {
            'Analgesic': 'Pain Relief',
            'Anti-inflammatory': 'Inflammation',
            'Antibiotic': 'Infection',
            'Antidiabetic': 'Diabetes',
            'Antihistamine': 'Allergy',
            'Antipyretic': 'Fever',
            'Antiviral': 'Viral Infection',
            'Cardiovascular': 'Heart',
            'Dermatological': 'Skin',
            'Gastrointestinal': 'Digestive',
            'Ophthalmic': 'Eye',
            'Other': 'General',
            'Respiratory': 'Breathing',
            'Supplement': 'Vitamins'
        }
        
        updated_count = 0
        updates = []
        
        for old_name, new_name in category_mapping.items():
            # Update all medicines with this category
            update_query = """
                UPDATE medicines 
                SET category = %s 
                WHERE category = %s
                RETURNING id
            """
            results = execute_query(update_query, (new_name, old_name))
            
            if results:
                count = len(results)
                updated_count += count
                updates.append({
                    'old_name': old_name,
                    'new_name': new_name,
                    'count': count
                })
        
        return jsonify({
            'message': f'Successfully updated {updated_count} medicine categories',
            'updated': updated_count,
            'changes': updates
        }), 200
        
    except Exception as e:
        logger.error(f"Error simplifying categories: {e}")
        return jsonify({'error': 'Failed to simplify categories', 'details': str(e)}), 500

