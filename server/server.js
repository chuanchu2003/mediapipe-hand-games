require("dotenv").config();
console.log("SERVER VERSION 2");
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");

const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

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
try {

  const existingEmail = await db.execute({
    sql: "SELECT * FROM users WHERE email=?",
    args: [email]
  });

  if(existingEmail.rows.length){
    return res.json({
      success:false,
      message:"Email đã được sử dụng"
    });
  }

  const hash = await bcrypt.hash(password,10);

  const result = await db.execute({
    sql:"INSERT INTO users(username,password,email) VALUES(?,?,?)",
    args:[username,hash,email]
  });

  const userId = Number(result.lastInsertRowid);

  await db.execute({
    sql:`
      INSERT INTO scores(
        user_id,
        breakout_highscore,
        flappy_highscore,
        dino_highscore
      )
      VALUES(?,0,0,0)
    `,
    args:[userId]
  });

  res.json({
    success:true,
    userId
  });

} catch(err){

  console.log(err);

  res.json({
    success:false,
    message:"Tài khoản đã tồn tại"
  });

}

});



/*
========================
LOGIN
========================
*/
app.post("/login", async (req,res)=>{

  const { username,password } = req.body;

  try{

    const result = await db.execute({
      sql:"SELECT * FROM users WHERE username=?",
      args:[username]
    });

    const user = result.rows[0];

    if(!user){
      return res.json({success:false});
    }

    const match =
      await bcrypt.compare(password,user.password);

    if(!match){
      return res.json({success:false});
    }

    res.json({
      success:true,
      userId:user.id,
      username:user.username
    });

  }catch(err){

    console.log(err);
    res.json({success:false});

  }

});

/*
========================
SAVE SCORE
========================
*/

app.post("/saveScore", async (req,res)=>{
  try{

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

const result = await db.execute({
  sql:`
    SELECT ${column} as highscore
    FROM scores
    WHERE user_id=?
  `,
  args:[userId]
});

const row = result.rows[0];

if(!row){
  return res.json({success:false});
}

if(score > row.highscore){

  await db.execute({
    sql:`
      UPDATE scores
      SET ${column}=?
      WHERE user_id=?
    `,
    args:[score,userId]
  });

}

res.json({success:true});

  }catch(err){

    console.log(err);
    res.json({success:false});

  }});



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

app.get("/leaderboard/:game/:userId", async (req,res)=>{
  try{
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

const result = await db.execute(`
SELECT
  users.id,
  users.username,
  scores.${column} AS highscore
FROM users
JOIN scores
ON users.id=scores.user_id
ORDER BY scores.${column} DESC
`);

const rows = result.rows;
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
  top5,
  userRank,
  userScore: userData ? userData.highscore : 0,
  username: userData ? userData.username : ""
});
    }catch(err){

    console.log(err);
    res.json({success:false});

  }
});

/*
========================
GET PROFILE
========================
*/

app.get("/profile/:id", async (req,res)=>{

  const id = req.params.id;

const result = await db.execute({
  sql:`
    SELECT
      username,
      age,
      gender,
      email,
      avatar
    FROM users
    WHERE id=?
  `,
  args:[id]
});

const row = result.rows[0];
if(!row){
  return res.json({success:false});
}

res.json({
  success:true,
  user:row
});
});


/*
========================
UPDATE PROFILE
========================
*/

app.post("/profile", async (req,res)=>{

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
const existingEmail =
await db.execute({
  sql:"SELECT * FROM users WHERE email=? AND id != ?",
  args:[email,userId]
});

if(existingEmail.rows.length){
  return res.json({
    success:false,
    message:"Email đã được sử dụng"
  });
}
await db.execute({
  sql:`
    UPDATE users
    SET age=?,
        gender=?,
        email=?,
        avatar=?
    WHERE id=?
  `,
  args:[
    age,
    gender,
    email,
    avatar,
    userId
  ]
});
res.json({success:true});
});
app.post("/completeLevel", async (req,res)=>{

  const {userId, level} = req.body;

await db.execute({
  sql:`
    INSERT OR REPLACE INTO level_progress(
      user_id,
      level,
      completed
    )
    VALUES(?,?,1)
  `,
  args:[userId,level]
});

res.json({success:true});

});
app.get("/levels/:userId", async (req,res)=>{

  const userId=req.params.userId;

const result = await db.execute({
  sql:"SELECT level FROM level_progress WHERE user_id=?",
  args:[userId]
});

const rows = result.rows;
let levels = {};

rows.forEach(r => {
  levels[r.level] = true;
});

res.json({
  success:true,
  levels
});
});
/*
========================
SERVER START
========================
*/

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
app.get("/myscores/:userId", async (req,res)=>{

  const userId = req.params.userId;

const result = await db.execute({
  sql:`
    SELECT
      breakout_highscore,
      dino_highscore,
      flappy_highscore
    FROM scores
    WHERE user_id=?
  `,
  args:[userId]
});

const row = result.rows[0];
if(!row){
  return res.json({success:false});
}

res.json({
  success:true,
  scores:row
});

});
