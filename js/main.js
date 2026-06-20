const API_URL = "https://mediapipe-hand-games.onrender.com";
// Biến toàn cục
let currentGame = "breakout";
let gameController;
let phaserGame;
let cameraEnabled = true;
let gameMode = "classic";
let playerName = null;
let userId = null;
window.currentUserId = null;
window.updateHighScoreBoard = updateHighScoreBoard;

const gameLabels = {
  breakout: "Breakout",
  dino: "Dino Run",
  bird: "Flappy Bird",
  more: "More Games Coming Soon"
};

function setActiveGameSection(game) {
  document.querySelectorAll("[data-game-panel]").forEach(panel => {
    panel.classList.toggle("active", panel.dataset.gamePanel === game);
  });

  document.querySelectorAll("[data-game-tab]").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.gameTab === game);
  });

  const label = document.getElementById("active-game-label");
  if (label) {
    label.textContent = gameLabels[game] || "Arcade";
  }

  document.body.classList.remove("is-switching");
  void document.body.offsetWidth;
  document.body.classList.add("is-switching");

  window.setTimeout(() => {
    document.body.classList.remove("is-switching");
  }, 560);
}

function openGamePage(game) {
  setActiveGameSection(game);
  document.body.classList.add("ui-overlay-open");
  document.body.classList.add("is-game-open");
}

function resetGameTabs() {
  document.querySelectorAll("[data-game-panel]").forEach(panel => {
    panel.classList.remove("active");
  });

  document.querySelectorAll("[data-game-tab]").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.gameTab === "breakout");
  });

  const label = document.getElementById("active-game-label");
  if (label) {
    label.textContent = gameLabels.breakout;
  }
}

function closeInfoPages() {
  document.querySelectorAll(".info-page").forEach(page => {
    page.classList.remove("is-open");
    page.setAttribute("aria-hidden", "true");
  });
  document.body.classList.remove("ui-overlay-open");
}

function openInfoPage(id) {
  const accountPanel = document.getElementById("account-panel");
  if (accountPanel) {
    accountPanel.classList.add("hidden");
  }

  exitGame();
  closeInfoPages();

  const page = document.getElementById(id);
  if (!page) return;

  page.classList.add("is-open");
  page.setAttribute("aria-hidden", "false");

  if (id === "camera-page") {
    syncCameraTestFeed();
  }
}

function syncCameraTestFeed() {
  const sourceVideo = document.getElementById("video");
  const targetVideo = document.getElementById("camera-test-video");
  const targetState = document.getElementById("camera-test-state");

  if (!sourceVideo || !targetVideo) return;

  if (sourceVideo.srcObject && targetVideo.srcObject !== sourceVideo.srcObject) {
    targetVideo.srcObject = sourceVideo.srcObject;
    targetVideo.play().catch(() => {});
  }

  if (targetState) {
    targetState.textContent = sourceVideo.srcObject ? "Live preview ready" : "Waiting for camera...";
  }
}

