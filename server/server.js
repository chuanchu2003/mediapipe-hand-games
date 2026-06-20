console.log("SERVER VERSION 2");
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");

const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

console.log("Starting Breakout Server...");



/*
========================
REGISTER
========================
*/

app.post("/register", async (req, res) => {

  const { username, password, email } = req.body;

  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

  // ===== CHECK RỖNG =====
  if (!username || !password) {
    return res.json({ success: false, message: "Thiếu dữ liệu" });
  }

  if (!email) {
    return res.json({ success: false, message: "Vui lòng nhập email" });
  }

  // ===== CHECK GMAIL =====
  if (!gmailRegex.test(email)) {
    return res.json({
      success: false,
      message: "Email không đúng định dạng"
    });
  }

  // ===== CHECK EMAIL TRÙNG =====
  db.get(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, existingEmail) => {

      if (existingEmail) {
        return res.json({
          success: false,
          message: "Email đã được sử dụng"
        });
      }

      const hash = await bcrypt.hash(password, 10);

      db.run(
        "INSERT INTO users(username,password,email) VALUES(?,?,?)",
        [username, hash, email],
        function(err) {

          if (err) {
            return res.json({
              success: false,
              message: "Tài khoản đã tồn tại"
            });
          }

          const userId = this.lastID;

          db.run(
            "INSERT INTO scores(user_id, breakout_highscore, flappy_highscore, dino_highscore) VALUES(?,0,0,0)",
            [userId]
          );

          res.json({
            success: true,
            userId: userId
          });

        }
      );

    }
  );

});



/*
========================
LOGIN
========================
*/

app.post("/login", (req, res) => {

  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username=?",
    [username],
    async (err, user) => {

      if (!user) {
        return res.json({ success: false });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.json({ success: false });
      }

      res.json({
        success: true,
        userId: user.id,
        username: user.username
      });

    }
  );

});



/*
========================
SAVE SCORE
========================
*/

app.post("/saveScore", (req,res)=>{

  const { userId, game, score } = req.body;

  if(!userId){
    return res.json({success:false});
  }

  let column="";

  if(game==="breakout"){
    column="breakout_highscore";
  }
  else if(game==="flappy"){
    column="flappy_highscore";
  }
  else if(game==="dino"){
    column="dino_highscore";
  }
  else{
    return res.json({success:false});
  }

  db.get(
    `SELECT ${column} as highscore
     FROM scores
     WHERE user_id=?`,
    [userId],
    (err,row)=>{

      if(!row){
        return res.json({success:false});
      }

      if(score > row.highscore){

        db.run(
          `UPDATE scores
           SET ${column}=?
           WHERE user_id=?`,
          [score,userId]
        );

      }

      res.json({success:true});
    }
  );
});



/*
========================
LEADERBOARD
========================
*/
/*
========================
LEADERBOARD
========================
*/

app.get("/leaderboard/:game/:userId", (req, res) => {

  const game = req.params.game;
  const userId = req.params.userId;

  let column = "";

  if (game === "breakout") {
    column = "breakout_highscore";
  }
  else if (game === "flappy") {
    column = "flappy_highscore";
  }
  else if (game === "dino") {
    column = "dino_highscore";
  }
  else {
    return res.json({
      success: false,
      message: "Game không hợp lệ"
    });
  }

  db.all(
    `
    SELECT
      users.id,
      users.username,
      scores.${column} AS highscore
    FROM users
    JOIN scores
      ON users.id = scores.user_id
    ORDER BY scores.${column} DESC
    `,
    [],
    (err, rows) => {

      if (err) {

        console.log(err);

        return res.json({
          success: false,
          message: "Lỗi server"
        });
      }

      let userRank = null;
      let userData = null;

      rows.forEach((r, i) => {

        if (r.id == userId) {

          userRank = i + 1;
          userData = r;

        }

      });

      const top5 = rows.slice(0, 5);

      res.json({
        success: true,
        top5: top5,
        userRank: userRank,
        userScore: userData ? userData.highscore : 0,
        username: userData ? userData.username : ""
      });

    }
  );

});
/*
========================
GET PROFILE
========================
*/

app.get("/profile/:id", (req,res)=>{

  const id = req.params.id;

  db.get(
    "SELECT username,age,gender,email,avatar FROM users WHERE id=?",
    [id],
    (err,row)=>{

      if(!row){
        return res.json({success:false});
      }

      res.json({
        success:true,
        user:row
      });

    }
  );

});


/*
========================
UPDATE PROFILE
========================
*/

app.post("/profile", (req,res)=>{

  const {userId,age,gender,email,avatar} = req.body;

  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

  // ===== CHECK EMAIL RỖNG =====
  if(!email){
    return res.json({
      success:false,
      message:"Email không được để trống"
    });
  }

  // ===== CHECK FORMAT =====
  if(!gmailRegex.test(email)){
    return res.json({
      success:false,
      message:"Email phải là @gmail.com"
    });
  }

  // ===== CHECK TRÙNG =====
  db.get(
    "SELECT * FROM users WHERE email=? AND id != ?",
    [email, userId],
    (err, existingEmail)=>{

      if(existingEmail){
        return res.json({
          success:false,
          message:"Email đã được sử dụng"
        });
      }

      // ===== UPDATE =====
      db.run(
        "UPDATE users SET age=?,gender=?,email=?,avatar=? WHERE id=?",
        [age,gender,email,avatar,userId],
        (err)=>{

          if(err){
             return res.json({
              success:false,
              message:"Lỗi khi cập nhật profile"
            });
          }

          res.json({success:true});
        }
      );

    }
  );

});
app.post("/completeLevel", (req,res)=>{

  const {userId, level} = req.body;

  db.run(
    `INSERT OR REPLACE INTO level_progress(user_id,level,completed)
     VALUES(?,?,1)`,
    [userId, level],
    ()=>{
      res.json({success:true});
    }
  );

});
app.get("/levels/:userId",(req,res)=>{

  const userId=req.params.userId;

  db.all(
    "SELECT level FROM level_progress WHERE user_id=?",
    [userId],
    (err,rows)=>{

      if(err){
        console.log("DB ERROR:", err);
        return res.json({success:false});
      }

      let result={};

      if(rows){
        rows.forEach(r=>{
          result[r.level]=true;
        });
      }

      res.json({
        success:true,
        levels:result
      });

    }
  );

});
/*
========================
SERVER START
========================
*/

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
app.get("/myscores/:userId",(req,res)=>{

  const userId = req.params.userId;

  db.get(
    `
    SELECT
      breakout_highscore,
      dino_highscore,
      flappy_highscore
    FROM scores
    WHERE user_id=?
    `,
    [userId],
    (err,row)=>{

      if(err || !row){
        return res.json({success:false});
      }

      res.json({
        success:true,
        scores:row
      });

    }
  );

});