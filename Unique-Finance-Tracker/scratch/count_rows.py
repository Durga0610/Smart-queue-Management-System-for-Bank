import sqlite3
import os

def check_db(path):
    print(f"\nChecking Database: {path}")
    if not os.path.exists(path):
        print("Does not exist.")
        return
    try:
        conn = sqlite3.connect(path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = [t[0] for t in cursor.fetchall()]
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
            count = cursor.fetchone()[0]
            print(f"Table: {table}, Rows: {count}")
    except Exception as e:
        print(f"Error checking {path}: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

check_db(r"c:\Users\user\Downloads\Unique-Finance-Tracker\Unique-Finance-Tracker\sqlite.db")
check_db(r"c:\Users\user\Downloads\Unique-Finance-Tracker\Unique-Finance-Tracker\backend\sqlite.db")
