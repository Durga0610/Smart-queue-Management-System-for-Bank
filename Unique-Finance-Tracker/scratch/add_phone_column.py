import sqlite3

db_path = 'c:\\Users\\user\\Downloads\\Unique-Finance-Tracker\\Unique-Finance-Tracker\\sqlite.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute('ALTER TABLE users ADD COLUMN phone_number TEXT')
    conn.commit()
    print('Added phone_number column to users table.')
except sqlite3.OperationalError as e:
    if 'duplicate column name' in str(e):
        print('Column phone_number already exists.')
    else:
        print(f'Error: {e}')
finally:
    conn.close()
