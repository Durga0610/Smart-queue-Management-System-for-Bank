import sqlite3, os
db_path = r'c:\Users\user\Downloads\Unique-Finance-Tracker\Unique-Finance-Tracker\database\sqlite.db'
if not os.path.exists(db_path):
    print(f'DB not found at {db_path}')
else:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    rows = cur.fetchall()
    print('Tables in database/sqlite.db:', [r[0] for r in rows])
    conn.close()

db_path_root = r'c:\Users\user\Downloads\Unique-Finance-Tracker\Unique-Finance-Tracker\sqlite.db'
if os.path.exists(db_path_root):
    conn = sqlite3.connect(db_path_root)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    rows = cur.fetchall()
    print('Tables in root sqlite.db:', [r[0] for r in rows])
    conn.close()
