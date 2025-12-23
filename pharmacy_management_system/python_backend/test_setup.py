"""
Quick test script to verify Python backend setup
Tests database connection and basic API functionality
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test if all modules can be imported"""
    print("Testing imports...")
    try:
        from config import Config
        print("✓ Config imported successfully")
        
        from db import init_db_pool, execute_query
        print("✓ Database module imported successfully")
        
        from app import create_app
        print("✓ Flask app imported successfully")
        
        return True
    except Exception as e:
        print(f"✗ Import error: {e}")
        return False

def test_database_connection():
    """Test database connection"""
    print("\nTesting database connection...")
    try:
        from db import init_db_pool, execute_query
        
        # Initialize connection pool
        if init_db_pool():
            print("✓ Database connection pool created")
        
        # Test query
        result = execute_query("SELECT NOW()", fetch_one=True)
        if result:
            print(f"✓ Database query successful: {result}")
            return True
        else:
            print("✗ Database query returned no results")
            return False
    except Exception as e:
        print(f"✗ Database connection error: {e}")
        print("\nPlease ensure:")
        print("  1. PostgreSQL is running")
        print("  2. Database 'pharmacy_db' exists")
        print("  3. Credentials in .env file are correct")
        return False

def test_flask_app():
    """Test Flask app creation"""
    print("\nTesting Flask application...")
    try:
        from app import create_app
        app = create_app()
        
        if app:
            print("✓ Flask app created successfully")
            print(f"✓ Registered blueprints: {len(app.blueprints)}")
            
            # List all routes
            print("\nRegistered routes:")
            for rule in app.url_map.iter_rules():
                if not rule.endpoint.startswith('static'):
                    print(f"  {rule.methods} {rule.rule}")
            
            return True
        else:
            print("✗ Failed to create Flask app")
            return False
    except Exception as e:
        print(f"✗ Flask app error: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("Python Backend Test Suite")
    print("Pharmacy Management System")
    print("=" * 60)
    print()
    
    results = []
    
    # Test imports
    results.append(("Imports", test_imports()))
    
    # Test database
    results.append(("Database", test_database_connection()))
    
    # Test Flask app
    results.append(("Flask App", test_flask_app()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{name}: {status}")
    
    all_passed = all(result[1] for result in results)
    
    if all_passed:
        print("\n🎉 All tests passed! Backend is ready to use.")
        print("\nTo start the server, run:")
        print("  python app.py")
        print("\nOr use the startup script:")
        print("  start.bat (Windows) or ./start.sh (Linux/Mac)")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
