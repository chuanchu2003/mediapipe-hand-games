const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db");

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        email TEXT UNIQUE,
        age INTEGER,
        gender TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 👉 ADD AVATAR (FIX CHÍNH)
  db.run(`
    ALTER TABLE users ADD COLUMN avatar TEXT
  `, (err) => {
    if(err){
      if(!err.message.includes("duplicate column")){
        console.log("ALTER ERROR:", err.message);
      }
    }else{
      console.log("Đã thêm cột avatar");
    }
  });

  db.run(`
  CREATE TABLE IF NOT EXISTS scores (
    user_id INTEGER PRIMARY KEY,
    breakout_highscore INTEGER DEFAULT 0,
    flappy_highscore INTEGER DEFAULT 0,
    dino_highscore INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS level_progress (
    user_id INTEGER,
    level INTEGER,
    completed INTEGER,
    PRIMARY KEY(user_id, level)
  )
  `);

});

module.exports = db;