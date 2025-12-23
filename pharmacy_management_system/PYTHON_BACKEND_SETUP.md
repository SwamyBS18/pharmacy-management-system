# Python Backend Setup & Troubleshooting Guide

## ✅ Step 1: Delete TypeScript Backend (Server Folder)

You can safely delete the `server` folder since we're using Python backend now.

```bash
# From the project root
cd pharmacy_management_system
rmdir /s server  # Windows
# or
rm -rf server    # Linux/Mac
```

## ✅ Step 2: Verify vite.config.ts

Your `vite.config.ts` should look like this (already updated):

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  root: "./client",
  server: {
    host: true,
    port: 5173,
    fs: {
      allow: [
        path.resolve(__dirname, "client"),
        path.resolve(__dirname, "shared"),
        path.resolve(__dirname, "node_modules"),
      ],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  // Python Flask backend
        changeOrigin: true,
        rewrite: (path) => path,
      }
    }
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
}));
```

## ✅ Step 3: Start Python Backend

**Terminal 1 - Python Backend:**

```bash
cd pharmacy_management_system/python_backend

# Activate virtual environment
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac

# Start the server
python app.py
```

**Expected Output:**
```
✅ Database connection pool created successfully
🚀 Starting Pharmacy Management System Backend
📍 Server running on http://0.0.0.0:5000
🗄️  Database: pharmacy_db on localhost:5432
```

## ✅ Step 4: Start Frontend

**Terminal 2 - Frontend:**

```bash
cd pharmacy_management_system
npm run dev
```

**Expected Output:**
```
VITE v7.3.0  ready in XXX ms
➜  Local:   http://localhost:5173/
```

## ✅ Step 5: Test the Connection

Open browser to `http://localhost:5173`

### Quick API Tests:

**Test 1: Health Check**
```bash
curl http://localhost:5000/api/health
```
Expected: `{"status":"healthy","database":"connected",...}`

**Test 2: Suppliers**
```bash
curl http://localhost:5000/api/suppliers/
```
Expected: Array of suppliers

**Test 3: Dashboard Stats**
```bash
curl http://localhost:5000/api/dashboard/stats
```
Expected: Statistics object

## 🔧 Troubleshooting

### Issue 1: 404 Not Found on API Calls

**Problem:** Frontend shows 404 errors for `/api/*` endpoints

**Solution:**
1. Make sure Python backend is running on port 5000
2. Check the proxy configuration in `vite.config.ts`
3. Restart the Vite dev server after changing config

### Issue 2: CORS Errors

**Problem:** Browser console shows CORS errors

**Solution:**
Python backend already has CORS enabled via `Flask-CORS`. If you still see errors:

```python
# In python_backend/app.py
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

### Issue 3: Database Connection Failed

**Problem:** Python backend shows database connection errors

**Solution:**
1. Check PostgreSQL is running
2. Verify `.env` file has correct credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=pharmacy_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```
3. Test connection manually:
   ```bash
   cd python_backend
   python test_setup.py
   ```

### Issue 4: Module Not Found Errors

**Problem:** Python shows `ModuleNotFoundError`

**Solution:**
```bash
cd python_backend
pip install -r requirements.txt
```

### Issue 5: Port Already in Use

**Problem:** `Address already in use` error

**Solution:**
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

## 📊 Verify Everything is Working

### Check 1: Both Servers Running
- ✅ Python backend: `http://localhost:5000`
- ✅ Frontend: `http://localhost:5173`

### Check 2: API Endpoints Responding
Open browser console (F12) and check Network tab:
- All `/api/*` requests should go to Python backend
- Status codes should be 200 (success)

### Check 3: Data Loading
- Dashboard should show statistics
- Suppliers page should load suppliers
- Medicines page should load medicines
- Inventory should show stock levels

## 🎯 Common Workflow

**Daily Development:**

1. **Start Python Backend:**
   ```bash
   cd python_backend
   venv\Scripts\activate
   python app.py
   ```

2. **Start Frontend (in new terminal):**
   ```bash
   npm run dev
   ```

3. **Access Application:**
   - Open `http://localhost:5173` in browser
   - All API calls automatically proxy to Python backend

## 📝 Quick Reference

| Component | Port | URL |
|-----------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Python Backend | 5000 | http://localhost:5000 |
| API Endpoints | - | http://localhost:5173/api/* (proxied to 5000) |

## 🚀 Next Steps After Setup

1. ✅ Test all pages in the frontend
2. ✅ Verify CRUD operations work
3. ✅ Check dashboard statistics
4. ✅ Test POS/Sales functionality
5. ✅ Verify inventory management

## 💡 Pro Tips

- **Use two terminals** - one for backend, one for frontend
- **Check browser console** for any errors
- **Check Python terminal** for API request logs
- **Use the startup scripts** (`start.bat` or `start.sh`) for easier backend startup
