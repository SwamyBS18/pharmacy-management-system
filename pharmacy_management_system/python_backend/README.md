# Python Backend for Pharmacy Management System

A comprehensive Flask-based REST API backend for the Pharmacy Management System.

## Features

- ✅ **Complete CRUD Operations** for all entities
- ✅ **RESTful API** design
- ✅ **PostgreSQL Integration** with connection pooling
- ✅ **CORS Support** for frontend integration
- ✅ **Comprehensive Error Handling**
- ✅ **Transaction Management** for complex operations
- ✅ **Dashboard Analytics** and statistics
- ✅ **Inventory Management** with expiry tracking
- ✅ **Sales & POS** system with invoice generation
- ✅ **Prescription Management**

## API Endpoints

### Suppliers (`/api/suppliers`)
- `GET /` - List all suppliers
- `GET /:id` - Get single supplier
- `POST /` - Create supplier
- `PUT /:id` - Update supplier
- `DELETE /:id` - Delete supplier

### Medicines (`/api/medicines`)
- `GET /` - List medicines (with pagination, search, filters)
- `GET /:id` - Get single medicine
- `GET /barcode/:barcode` - Get medicine by barcode
- `GET /manufacturers/list` - Get unique manufacturers
- `POST /` - Create medicine
- `PUT /:id` - Update medicine
- `DELETE /:id` - Delete medicine

### Inventory (`/api/inventory`)
- `GET /` - List inventory with status
- `GET /expired` - Get expired items
- `GET /out-of-stock` - Get out of stock items
- `GET /low-stock` - Get low stock items
- `GET /reorder-suggestions` - Get reorder suggestions
- `POST /` - Create inventory batch
- `POST /thresholds` - Set stock thresholds
- `PUT /:id` - Update inventory item
- `DELETE /:id` - Delete inventory item

### Customers (`/api/customers`)
- `GET /` - List customers (with pagination, search)
- `GET /:id` - Get customer with purchase history
- `POST /` - Create customer
- `PUT /:id` - Update customer
- `DELETE /:id` - Delete customer

### Orders (`/api/orders`)
- `GET /` - List orders (with status filter)
- `GET /:id` - Get single order
- `POST /` - Create order
- `PUT /:id` - Update order
- `DELETE /:id` - Delete order

### Users (`/api/users`)
- `GET /` - List users
- `GET /:id` - Get single user
- `POST /` - Create user
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user

### Sales (`/api/sales`)
- `GET /` - List sales (with date filters)
- `GET /:id` - Get sale with items
- `GET /stats/summary` - Get sales statistics
- `POST /` - Create sale (POS checkout)

### Prescriptions (`/api/prescriptions`)
- `GET /` - List prescriptions (with filters)
- `GET /:id` - Get prescription with items
- `GET /expired/list` - Get expired prescriptions
- `POST /` - Create prescription
- `PUT /:id` - Update prescription

### Dashboard (`/api/dashboard`)
- `GET /stats` - Get overall statistics
- `GET /recent-activity` - Get recent activity
- `GET /alerts` - Get system alerts

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- PostgreSQL database
- pip (Python package manager)

### Installation

1. **Navigate to the Python backend directory:**
```bash
cd pharmacy_management_system/python_backend
```

2. **Create a virtual environment (recommended):**
```bash
python -m venv venv
```

3. **Activate the virtual environment:**
- Windows:
  ```bash
  venv\Scripts\activate
  ```
- Linux/Mac:
  ```bash
  source venv/bin/activate
  ```

4. **Install dependencies:**
```bash
pip install -r requirements.txt
```

5. **Configure environment variables:**
The backend uses the `.env` file in the parent directory. Ensure it contains:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pharmacy_db
DB_USER=postgres
DB_PASSWORD=your_password
PYTHON_PORT=5000
```

6. **Run the application:**
```bash
python app.py
```

The server will start on `http://localhost:5000`

## Testing the API

### Using curl:
```bash
# Health check
curl http://localhost:5000/api/health

# Get all suppliers
curl http://localhost:5000/api/suppliers

# Get medicines with search
curl "http://localhost:5000/api/medicines?search=aspirin&page=1&limit=10"

# Get dashboard stats
curl http://localhost:5000/api/dashboard/stats
```

### Using Python requests:
```python
import requests

# Get suppliers
response = requests.get('http://localhost:5000/api/suppliers')
suppliers = response.json()
print(suppliers)

# Create a new supplier
new_supplier = {
    'name': 'ABC Pharmaceuticals',
    'email': 'contact@abc.com',
    'contact': '1234567890',
    'address': '123 Main St'
}
response = requests.post('http://localhost:5000/api/suppliers', json=new_supplier)
print(response.json())
```

## Project Structure

```
python_backend/
├── app.py                 # Main Flask application
├── config.py              # Configuration settings
├── db.py                  # Database connection and utilities
├── requirements.txt       # Python dependencies
├── routes/
│   ├── suppliers.py       # Suppliers API
│   ├── medicines.py       # Medicines API
│   ├── inventory.py       # Inventory API
│   ├── customers.py       # Customers API
│   ├── orders.py          # Orders API
│   ├── users.py           # Users API
│   ├── sales.py           # Sales/POS API
│   ├── prescriptions.py   # Prescriptions API
│   └── dashboard.py       # Dashboard/Analytics API
└── README.md              # This file
```

## Database Schema

The backend uses the existing PostgreSQL database schema with tables:
- `medicines` - Medicine catalog
- `suppliers` - Supplier information
- `inventory` - Stock batches with expiry tracking
- `customers` - Customer records
- `orders` - Purchase orders
- `users` - System users
- `sales` - Sales transactions
- `sales_items` - Sale line items
- `prescriptions` - Prescription records
- `prescription_items` - Prescription line items

## Development Notes

### Adding New Endpoints
1. Create a new route file in `routes/` directory
2. Define a Blueprint
3. Add route handlers
4. Register the blueprint in `app.py`

### Database Queries
Use the `execute_query()` function from `db.py`:
```python
from db import execute_query

# Fetch all
results = execute_query("SELECT * FROM table_name")

# Fetch one
result = execute_query("SELECT * FROM table WHERE id = %s", (id,), fetch_one=True)

# Insert/Update
execute_query("INSERT INTO table (col) VALUES (%s)", (value,))
```

### Error Handling
All routes include try-except blocks with proper error logging and user-friendly error messages.

## Production Deployment

For production deployment:

1. **Set DEBUG to False** in config
2. **Use a production WSGI server** (e.g., Gunicorn):
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```
3. **Add password hashing** for user authentication
4. **Implement JWT authentication** for secure API access
5. **Use environment variables** for sensitive configuration
6. **Set up proper logging** and monitoring
7. **Configure HTTPS** with SSL certificates

## License

Part of the Pharmacy Management System project.
