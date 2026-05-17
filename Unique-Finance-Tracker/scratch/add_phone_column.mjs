import Database from 'better-sqlite3';
import path from 'path';

const dbPath = 'C:\\Users\\user\\Downloads\\Unique-Finance-Tracker\\Unique-Finance-Tracker\\sqlite.db';
const db = new Database(dbPath);

try {
    db.prepare('ALTER TABLE users ADD COLUMN phone_number TEXT').run();
    console.log('Added phone_number column to users table.');
} catch (err) {
    if (err.message.includes('duplicate column name')) {
        console.log('Column phone_number already exists.');
    } else {
        console.error('Error adding column:', err);
    }
} finally {
    db.close();
}
