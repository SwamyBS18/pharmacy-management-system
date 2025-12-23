#!/bin/bash
# Startup script for Python Backend
# Pharmacy Management System

echo "========================================"
echo "Pharmacy Management System - Python Backend"
echo "========================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo ""
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo ""

# Install/Update dependencies
echo "Installing dependencies..."
pip install -r requirements.txt
echo ""

# Start the Flask application
echo "Starting Flask server..."
echo "Server will run on http://localhost:5000"
echo "Press Ctrl+C to stop the server"
echo ""
python app.py
