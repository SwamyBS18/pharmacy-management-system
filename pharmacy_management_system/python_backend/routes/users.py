"""
Users API Routes
Handles user management with authentication and role-based access control
"""
from flask import Blueprint, request, jsonify
from db import execute_query
import bcrypt
import logging
from middleware import require_auth, require_role

logger = logging.getLogger(__name__)
users_bp = Blueprint('users', __name__)

def hash_password(password):
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

@users_bp.route('/', methods=['GET'])
@require_auth
def get_users():
    """Get all users (excluding passwords)"""
    try:
        user = request.current_user
        
        query = """
            SELECT id, name, email, role, status, is_active, created_at 
            FROM users 
            WHERE pharmacy_id = %s
            ORDER BY name
        """
        users = execute_query(query, (user['pharmacy_id'],))
        return jsonify(users), 200
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
@require_auth
def get_user(user_id):
    """Get single user"""
    try:
        current_user = request.current_user
        
        query = """
            SELECT id, name, email, role, status, is_active, created_at 
            FROM users 
            WHERE id = %s AND pharmacy_id = %s
        """
        user = execute_query(query, (user_id, current_user['pharmacy_id']), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user), 200
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return jsonify({'error': 'Failed to fetch user'}), 500

@users_bp.route('/', methods=['POST'])
@require_role('ADMIN')
def create_user():
    """Create new user (Admin only - for creating employees)"""
    try:
        data = request.get_json()
        current_user = request.current_user
        
        # Validate required fields
        if not data.get('name') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Name, email, and password are required'}), 400
        
        # Validate password strength
        if len(data['password']) < 8:
            return jsonify({'error': 'Password must be at least 8 characters'}), 400
        
        # Hash password
        hashed_password = hash_password(data['password'])
        
        # Employees can only be created by admin
        role = data.get('role', 'EMPLOYEE')
        if role not in ['EMPLOYEE', 'ADMIN']:
            return jsonify({'error': 'Invalid role. Must be EMPLOYEE or ADMIN'}), 400
        
        # Check if trying to create another admin
        if role == 'ADMIN':
            admin_check = execute_query(
                "SELECT COUNT(*) as count FROM users WHERE pharmacy_id = %s AND role = 'ADMIN'",
                (current_user['pharmacy_id'],),
                fetch_one=True
            )
            if admin_check['count'] > 0:
                return jsonify({'error': 'Only one admin allowed per pharmacy'}), 409
        
        query = """
            INSERT INTO users (pharmacy_id, name, email, password, role, status, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, name, email, role, status, is_active, created_at
        """
        params = (
            current_user['pharmacy_id'],
            data['name'],
            data['email'],
            hashed_password,
            role,
            data.get('status', 'active'),
            data.get('is_active', True)
        )
        
        user = execute_query(query, params, fetch_one=True)
        return jsonify({
            'message': 'User created successfully',
            'user': user
        }), 201
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        if 'duplicate key' in str(e).lower() or 'unique' in str(e).lower():
            return jsonify({'error': 'Email already exists'}), 409
        return jsonify({'error': 'Failed to create user'}), 500

@users_bp.route('/<int:user_id>', methods=['PUT'])
@require_role('ADMIN')
def update_user(user_id):
    """Update user (Admin only)"""
    try:
        data = request.get_json()
        current_user = request.current_user
        
        # Cannot update yourself
        if user_id == current_user['id']:
            return jsonify({'error': 'Cannot update your own account through this endpoint'}), 400
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        if 'name' in data:
            update_fields.append('name = %s')
            params.append(data['name'])
        
        if 'email' in data:
            update_fields.append('email = %s')
            params.append(data['email'])
        
        if 'role' in data:
            if data['role'] not in ['EMPLOYEE', 'ADMIN']:
                return jsonify({'error': 'Invalid role'}), 400
            update_fields.append('role = %s')
            params.append(data['role'])
        
        if 'status' in data:
            update_fields.append('status = %s')
            params.append(data['status'])
        
        if 'is_active' in data:
            update_fields.append('is_active = %s')
            params.append(data['is_active'])
        
        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400
        
        update_fields.append('updated_at = CURRENT_TIMESTAMP')
        params.extend([user_id, current_user['pharmacy_id']])
        
        query = f"""
            UPDATE users SET
                {', '.join(update_fields)}
            WHERE id = %s AND pharmacy_id = %s
            RETURNING id, name, email, role, status, is_active, created_at
        """
        
        user = execute_query(query, tuple(params), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user
        }), 200
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        return jsonify({'error': 'Failed to update user'}), 500

@users_bp.route('/<int:user_id>/activate', methods=['POST'])
@require_role('ADMIN')
def activate_user(user_id):
    """Activate user (Admin only)"""
    try:
        current_user = request.current_user
        
        query = """
            UPDATE users
            SET is_active = TRUE, status = 'active', updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND pharmacy_id = %s
            RETURNING id, name, email, role, status, is_active
        """
        user = execute_query(query, (user_id, current_user['pharmacy_id']), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'message': 'User activated successfully',
            'user': user
        }), 200
    except Exception as e:
        logger.error(f"Error activating user: {e}")
        return jsonify({'error': 'Failed to activate user'}), 500

@users_bp.route('/<int:user_id>/deactivate', methods=['POST'])
@require_role('ADMIN')
def deactivate_user(user_id):
    """Deactivate user (Admin only)"""
    try:
        current_user = request.current_user
        
        # Cannot deactivate yourself
        if user_id == current_user['id']:
            return jsonify({'error': 'Cannot deactivate your own account'}), 400
        
        query = """
            UPDATE users
            SET is_active = FALSE, status = 'inactive', updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND pharmacy_id = %s AND role != 'ADMIN'
            RETURNING id, name, email, role, status, is_active
        """
        user = execute_query(query, (user_id, current_user['pharmacy_id']), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'User not found or cannot deactivate admin'}), 404
        
        # Invalidate all tokens for this user
        execute_query(
            "UPDATE auth_tokens SET is_valid = FALSE WHERE user_id = %s",
            (user_id,),
            fetch_all=False
        )
        
        return jsonify({
            'message': 'User deactivated successfully',
            'user': user
        }), 200
    except Exception as e:
        logger.error(f"Error deactivating user: {e}")
        return jsonify({'error': 'Failed to deactivate user'}), 500

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@require_role('ADMIN')
def delete_user(user_id):
    """Delete user (Admin only)"""
    try:
        current_user = request.current_user
        
        # Cannot delete yourself
        if user_id == current_user['id']:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        # Cannot delete admin
        user_check = execute_query(
            "SELECT role FROM users WHERE id = %s AND pharmacy_id = %s",
            (user_id, current_user['pharmacy_id']),
            fetch_one=True
        )
        
        if not user_check:
            return jsonify({'error': 'User not found'}), 404
        
        if user_check['role'] == 'ADMIN':
            return jsonify({'error': 'Cannot delete admin account'}), 400
        
        query = "DELETE FROM users WHERE id = %s AND pharmacy_id = %s RETURNING *"
        user = execute_query(query, (user_id, current_user['pharmacy_id']), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        return jsonify({'error': 'Failed to delete user'}), 500
