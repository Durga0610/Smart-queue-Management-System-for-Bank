import sqlite3

db_path = r'C:\Users\user\Downloads\Unique-Finance-Tracker\Unique-Finance-Tracker\sqlite.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("DROP INDEX IF EXISTS users_email_unique")
    conn.commit()
    print("Dropped users_email_unique index successfully.")
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
    indexes = cursor.fetchall()
    print("Current indexes:", indexes)

except Exception as err:
    print("Error dropping index:", err)
finally:
    if 'conn' in locals():
        conn.close()
