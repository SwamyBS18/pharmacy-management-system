from db import execute_query

users = execute_query('SELECT id, name, email, role, is_active FROM users ORDER BY id')
print('Users in database:')
print('-' * 80)
for u in users:
    print(f"ID: {u['id']}, Name: {u['name']}, Email: {u['email']}, Role: {u['role']}, Active: {u['is_active']}")
print('-' * 80)
print(f"Total users: {len(users)}")
