"""
Users API Routes
Handles user management (authentication-ready)
"""
from flask import Blueprint, request, jsonify
from db import execute_query
import logging

logger = logging.getLogger(__name__)
users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
def get_users():
    """Get all users (excluding passwords)"""
    try:
        query = "SELECT id, name, email, role, status, created_at FROM users ORDER BY name"
        users = execute_query(query)
        return jsonify(users), 200
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get single user"""
    try:
        query = "SELECT id, name, email, role, status, created_at FROM users WHERE id = %s"
        user = execute_query(query, (user_id,), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user), 200
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return jsonify({'error': 'Failed to fetch user'}), 500

@users_bp.route('/', methods=['POST'])
def create_user():
    """Create new user"""
    try:
        data = request.get_json()
        
        # Note: In production, hash the password!
        query = """
            INSERT INTO users (name, email, password, role, status)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, name, email, role, status, created_at
        """
        params = (
            data.get('name'),
            data.get('email'),
            data.get('password'),  # TODO: Hash password in production
            data.get('role', 'staff'),
            data.get('status', 'active')
        )
        
        user = execute_query(query, params, fetch_one=True)
        return jsonify(user), 201
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        if 'duplicate key' in str(e).lower() or 'unique' in str(e).lower():
            return jsonify({'error': 'Email already exists'}), 409
        return jsonify({'error': 'Failed to create user'}), 500

@users_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user"""
    try:
        data = request.get_json()
        
        query = """
            UPDATE users SET
                name = COALESCE(%s, name),
                email = COALESCE(%s, email),
                role = COALESCE(%s, role),
                status = COALESCE(%s, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, name, email, role, status, created_at
        """
        params = (
            data.get('name'),
            data.get('email'),
            data.get('role'),
            data.get('status'),
            user_id
        )
        
        user = execute_query(query, params, fetch_one=True)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user), 200
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        return jsonify({'error': 'Failed to update user'}), 500

@users_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user"""
    try:
        query = "DELETE FROM users WHERE id = %s RETURNING *"
        user = execute_query(query, (user_id,), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        return jsonify({'error': 'Failed to delete user'}), 500
