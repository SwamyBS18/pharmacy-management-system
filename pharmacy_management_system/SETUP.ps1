# Pharmacy Management System - Quick Setup (Windows)

Write-Host "🏥 Pharmacy Management System - Setup Script" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is available
Write-Host "📊 Step 1: Checking PostgreSQL..." -ForegroundColor Yellow
$psqlExists = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlExists) {
    Write-Host "✅ PostgreSQL found" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL not found. Please install PostgreSQL first." -ForegroundColor Red
    exit 1
}

# Apply database schema
Write-Host ""
Write-Host "📊 Step 2: Applying database schema..." -ForegroundColor Yellow
Write-Host "Please ensure pharmacy_db database exists in PostgreSQL" -ForegroundColor Yellow
Write-Host "Press Enter to continue or Ctrl+C to cancel..." -ForegroundColor Yellow
Read-Host

Set-Location python_backend
psql -U postgres -d pharmacy_db -f schema.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database schema applied successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to apply database schema" -ForegroundColor Red
    Write-Host "Please create the database first: CREATE DATABASE pharmacy_db;" -ForegroundColor Yellow
    exit 1
}

# Install Python dependencies
Write-Host ""
Write-Host "🐍 Step 3: Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Python dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host ""
Write-Host "📦 Step 4: Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ..
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start the backend (in python_backend directory):" -ForegroundColor White
Write-Host "   cd python_backend" -ForegroundColor Gray
Write-Host "   python app.py" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the frontend (in a new terminal, from project root):" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Open your browser to: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "First-time setup:" -ForegroundColor Yellow
Write-Host "- Navigate to /signup to register your pharmacy" -ForegroundColor Gray
Write-Host "- Complete the pharmacy profile" -ForegroundColor Gray
Write-Host "- Start using the system!" -ForegroundColor Gray
Write-Host ""
