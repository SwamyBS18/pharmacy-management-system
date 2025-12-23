"""
Main Flask Application
Pharmacy Management System Backend
"""
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from db import init_db_pool
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app)
    
    # Initialize database connection pool
    init_db_pool()
    
    # Request logging middleware
    @app.before_request
    def log_request():
        from flask import request
        logger.info(f"📥 {request.method} {request.path}")
    
    # Register blueprints
    from routes.suppliers import suppliers_bp
    from routes.medicines import medicines_bp
    from routes.inventory import inventory_bp
    from routes.customers import customers_bp
    from routes.orders import orders_bp
    from routes.users import users_bp
    from routes.sales import sales_bp
    from routes.prescriptions import prescriptions_bp
    from routes.dashboard import dashboard_bp
    
    app.register_blueprint(suppliers_bp, url_prefix='/api/suppliers')
    app.register_blueprint(medicines_bp, url_prefix='/api/medicines')
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')
    app.register_blueprint(customers_bp, url_prefix='/api/customers')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(sales_bp, url_prefix='/api/sales')
    app.register_blueprint(prescriptions_bp, url_prefix='/api/prescriptions')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        try:
            from db import execute_query
            execute_query("SELECT NOW()", fetch_one=True)
            return jsonify({
                'status': 'healthy',
                'database': 'connected',
                'message': 'Pharmacy Management System API is running'
            }), 200
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({
                'status': 'unhealthy',
                'database': 'disconnected',
                'error': str(e)
            }), 503
    
    # Ping endpoint
    @app.route('/api/ping', methods=['GET'])
    def ping():
        """Simple ping endpoint"""
        return jsonify({'message': 'pong'}), 200
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        """Root endpoint"""
        return jsonify({
            'name': 'Pharmacy Management System API',
            'version': '1.0.0',
            'status': 'running',
            'endpoints': {
                'health': '/api/health',
                'suppliers': '/api/suppliers',
                'medicines': '/api/medicines',
                'inventory': '/api/inventory',
                'customers': '/api/customers',
                'orders': '/api/orders',
                'users': '/api/users',
                'sales': '/api/sales',
                'prescriptions': '/api/prescriptions',
                'dashboard': '/api/dashboard'
            }
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    logger.info("🚀 Starting Pharmacy Management System Backend")
    logger.info(f"📍 Server running on http://{Config.HOST}:{Config.PORT}")
    logger.info(f"🗄️  Database: {Config.DB_NAME} on {Config.DB_HOST}:{Config.DB_PORT}")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
