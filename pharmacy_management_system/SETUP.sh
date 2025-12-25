#!/bin/bash
# Pharmacy Management System - Quick Setup Script

echo "🏥 Pharmacy Management System - Setup Script"
echo "=============================================="
echo ""

# Check if PostgreSQL is running
echo "📊 Step 1: Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL found"
else
    echo "❌ PostgreSQL not found. Please install PostgreSQL first."
    exit 1
fi

# Apply database schema
echo ""
echo "📊 Step 2: Applying database schema..."
echo "Please ensure pharmacy_db database exists in PostgreSQL"
read -p "Press Enter to continue or Ctrl+C to cancel..."

cd python_backend
psql -U postgres -d pharmacy_db -f schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema applied successfully"
else
    echo "❌ Failed to apply database schema"
    echo "Please create the database first: CREATE DATABASE pharmacy_db;"
    exit 1
fi

# Install Python dependencies
echo ""
echo "🐍 Step 3: Installing Python dependencies..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

# Install frontend dependencies
echo ""
echo "📦 Step 4: Installing frontend dependencies..."
cd ..
npm install

if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo ""
echo "=============================================="
echo "✅ Setup Complete!"
echo "=============================================="
echo ""
echo "To start the application:"
echo ""
echo "1. Start the backend (in python_backend directory):"
echo "   cd python_backend"
echo "   python app.py"
echo ""
echo "2. Start the frontend (in a new terminal, from project root):"
echo "   npm run dev"
echo ""
echo "3. Open your browser to: http://localhost:5173"
echo ""
echo "First-time setup:"
echo "- Navigate to /signup to register your pharmacy"
echo "- Complete the pharmacy profile"
echo "- Start using the system!"
echo ""
