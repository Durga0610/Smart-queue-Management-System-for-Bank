import sqlite3, os
db_path = r'c:\Users\user\Downloads\Unique-Finance-Tracker\Unique-Finance-Tracker\database\sqlite.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cur.fetchall()]
    print('Tables:', tables)
    for table in tables:
        if table == 'sqlite_sequence': continue
        cur.execute(f"PRAGMA table_info({table});")
        print(f"Columns for {table}:", cur.fetchall())
    conn.close()