function drawCameraTestOverlay() {
  const cameraPage = document.getElementById("camera-page");
  if (cameraPage && cameraPage.classList.contains("is-open")) {
    syncCameraTestFeed();
  }

  const sourceCanvas = document.getElementById("canvas");
  const targetCanvas = document.getElementById("camera-test-canvas");

  if (sourceCanvas && targetCanvas) {
    const rect = targetCanvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    if (targetCanvas.width !== width) targetCanvas.width = width;
    if (targetCanvas.height !== height) targetCanvas.height = height;

    const ctx = targetCanvas.getContext("2d");
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.drawImage(sourceCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
  }

  setTimeout(
      drawCameraTestOverlay,
      100
  );
}

function launchGameButton(game) {
  const target = document.querySelector(`[data-game-panel="${game}"]`);
  if (target) {
    target.click();
  }
}

// Khởi động ứng dụng
async function init() {
  console.log("Khởi động ứng dụng...");

  gameController = new GameController();
  setupEventListeners();
  drawCameraTestOverlay();

  try {
    await gameController.initialize();
    syncCameraTestFeed();
  } catch (error) {
    console.warn("Camera initialization skipped:", error);
    const status = document.getElementById("status");
    if (status) {
      status.textContent = "Camera unavailable";
      status.style.background = "rgba(200,0,0,0.7)";
    }
  }
}
function killAllScenes(){

    if(!phaserGame) return;

    [
      "LevelSelectScene",
      "BreakoutScene",
      "DinoScene",
      "BirdScene"
    ].forEach(sceneKey => {

      if(phaserGame.scene.isActive(sceneKey)){
        phaserGame.scene.stop(sceneKey);
      }

    });

}
function exitGame(){

    if(phaserGame){

        phaserGame.destroy(true);
        phaserGame = null;

    }

    document.body.classList.remove("is-game-open");
    document.body.classList.remove("ui-overlay-open");

    closeInfoPages();

    resetGameTabs();

    currentGame = null;

    updateLobbyHighScore();
}

function setupEventListeners() {
  document.querySelectorAll("[data-page-target]").forEach(btn => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openInfoPage(btn.dataset.pageTarget);
    });
  });

  document.querySelectorAll("[data-close-page]").forEach(btn => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeInfoPages();
    });
  });

  document
  .getElementById("exit-game-btn")
  .addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    exitGame();
  });
  const breakoutBtn = document.getElementById("breakout-btn");
  const dinoBtn = document.getElementById("dino-btn");
  const birdBtn = document.getElementById("bird-btn");
  const moreBtn = document.getElementById("more-btn");
  const toggleCameraBtn = document.getElementById("toggle-camera");

  document.querySelectorAll("[data-game-tab]").forEach(tab => {
    tab.addEventListener("click", () => {
      const game = tab.dataset.gameTab;
      if (game === "more") {

          openGamePage("more");

          if (phaserGame) {
              phaserGame.destroy(true);
              phaserGame = null;
          }

          currentGame = "more";

          document.getElementById("game-canvas").innerHTML = "";

          updateLobbyHighScore();

          return;
      }
      launchGameButton(game);
    });
  });

  breakoutBtn.addEventListener("click", () => {
      closeInfoPages();
      openGamePage("breakout");

      if(!userId){
        alert("Please log in before playing.");
        return;
      }

      currentGame = "breakout";
      updateHighScoreBoard();
      if (!phaserGame) {

        startGame();

      } else {

        killAllScenes();

        phaserGame.scene.start("LevelSelectScene", {
          controller: gameController,
          player: playerName,
          userId: userId
        });

      }

  });
  dinoBtn.addEventListener("click", () => {
      closeInfoPages();
      openGamePage("dino");

      if(!userId){
        alert("Please log in before playing.");
        return;
      }

      currentGame = "dino";
      updateHighScoreBoard();
      if (!phaserGame) {

        startGame();

      } else {

        killAllScenes();

        phaserGame.scene.start("DinoScene", {
          controller: gameController
        });

      }

  });

  birdBtn.addEventListener("click", () => {
      closeInfoPages();
      openGamePage("bird");

      if(!userId){
        alert("Please log in before playing.");
        return;
      }

      currentGame = "bird";
      updateHighScoreBoard();
      if (!phaserGame) {

        startGame();

      } else {

        killAllScenes();

        phaserGame.scene.start("BirdScene", {
          controller: gameController
        });

      }

  });
moreBtn.addEventListener("click", () => {

    closeInfoPages();
    openGamePage("more");

    if (phaserGame) {
        phaserGame.destroy(true);
        phaserGame = null;
    }

    currentGame = "more";

    document.getElementById("game-canvas").innerHTML = "";

    updateLobbyHighScore();
});
  toggleCameraBtn.addEventListener("click", () => {

    cameraEnabled = gameController.toggleCamera();

    toggleCameraBtn.textContent =
      cameraEnabled ? "Turn Camera Off" : "Turn Camera On";

    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");

    video.style.opacity = cameraEnabled ? "1" : "0.3";
    canvas.style.opacity = cameraEnabled ? "1" : "0.3";

  });
const accountBtn = document.getElementById("account-btn");
const panel = document.getElementById("account-panel");
document.getElementById(
  "close-account-panel"
).onclick = ()=>{

  panel.classList.add("hidden");

};

accountBtn.onclick = (event)=>{
  event.preventDefault();
  event.stopPropagation();

  closeInfoPages();
  document.body.classList.remove("is-game-open");
  resetGameTabs();
  panel.classList.toggle("hidden");

  if(userId){
    loadProfile();
  }else{
    document.getElementById("login-form").classList.remove("hidden");
    document.getElementById("register-form").classList.add("hidden");
    document.getElementById("profile-form").classList.add("hidden");
  }

};


document.getElementById("open-register").onclick = ()=>{

  document.getElementById("login-form").classList.add("hidden");
  document.getElementById("register-form").classList.remove("hidden");

};

document.getElementById("back-login").onclick = ()=>{

  document.getElementById("register-form").classList.add("hidden");
  document.getElementById("login-form").classList.remove("hidden");

};


