import sqlite3

db_path = r'C:\Users\user\Downloads\Unique-Finance-Tracker\Unique-Finance-Tracker\sqlite.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Rebuilding bookings table to fix foreign keys...")
    cursor.execute("ALTER TABLE bookings RENAME TO bookings_old")
    
    cursor.execute("""
    CREATE TABLE `bookings` (
        `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        `user_id` integer NOT NULL,
        `branch_id` integer NOT NULL,
        `service_id` integer NOT NULL,
        `booking_date` text NOT NULL,
        `time_slot` text NOT NULL,
        `token_number` text NOT NULL,
        `status` text DEFAULT 'booked' NOT NULL,
        `group_size` integer DEFAULT 1 NOT NULL,
        `priority` text DEFAULT 'normal' NOT NULL,
        `checklist_done` text DEFAULT '[]' NOT NULL,
        `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
        `served_at` integer,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
        FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE no action,
        FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
    )
    """)
    
    cursor.execute("""
    INSERT INTO `bookings` (id, user_id, branch_id, service_id, booking_date, time_slot, token_number, status, group_size, priority, checklist_done, created_at, served_at)
    SELECT id, user_id, branch_id, service_id, booking_date, time_slot, token_number, status, group_size, priority, checklist_done, created_at, served_at FROM bookings_old
    """)
    
    cursor.execute("DROP TABLE bookings_old")
    print("bookings table rebuilt successfully!")

    print("Rebuilding swap_listings table to fix foreign keys...")
    cursor.execute("ALTER TABLE swap_listings RENAME TO swap_listings_old")
    
    cursor.execute("""
    CREATE TABLE `swap_listings` (
        `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        `booking_id` integer NOT NULL,
        `owner_id` integer NOT NULL,
        `note` text DEFAULT '' NOT NULL,
        `status` text DEFAULT 'open' NOT NULL,
        `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
        FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
    )
    """)
    
    cursor.execute("""
    INSERT INTO `swap_listings` (id, booking_id, owner_id, note, status, created_at)
    SELECT id, booking_id, owner_id, note, status, created_at FROM swap_listings_old
    """)
    
    cursor.execute("DROP TABLE swap_listings_old")
    print("swap_listings table rebuilt successfully!")

    conn.commit()
    print("All tables successfully updated and normalized!")

except Exception as err:
    print("Error rebuilding tables:", err)
    if 'conn' in locals():
        conn.rollback()
finally:
    if 'conn' in locals():
        conn.close()
