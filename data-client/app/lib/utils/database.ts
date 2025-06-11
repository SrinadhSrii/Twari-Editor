import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { Database as SQLiteDatabase } from "sqlite";
import { mkdir } from "fs/promises";

/**
 * Database Utility
 * ---------------
 * This module provides functions to interact with a SQLite database.
 * It ensures a single connection to the database and manages tables for site and user authorizations.
 */

/**
 * Gets or initializes the SQLite database connection.
 * Implements a singleton pattern to ensure only one database connection exists.
 *
 * The function:
 * 1. Creates the database directory if it doesn't exist
 * 2. Establishes a connection to the SQLite database
 * 3. Initializes required tables:
 *    - SiteAuthorizations: Stores site ID and access token pairs
 *      - siteId: Unique identifier for a Webflow site (PRIMARY KEY)
 *      - accessToken: OAuth access token for that site
 *    - UserAuthorizations: Maps user IDs to their access tokens
 *      - id: Auto-incrementing primary key
 *      - userId: Identifier for the Webflow user
 *      - accessToken: OAuth access token for that user
 *
 * @returns Promise<SQLiteDatabase> The database connection instance
 * @throws Error if database initialization fails
 */

// Singleton pattern to maintain one database connection
let db: SQLiteDatabase | null = null;

async function getDb() {
  // If a database doesn't exist, create one
  if (!db) {
    const dbPath = "./db/database.db";
    const dbDir = "./db";

    try {
      // Ensure the directory exists
      await mkdir(dbDir, { recursive: true });

      // Open SQLite database connection with specified file path and driver
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });

      // Create tables for SiteAuthorizations and UserAuthorizations if they don't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS siteAuthorizations (
          siteId TEXT PRIMARY KEY,
          accessToken TEXT
        );
        
        CREATE TABLE IF NOT EXISTS userAuthorizations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT,
          accessToken TEXT
        );
      `);
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }
  return db;
}

/**
 * Inserts a new site authorization into the database.
 *
 * @param {string} siteId - The unique identifier for the Webflow site
 * @param {string} accessToken - The OAuth access token for the site
 * @returns {Promise<void>}
 */
export async function insertSiteAuthorization(
  siteId: string,
  accessToken: string
) {
  const db = await getDb();
  await db.run(
    "REPLACE INTO siteAuthorizations (siteId, accessToken) VALUES (?, ?)",
    [siteId, accessToken]
  );
  console.log("Site authorization pairing updated.");
}

/**
 * Inserts a new user authorization into the database.
 *
 * @param {string} userId - The unique identifier for the Webflow user
 * @param {string} accessToken - The OAuth access token for the user
 * @returns {Promise<void>}
 */
export async function insertUserAuthorization(
  userId: string,
  accessToken: string
) {
  const db = await getDb();
  await db.run(
    "REPLACE INTO userAuthorizations (userId, accessToken) VALUES (?, ?)",
    [userId, accessToken]
  );
  console.log("User access token pairing updated.");
}

/**
 * Retrieves the access token for a given site ID.
 *
 * @param {string} siteId - The unique identifier for the Webflow site
 * @returns {Promise<string>} The access token for the site
 * @throws Error if no access token is found or the site does not exist
 */
export async function getAccessTokenFromSiteId(
  siteId: string
): Promise<string> {
  const db = await getDb();
  const row = await db.get(
    "SELECT accessToken FROM siteAuthorizations WHERE siteId = ?",
    [siteId]
  );

  if (!row?.accessToken) {
    throw new Error("No access token found or site does not exist");
  }

  return row.accessToken;
}

/**
 * Retrieves the access token for a given user ID.
 *
 * @param {string} userId - The unique identifier for the Webflow user
 * @returns {Promise<string>} The access token for the user
 * @throws Error if no access token is found or the user does not exist
 */
export async function getAccessTokenFromUserId(
  userId: string
): Promise<string> {
  const db = await getDb();
  const row = await db.get(
    "SELECT accessToken FROM userAuthorizations WHERE userId = ?",
    [userId]
  );

  if (!row?.accessToken) {
    throw new Error("No access token found or user does not exist");
  }

  return row.accessToken;
}

/**
 * Clears all data from the database.
 *
 * @returns {Promise<void>}
 */
export async function clearDatabase() {
  const db = await getDb();
  await db.run("DELETE FROM siteAuthorizations");
  await db.run("DELETE FROM userAuthorizations");
  console.log("Database cleared successfully");
}

const database = {
  getAccessTokenFromSiteId,
  getAccessTokenFromUserId,
  insertSiteAuthorization,
  insertUserAuthorization,
  clearDatabase,
};

export default database;
