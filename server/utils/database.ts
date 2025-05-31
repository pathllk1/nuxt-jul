// server/utils/database.ts
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite'; // Ensure Database type is imported
import { join } from 'path';
import { cwd } from 'process';

const DB_PATH = join(cwd(), '.nuxt', 'app.db');
let dbInstance: Database; // Renamed 'db' to 'dbInstance'

async function columnExists(db: Database, tableName: string, columnName: string): Promise<boolean> {
  // PRAGMA table_info returns column information.
  const columns = await db.all(`PRAGMA table_info(${tableName})`);
  return columns.some(col => col.name === columnName);
}

export async function initializeDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const sqlite3Verbose = sqlite3.verbose();
  dbInstance = await open({
    filename: DB_PATH,
    driver: sqlite3Verbose.Database
  });

  console.log('Database connected at', DB_PATH);

  // Schema migration: Check and add new columns if they don't exist
  const usersTableExists = await dbInstance.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");

  if (usersTableExists) {
    if (!await columnExists(dbInstance, 'users', 'refresh_token')) {
      await dbInstance.exec('ALTER TABLE users ADD COLUMN refresh_token TEXT');
      console.log('Column refresh_token added to users table.');
    }
    if (!await columnExists(dbInstance, 'users', 'refresh_token_expires_at')) {
      await dbInstance.exec('ALTER TABLE users ADD COLUMN refresh_token_expires_at DATETIME');
      console.log('Column refresh_token_expires_at added to users table.');
    }
  }

  const createUserTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      refresh_token TEXT,
      refresh_token_expires_at DATETIME
    );
  `;
  await dbInstance.exec(createUserTableSQL);
  console.log('Users table ensured (created or already exists with new columns).');

  // Admin user seeding logic
  const adminEmail = 'admin@example.com';
  // Check by email only for existence, as username might change or not be 'admin' if customized
  const existingAdmin = await dbInstance.get('SELECT id FROM users WHERE email = ? AND role = ?', [adminEmail, 'admin']);

  if (!existingAdmin) {
    const bcrypt = await import('bcryptjs');
    // Use a more secure way to get initial admin password in real apps
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'adminpassword';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    try {
        // Ensure admin username is unique if it's also 'admin', or use a different one
        await dbInstance.run(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            'admin', adminEmail, hashedPassword, 'admin'
        );
        console.log('Default admin user created.');
    } catch (error: any) {
        // Check for UNIQUE constraint failure for username or email specifically
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            // console.log('Admin user with this username or email already exists.');
        } else {
            console.error('Error creating default admin user:', error);
        }
    }
  }
  return dbInstance;
}

export async function getDb() {
  if (!dbInstance) {
    return await initializeDatabase();
  }
  return dbInstance;
}
