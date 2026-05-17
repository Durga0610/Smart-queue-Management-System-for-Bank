import sqlite3

db_path = r'C:\Users\user\Downloads\Unique-Finance-Tracker\Unique-Finance-Tracker\database\sqlite.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("--- Tables ---")
    cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='table'")
    for name, sql in cursor.fetchall():
        print(f"Table: {name}")
        print(f"SQL: {sql}")
        print("-------------------")

    print("\n--- Users Columns ---")
    cursor.execute("PRAGMA table_info(users)")
    for col in cursor.fetchall():
        print(f"Column ID: {col[0]}, Name: {col[1]}, Type: {col[2]}, NotNull: {col[3]}, DefaultValue: {col[4]}")

except Exception as err:
    print("Error inspecting database:", err)
finally:
    if 'conn' in locals():
        conn.close()
