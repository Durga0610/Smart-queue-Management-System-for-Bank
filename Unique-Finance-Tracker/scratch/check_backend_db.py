import sqlite3, os
db_path = r'c:\Users\user\Downloads\Unique-Finance-Tracker\Unique-Finance-Tracker\backend\sqlite.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print('Tables in backend/sqlite.db:', [r[0] for r in cur.fetchall()])
    conn.close()
else:
    print('backend/sqlite.db not found')
