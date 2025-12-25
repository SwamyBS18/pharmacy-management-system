"""
Authentication Middleware
Handles JWT token validation and role-based authorization
"""
from flask import request, jsonify
from functools import wraps
import jwt
import logging
from config import Config
from db import execute_query

logger = logging.getLogger(__name__)

def get_token_from_header():
    """Extract JWT token from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    
    # Expected format: "Bearer <token>"
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None
    
    return parts[1]

def verify_token(token):
    """Verify JWT token and return user data"""
    try:
        # Decode JWT token
        payload = jwt.decode(
            token,
            Config.SECRET_KEY,
            algorithms=['HS256']
        )
        
        # Check if token exists in database and is valid
        token_query = """
            SELECT id, user_id, expires_at, is_valid
            FROM auth_tokens
            WHERE token = %s AND is_valid = TRUE
        """
        token_record = execute_query(token_query, (token,), fetch_one=True)
        
        if not token_record:
            return None
        
        # Check if token has expired
        from datetime import datetime
        if token_record['expires_at'] < datetime.now():
            # Invalidate expired token
            execute_query(
                "UPDATE auth_tokens SET is_valid = FALSE WHERE id = %s",
                (token_record['id'],),
                fetch_all=False
            )
            return None
        
        # Get user details
        user_query = """
            SELECT u.id, u.name, u.email, u.role, u.pharmacy_id, u.is_active,
                   p.pharmacy_name
            FROM users u
            LEFT JOIN pharmacy p ON u.pharmacy_id = p.id
            WHERE u.id = %s
        """
        user = execute_query(user_query, (payload['user_id'],), fetch_one=True)
        
        if not user or not user['is_active']:
            return None
        
        return user
        
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        return None
    except Exception as e:
        logger.error(f"Error verifying token: {e}")
        return None

def require_auth(f):
    """Decorator to require authentication for a route"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_header()
        
        if not token:
            return jsonify({'error': 'Authentication required', 'code': 'NO_TOKEN'}), 401
        
        user = verify_token(token)
        
        if not user:
            return jsonify({'error': 'Invalid or expired token', 'code': 'INVALID_TOKEN'}), 401
        
        # Attach user to request context
        request.current_user = user
        
        return f(*args, **kwargs)
    
    return decorated_function

def require_role(*allowed_roles):
    """Decorator to require specific role(s) for a route"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # First check authentication
            token = get_token_from_header()
            
            if not token:
                return jsonify({'error': 'Authentication required', 'code': 'NO_TOKEN'}), 401
            
            user = verify_token(token)
            
            if not user:
                return jsonify({'error': 'Invalid or expired token', 'code': 'INVALID_TOKEN'}), 401
            
            # Check role
            if user['role'] not in allowed_roles:
                return jsonify({
                    'error': 'Access denied. Insufficient permissions.',
                    'code': 'INSUFFICIENT_PERMISSIONS',
                    'required_roles': list(allowed_roles),
                    'user_role': user['role']
                }), 403
            
            # Attach user to request context
            request.current_user = user
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator
