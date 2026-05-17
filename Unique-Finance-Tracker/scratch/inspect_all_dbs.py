import sqlite3
import os

db_paths = [
    r'sqlite.db',
    r'backend/sqlite.db',
    r'node_modules/.pnpm/node_modules/@workspace/api-server/sqlite.db'
]

for path in db_paths:
    print(f"\nDB Path: {path}")
    if not os.path.exists(path):
        print("Does not exist.")
        continue
    try:
        conn = sqlite3.connect(path)
        cursor = conn.cursor()
        cursor.execute("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index'")
        indexes = cursor.fetchall()
        print("Indexes:", indexes)
    except Exception as e:
        print("Error:", e)
    finally:
        if 'conn' in locals():
            conn.close()
