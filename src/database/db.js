import * as SQLite from 'expo-sqlite';

// Open the database
const db = SQLite.openDatabaseSync('safetynet.db');

export const initDB = async () => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS location_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);
  console.log("Database Initialized");
};

export const insertLocation = async (lat, lon) => {
  const timestamp = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO location_logs (latitude, longitude, timestamp) VALUES (?, ?, ?)',
    [lat, lon, timestamp]
  );
};

export const getDailyLogs = async () => {
  const allRows = await db.getAllAsync(
    'SELECT * FROM location_logs ORDER BY id DESC'
  );
  return allRows;
};

export const clearLogs = async () => {
  await db.runAsync('DELETE FROM location_logs');
};