import sqlite3
import os

db_path = r'C:\Users\user\Downloads\Unique-Finance-Tracker\Unique-Finance-Tracker\sqlite.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Starting database clean up...")
    
    # 1. Rename existing users table
    cursor.execute("ALTER TABLE users RENAME TO users_old")
    print("Renamed users to users_old.")

    # 2. Create the clean users table
    cursor.execute("""
    CREATE TABLE `users` (
        `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        `name` text NOT NULL,
        `email` text NOT NULL,
        `password` text NOT NULL,
        `phone_number` text,
        `role` text DEFAULT 'customer' NOT NULL,
        `karma` integer DEFAULT 50 NOT NULL,
        `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
    """)
    print("Created new clean users table.")

    # 3. Copy data from users_old to users
    cursor.execute("""
    INSERT INTO `users` (id, name, email, password, phone_number, role, karma, created_at)
    SELECT id, name, email, password, phone_number, role, karma, created_at FROM users_old
    """)
    print("Copied user data successfully.")

    # 4. Drop users_old table
    cursor.execute("DROP TABLE users_old")
    print("Dropped users_old table.")

    # 5. Ensure the unique index users_email_unique is created
    cursor.execute("DROP INDEX IF EXISTS users_email_unique")
    cursor.execute("CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`)")
    print("Re-created unique index users_email_unique.")

    conn.commit()
    print("Database cleaned up successfully!")

except Exception as err:
    print("Error during database clean up:", err)
    if 'conn' in locals():
        conn.rollback()
finally:
    if 'conn' in locals():
        conn.close()
