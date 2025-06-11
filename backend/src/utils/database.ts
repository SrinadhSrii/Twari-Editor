import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Database as SQLiteDatabase } from 'sqlite';
import { mkdir } from 'fs/promises';

let db: SQLiteDatabase | null = null;

/**
 * Gets or initializes the SQLite database connection.
 * Implements a singleton pattern to ensure only one database connection exists.
 */
async function getDb(): Promise<SQLiteDatabase> {
  if (db) return db;

  // Ensure the db directory exists
  await mkdir('./db', { recursive: true });

  db = await open({
    filename: './db/data.sqlite',
    driver: sqlite3.Database,
  });

  // Initialize tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS siteAuthorizations (
      siteId TEXT PRIMARY KEY,
      accessToken TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS userAuthorizations (
      userId TEXT PRIMARY KEY,
      accessToken TEXT NOT NULL
    );
  `);

  return db;
}

/**
 * Stores a site's authorization details.
 */
export async function insertSiteAuthorization(siteId: string, accessToken: string): Promise<void> {
  const db = await getDb();
  await db.run(
    'REPLACE INTO siteAuthorizations (siteId, accessToken) VALUES (?, ?)',
    [siteId, accessToken]
  );
}

/**
 * Stores a user's authorization details.
 */
export async function insertUserAuthorization(userId: string, accessToken: string) {
  const db = await getDb();
  await db.run(
    'REPLACE INTO userAuthorizations (userId, accessToken) VALUES (?, ?)',
    [userId, accessToken]
  );
  console.log('User access token pairing updated.');
}

/**
 * Retrieves an access token for a given site ID.
 */
export async function getAccessTokenFromSiteId(siteId: string): Promise<string> {
  const db = await getDb();
  const row = await db.get(
    'SELECT accessToken FROM siteAuthorizations WHERE siteId = ?',
    [siteId]
  );

  if (!row?.accessToken) {
    throw new Error('No access token found or site does not exist');
  }

  return row.accessToken;
}

/**
 * Retrieves an access token for a given user ID.
 */
export async function getAccessTokenFromUserId(userId: string): Promise<string> {
  const db = await getDb();
  const row = await db.get(
    'SELECT accessToken FROM userAuthorizations WHERE userId = ?',
    [userId]
  );

  if (!row?.accessToken) {
    throw new Error('No access token found or user does not exist');
  }

  return row.accessToken;
}

/**
 * Clears all authorization data (for development use only).
 */
export async function clearAllAuthorizations(): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM siteAuthorizations');
  await db.run('DELETE FROM userAuthorizations');
  console.log('All authorization data cleared.');
}

export default {
  getDb,
  insertSiteAuthorization,
  insertUserAuthorization,
  getAccessTokenFromSiteId,
  getAccessTokenFromUserId,
  clearAllAuthorizations,
};