document.getElementById("register-btn").onclick = async ()=>{

  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value;
  const email = document.getElementById("reg-email").value;
    if(!email){
      alert("Please enter an email.");
      return;
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if(!gmailRegex.test(email)){
      alert("Email must use the @gmail.com format.");
      return;
    }

  const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

  if(!usernameRegex.test(username)){
    alert("Username must be at least 6 characters and include letters and numbers.");
    return;
  }

  if(password.length < 6){
    alert("Password must be at least 6 characters.");
    return;
  }

  const res = await fetch(`${API_URL}/register`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({username,password,email})
  });

  const data = await res.json();

  if(data.success){
    alert("Account created successfully.");
  }else{
    alert(data.message);
  }

};


document.getElementById("login-btn").onclick = async ()=>{

  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const res = await fetch(`${API_URL}/login`,{

    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({username,password})

  });

  const data = await res.json();

  if(!data.success){

    alert("Invalid username or password.");

    return;

  }

  playerName = data.username;
  userId = data.userId;
  window.currentUserId = data.userId;
  panel.classList.add("hidden");

  document.getElementById("player-display").textContent =
  playerName;

  loadProfile();

  updateLobbyHighScore();

};


async function loadProfile(){

  const res = await fetch(`${API_URL}/profile/`+userId);

  const data = await res.json();
  if(data.user.avatar){
    document.getElementById("avatar-preview").src=data.user.avatar;
    document.querySelector(".avatar-placeholder").style.display="none";
  }

  if(!data.success) return;

  document.getElementById("login-form").classList.add("hidden");
  document.getElementById("register-form").classList.add("hidden");
  document.getElementById("profile-form").classList.remove("hidden");

  document.getElementById("profile-name").textContent =
  data.user.username;

  document.getElementById("profile-email").value =
  data.user.email || "";

  document.getElementById("profile-age").value =
  data.user.age || "";

  document.getElementById("profile-gender").value =
  data.user.gender || "";

}


document.getElementById("save-profile").onclick = async ()=>{

  const age = document.getElementById("profile-age").value;
  if(age){

    const ageNum = parseInt(age);

    if(ageNum < 1 || ageNum > 99){

      alert("Age must be between 1 and 99");

      return;
    }

  }
  let avatar = document.getElementById("avatar-preview").src;

  if(!avatar || avatar.includes("localhost")){
      avatar = "";
  }
  const gender = document.getElementById("profile-gender").value;
  const email = document.getElementById("profile-email").value;

  const res = await fetch(`${API_URL}/profile`,{

    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      userId,
      age,
      gender,
      email,
      avatar
    })

  });

  const data = await res.json();

  if(data.success){
    alert("Saved");
  }else{
    alert(data.message|| "Something went wrong.");
  }

};

document.getElementById("logout-btn").onclick = ()=>{

  window.currentUserId=null;
  playerName=null;
  userId=null;
  location.reload();

};
document.querySelectorAll(".eye").forEach(e=>{
  e.onclick=()=>{
    const id=e.dataset.target;
    const input=document.getElementById(id);

    if(input.type==="password"){
      input.type="text";
    }else{
      input.type="password";
    }
  };
});
const avatarBox = document.querySelector(".avatar-box");
const avatarUpload = document.getElementById("avatar-upload");
const avatarPreview = document.getElementById("avatar-preview");

const cropModal = document.getElementById("crop-modal");
cropModal.classList.add("hidden");
const canvas = document.getElementById("crop-canvas");
const ctx = canvas.getContext("2d");

let img = new Image();
let scale = 1;
let posX = 0;
let posY = 0;
let dragging = false;

// click avatar → mở file
avatarBox.onclick = () => {
  avatarUpload.value = "";
  avatarUpload.click();
};

// chọn ảnh → mở crop
avatarUpload.onchange = (e) => {

  if (!e.target.files.length) return;

  const file = e.target.files[0];

  const reader = new FileReader();

  reader.onload = ev => {
    img.src = ev.target.result;
    cropModal.classList.remove("hidden");
    cropModal.style.display = "flex";
  };

  reader.readAsDataURL(file);
};

// load ảnh xong → vẽ
img.onload = () => {
  scale = 1;
  posX = 0;
  posY = 0;
  draw();
};

function draw(){
  ctx.clearRect(0,0,300,300);
  ctx.drawImage(
    img,
    posX,
    posY,
    img.width * scale,
    img.height * scale
  );
}

