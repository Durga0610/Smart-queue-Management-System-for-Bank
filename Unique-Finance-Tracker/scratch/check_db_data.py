import sqlite3, os
db_path = r'c:\Users\user\Downloads\Unique-Finance-Tracker\Unique-Finance-Tracker\sqlite.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cur.fetchall()]
    print('Tables:', tables)
    if 'users' in tables:
        cur.execute("SELECT count(*) FROM users;")
        print('Users count:', cur.fetchone()[0])
        cur.execute("SELECT id, name, email, password FROM users;")
        print('Users:', cur.fetchall())
    conn.close()
else:
    print('sqlite.db not found at root')
