require("dotenv").config();

const { createClient } = require("@libsql/client");

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function init() {

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      email TEXT UNIQUE,
      age INTEGER,
      gender TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS scores (
      user_id INTEGER PRIMARY KEY,
      breakout_highscore INTEGER DEFAULT 0,
      flappy_highscore INTEGER DEFAULT 0,
      dino_highscore INTEGER DEFAULT 0
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS level_progress (
      user_id INTEGER PRIMARY KEY,
      highest_level INTEGER DEFAULT 0
    )
  `);

  console.log("Database initialized!");
}

init();