// ===== DRAG =====
canvas.onmousedown = () => dragging = true;
canvas.onmouseup = () => dragging = false;

canvas.onmousemove = (e)=>{
  if(!dragging) return;

  posX += e.movementX;
  posY += e.movementY;

  draw();
};

// ===== ZOOM =====
document.getElementById("zoom-in").onclick = ()=>{
  scale += 0.1;
  draw();
};

document.getElementById("zoom-out").onclick = ()=>{
  scale -= 0.1;
  if(scale < 0.2) scale = 0.2;
  draw();
};

// ===== CROP =====
document.getElementById("crop-done").onclick = ()=>{

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 200;
  tempCanvas.height = 200;

  const tctx = tempCanvas.getContext("2d");

  tctx.drawImage(
    canvas,
    0,0,300,300,
    0,0,200,200
  );

  const finalImg = tempCanvas.toDataURL();

  avatarPreview.src = finalImg;
  document.querySelector(".avatar-placeholder").style.display="none";

  cropModal.classList.add("hidden");
  cropModal.style.display = "none";
  avatarUpload.value = "";
};
document.getElementById("crop-close").onclick = ()=>{
  cropModal.classList.add("hidden");
  cropModal.style.display = "none";

  // reset trạng thái
  avatarUpload.value = "";
  img.src = "";
};
}
async function updateLobbyHighScore(){

    const list =
      document.getElementById("highscore-list");

    if(!userId){

        list.innerHTML =
        "<li>Log in to view scores</li>";

        return;
    }

    const res =
      await fetch(
        `${API_URL}/myscores/${userId}`
      );

    const data = await res.json();

    list.innerHTML = `
        <li>Breakout :
            <span style="float:right">
            ${data.scores.breakout_highscore}
            </span>
        </li>

        <li>Dino Run :
            <span style="float:right">
            ${data.scores.dino_highscore}
            </span>
        </li>

        <li>Flappy Bird :
            <span style="float:right">
            ${data.scores.flappy_highscore}
            </span>
        </li>
    `;
}
function startGame() {

  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "game-canvas",
    backgroundColor: "#2c3e50",

    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },

    scene: [
      BootScene,
      LevelSelectScene,
      BreakoutScene,
      DinoScene,
      BirdScene
    ]
  };

  phaserGame = new Phaser.Game(config);

  if(currentGame === "breakout"){

    phaserGame.scene.start("LevelSelectScene",{
      controller: gameController,
      player: playerName,
      userId: userId
    });

  }else if(currentGame === "dino"){


    phaserGame.scene.start(
        "DinoScene",
        {
            controller:gameController
        }
    );

  }else if(currentGame === "bird"){


    phaserGame.scene.start(
        "BirdScene",
        {
            controller:gameController
        }
    );

  }

}

// Khởi động khi trang load
window.addEventListener("DOMContentLoaded", () => {
  init();
});

// Dọn dẹp camera khi đóng
window.addEventListener("beforeunload", () => {

  if (gameController && gameController.handDetector) {
    gameController.handDetector.close();
  }

});
async function updateHighScoreBoard() {

  const list = document.getElementById("highscore-list");

  if (!userId) {

    list.innerHTML =
      "<li>Log in to view the leaderboard</li>";

    return;
  }

  let game = "breakout";

  if(currentGame === "dino"){
    game = "dino";
  }

  if(currentGame === "bird"){
    game = "flappy";
  }

  const res = await fetch(
    `${API_URL}/leaderboard/${game}/${userId}`
  );

  const data = await res.json();

  list.innerHTML = "";

  // ===== TOP 5 =====
  data.top5.forEach((s,i)=>{

    const li = document.createElement("li");

    li.style.paddingLeft = "20px";

    li.innerHTML =
      `${i+1}. ${s.username}
      <span style="float:right;margin-right:20px">
      ${s.highscore}
      </span>`;

    list.appendChild(li);

  });

  // ===== ... =====
  const dots = document.createElement("li");
  dots.textContent = "...";
  dots.style.paddingLeft = "20px";
  list.appendChild(dots);

  // ===== line ngăn cách =====
  const line = document.createElement("li");
  line.textContent = "---------------------------------------------";
  line.style.paddingLeft = "20px";
  list.appendChild(line);

  // ===== USER RANK =====
  const me = document.createElement("li");

  me.style.paddingLeft = "20px";
  me.style.color = "#00ff00";

  me.innerHTML =
    `${data.userRank}. ${data.username}
    <span style="float:right;margin-right:20px">
    ${data.userScore}
    </span>`;

  list.appendChild(me);

}
