import Database from 'better-sqlite3';
import path from 'path';

const dbPath = 'C:\\Users\\user\\Downloads\\Unique-Finance-Tracker\\Unique-Finance-Tracker\\sqlite.db';
const db = new Database(dbPath);

try {
    console.log("--- Tables ---");
    const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
    tables.forEach(t => {
        console.log(`Table: ${t.name}`);
        console.log(`SQL: ${t.sql}`);
        console.log("-------------------");
    });

    console.log("\n--- Indexes ---");
    const indexes = db.prepare("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index'").all();
    indexes.forEach(i => {
        console.log(`Index: ${i.name} on ${i.tbl_name}`);
        console.log(`SQL: ${i.sql}`);
        console.log("-------------------");
    });

    console.log("\n--- Users Columns ---");
    const columns = db.prepare("PRAGMA table_info(users)").all();
    columns.forEach(c => {
        console.log(`Column ID: ${c.cid}, Name: ${c.name}, Type: ${c.type}, NotNull: ${c.notnull}, DefaultValue: ${c.dflt_value}`);
    });

} catch (err) {
    console.error("Error inspecting database:", err);
} finally {
    db.close();
}
