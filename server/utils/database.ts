// server/utils/database.ts
import sqlite3 from 'sqlite3';
import { open } from 'sqlite'; // 'sqlite' is a wrapper for sqlite3 that provides promise-based API
import { join } from 'path';
import { cwd } from 'process';

// Define the path for the database file
// Store it in the .nuxt directory or project root for simplicity during development
const DB_PATH = join(cwd(), '.nuxt', 'app.db');
// Ensure .nuxt directory is in .gitignore if not already

let db: Awaited<ReturnType<typeof open>>;

export async function initializeDatabase() {
  if (db) {
    return db;
  }

  // Use verbose mode for more detailed logging during development
  const sqlite3Verbose = sqlite3.verbose();

  db = await open({
    filename: DB_PATH,
    driver: sqlite3Verbose.Database
  });

  console.log('Database connected at', DB_PATH);

  // Define User table schema
  // SQL for creating the users table
  const createUserTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin'))
    );
  `;

  await db.exec(createUserTableSQL);
  console.log('Users table created or already exists.');

  // Example: Ensure an admin user exists (for testing purposes)
  // This is a good place for initial data seeding if needed.
  // For security, admin password should be handled carefully, e.g. from env vars.
  const adminEmail = 'admin@example.com';
  const existingAdmin = await db.get('SELECT * FROM users WHERE email = ? AND role = ?', [adminEmail, 'admin']);

  if (!existingAdmin) {
    const bcrypt = await import('bcryptjs'); // Dynamically import bcryptjs
    const adminPassword = 'adminpassword'; // Replace with a secure password, ideally from env
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    try {
        await db.run(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            'admin', adminEmail, hashedPassword, 'admin'
        );
        console.log('Default admin user created.');
    } catch (error: any) {
        if (error.message.includes('UNIQUE constraint failed')) {
            console.log('Admin user with this username/email already exists.');
        } else {
            console.error('Error creating default admin user:', error);
        }
    }
  }

  return db;
}

// Function to get the database instance
export async function getDb() {
  if (!db) {
    return await initializeDatabase();
  }
  return db;
}

// Optional: Call initializeDatabase on module load so it runs when server starts
// However, for Nuxt server routes, it's better to call getDb() when needed.
// initializeDatabase().catch(console.error);
