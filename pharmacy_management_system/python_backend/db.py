"""
Database connection module
Handles PostgreSQL connection pooling and query execution
"""
import psycopg2
from psycopg2 import pool, extras
from config import Config
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Connection pool
connection_pool = None

def init_db_pool():
    """Initialize database connection pool"""
    global connection_pool
    try:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            1,  # Min connections
            20,  # Max connections
            **Config.get_db_connection_string()
        )
        logger.info("✅ Database connection pool created successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Error creating connection pool: {e}")
        return False

def get_db_connection():
    """Get a connection from the pool"""
    if connection_pool is None:
        init_db_pool()
    return connection_pool.getconn()

def release_db_connection(conn):
    """Release a connection back to the pool"""
    if connection_pool:
        connection_pool.putconn(conn)

def execute_query(query, params=None, fetch_one=False, fetch_all=True):
    """
    Execute a database query
    
    Args:
        query: SQL query string
        params: Query parameters (tuple or list)
        fetch_one: Return single row
        fetch_all: Return all rows
        
    Returns:
        Query results or None
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
        cursor.execute(query, params)
        
        if fetch_one:
            result = cursor.fetchone()
        elif fetch_all:
            result = cursor.fetchall()
        else:
            result = None
            
        conn.commit()
        cursor.close()
        return result
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Database error: {e}")
        raise
    finally:
        if conn:
            release_db_connection(conn)

def execute_transaction(queries_with_params):
    """
    Execute multiple queries in a transaction
    
    Args:
        queries_with_params: List of tuples (query, params)
        
    Returns:
        List of results
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
        results = []
        
        for query, params in queries_with_params:
            cursor.execute(query, params)
            try:
                result = cursor.fetchall()
                results.append(result)
            except:
                results.append(None)
        
        conn.commit()
        cursor.close()
        return results
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Transaction error: {e}")
        raise
    finally:
        if conn:
            release_db_connection(conn)
