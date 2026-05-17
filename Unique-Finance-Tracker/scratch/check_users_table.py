import sqlite3

db_path = 'c:\\Users\\user\\Downloads\\Unique-Finance-Tracker\\Unique-Finance-Tracker\\sqlite.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute('PRAGMA table_info(users)')
    columns = cursor.fetchall()
    for col in columns:
        print(col)
except Exception as e:
    print(f'Error: {e}')
finally:
    conn.close()
