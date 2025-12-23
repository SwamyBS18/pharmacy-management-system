@echo off
REM Startup script for Python Backend
REM Pharmacy Management System

echo ========================================
echo Pharmacy Management System - Python Backend
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate
echo.

REM Install/Update dependencies
echo Installing dependencies...
pip install -r requirements.txt
echo.

REM Start the Flask application
echo Starting Flask server...
echo Server will run on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
python app.py
