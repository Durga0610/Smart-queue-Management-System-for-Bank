import sqlite3, os
db_path = r'c:\Users\user\Downloads\Unique-Finance-Tracker\Unique-Finance-Tracker\database\sqlite.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cur.fetchall()]
    for table in tables:
        if table == 'sqlite_sequence': continue
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        count = cur.fetchone()[0]
        print(f"Table {table}: {count} rows")
    conn.close()
