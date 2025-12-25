"""
Authentication API Routes
Handles user registration, login, logout, and profile management
"""
from flask import Blueprint, request, jsonify
from db import execute_query
import bcrypt
import jwt
import logging
from datetime import datetime, timedelta
from config import Config
from middleware import require_auth, require_role

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__)

def hash_password(password):
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id, pharmacy_id):
    """Generate JWT token for user"""
    expires_at = datetime.now() + timedelta(hours=24)
    
    payload = {
        'user_id': user_id,
        'pharmacy_id': pharmacy_id,
        'exp': expires_at
    }
    
    token = jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')
    
    # Store token in database
    token_query = """
        INSERT INTO auth_tokens (user_id, token, expires_at)
        VALUES (%s, %s, %s)
        RETURNING id
    """
    execute_query(token_query, (user_id, token, expires_at), fetch_one=True)
    
    return token

@auth_bp.route('/check-pharmacy', methods=['GET'])
def check_pharmacy():
    """Check if a pharmacy is already registered"""
    try:
        query = "SELECT COUNT(*) as count FROM pharmacy"
        result = execute_query(query, fetch_one=True)
        
        return jsonify({
            'exists': result['count'] > 0,
            'count': result['count']
        }), 200
    except Exception as e:
        logger.error(f"Error checking pharmacy: {e}")
        return jsonify({'error': 'Failed to check pharmacy registration'}), 500

@auth_bp.route('/register-pharmacy', methods=['POST'])
def register_pharmacy():
    """Register a new pharmacy (first-time setup)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('pharmacy_name') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Pharmacy name, email, and password are required'}), 400
        
        # Check if pharmacy already exists
        check_query = "SELECT COUNT(*) as count FROM pharmacy"
        check_result = execute_query(check_query, fetch_one=True)
        
        if check_result['count'] > 0:
            return jsonify({'error': 'A pharmacy is already registered. Only one pharmacy allowed per system.'}), 409
        
        # Check if email already exists
        email_query = "SELECT COUNT(*) as count FROM pharmacy WHERE email = %s"
        email_result = execute_query(email_query, (data['email'],), fetch_one=True)
        
        if email_result['count'] > 0:
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create pharmacy record
        pharmacy_query = """
            INSERT INTO pharmacy (pharmacy_name, email, is_profile_complete)
            VALUES (%s, %s, FALSE)
            RETURNING id, pharmacy_name, email, is_profile_complete
        """
        pharmacy = execute_query(
            pharmacy_query,
            (data['pharmacy_name'], data['email']),
            fetch_one=True
        )
        
        # Create admin user
        hashed_password = hash_password(data['password'])
        user_query = """
            INSERT INTO users (pharmacy_id, name, email, password, role, status, is_active)
            VALUES (%s, %s, %s, %s, 'ADMIN', 'active', TRUE)
            RETURNING id, name, email, role
        """
        user = execute_query(
            user_query,
            (pharmacy['id'], data.get('admin_name', 'Admin'), data['email'], hashed_password),
            fetch_one=True
        )
        
        # Generate token
        token = generate_token(user['id'], pharmacy['id'])
        
        return jsonify({
            'message': 'Pharmacy registered successfully',
            'pharmacy': pharmacy,
            'user': user,
            'token': token,
            'requires_profile_completion': True
        }), 201
        
    except Exception as e:
        logger.error(f"Error registering pharmacy: {e}")
        if 'duplicate key' in str(e).lower() or 'unique' in str(e).lower():
            return jsonify({'error': 'Email already exists'}), 409
        return jsonify({'error': 'Failed to register pharmacy', 'details': str(e)}), 500

@auth_bp.route('/complete-profile', methods=['POST'])
@require_auth
def complete_profile():
    """Complete pharmacy profile with additional details"""
    try:
        data = request.get_json()
        user = request.current_user
        
        # Validate required fields
        if not data.get('address') or not data.get('phone'):
            return jsonify({'error': 'Address and phone are required'}), 400
        
        # Update pharmacy profile
        update_query = """
            UPDATE pharmacy
            SET address = %s,
                phone = %s,
                license_number = %s,
                gst_number = %s,
                is_profile_complete = TRUE,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, pharmacy_name, address, phone, license_number, gst_number, email, is_profile_complete
        """
        pharmacy = execute_query(
            update_query,
            (
                data['address'],
                data['phone'],
                data.get('license_number'),
                data.get('gst_number'),
                user['pharmacy_id']
            ),
            fetch_one=True
        )
        
        return jsonify({
            'message': 'Pharmacy profile completed successfully',
            'pharmacy': pharmacy
        }), 200
        
    except Exception as e:
        logger.error(f"Error completing profile: {e}")
        return jsonify({'error': 'Failed to complete profile', 'details': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT token"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user_query = """
            SELECT u.id, u.name, u.email, u.password, u.role, u.pharmacy_id, u.is_active,
                   p.pharmacy_name, p.is_profile_complete
            FROM users u
            LEFT JOIN pharmacy p ON u.pharmacy_id = p.id
            WHERE u.email = %s
        """
        user = execute_query(user_query, (data['email'],), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if user is active
        if not user['is_active']:
            return jsonify({'error': 'Account is deactivated. Please contact administrator.'}), 403
        
        # Verify password
        if not verify_password(data['password'], user['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Generate token
        token = generate_token(user['id'], user['pharmacy_id'])
        
        # Remove password from response
        user_data = {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'pharmacy_id': user['pharmacy_id'],
            'pharmacy_name': user['pharmacy_name'],
            'is_profile_complete': user['is_profile_complete']
        }
        
        return jsonify({
            'message': 'Login successful',
            'user': user_data,
            'token': token
        }), 200
        
    except Exception as e:
        logger.error(f"Error during login: {e}")
        return jsonify({'error': 'Login failed', 'details': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    """Logout user and invalidate token"""
    try:
        from middleware import get_token_from_header
        token = get_token_from_header()
        
        if token:
            # Invalidate token
            execute_query(
                "UPDATE auth_tokens SET is_valid = FALSE WHERE token = %s",
                (token,),
                fetch_all=False
            )
        
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        logger.error(f"Error during logout: {e}")
        return jsonify({'error': 'Logout failed'}), 500

@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_current_user():
    """Get current user profile"""
    try:
        user = request.current_user
        
        return jsonify({
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'pharmacy_id': user['pharmacy_id'],
            'pharmacy_name': user['pharmacy_name']
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        return jsonify({'error': 'Failed to get user profile'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@require_auth
def change_password():
    """Change user password"""
    try:
        data = request.get_json()
        user = request.current_user
        
        # Validate required fields
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        # Get user's current password
        password_query = "SELECT password FROM users WHERE id = %s"
        result = execute_query(password_query, (user['id'],), fetch_one=True)
        
        # Verify current password
        if not verify_password(data['current_password'], result['password']):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Validate new password
        if len(data['new_password']) < 8:
            return jsonify({'error': 'New password must be at least 8 characters'}), 400
        
        # Hash new password
        hashed_password = hash_password(data['new_password'])
        
        # Update password
        update_query = """
            UPDATE users
            SET password = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        execute_query(update_query, (hashed_password, user['id']), fetch_all=False)
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error changing password: {e}")
        return jsonify({'error': 'Failed to change password'}), 500
