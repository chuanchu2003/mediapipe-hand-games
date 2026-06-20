class GameController {
  constructor() {
    this.handDetector = null;

    this.paddlePosition = 0.5;

    this.smoothingFactor = 0.7;

    this.isFistClosed = false;

    this.lastFistState = false;
    this.fistJustClosed = false;


    this.latestDX = 0;
    this.controlMode = "angle";
    // angle = điều khiển paddle bằng góc tay
    // pinch = chạm ngón cái để nhảy

    this.jumpTriggered = false;
    this.lastPinchState = false;
  }
  setControlMode(mode) {
    this.controlMode = mode;

    this.jumpTriggered = false;
    this.lastPinchState = false;
    this.isPinching = false;

    this.jumpIntervals = {
      dino: 80,
      flappy: 30
    };

    this.lastJumpTimes = {
      dino: 0,
      flappy: 0
    };

    this.resetGestureState();
  }

  async initialize() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const statusElement = document.getElementById('status');

    canvas.width = 320;
    canvas.height = 240;

    this.handDetector = new HandsMediaPipe();

    try {
      await this.handDetector.initialize(video, canvas, (results) => {
        this.handleHandResults(results);
      });

      this.handDetector.start();

      statusElement.textContent = 'Camera ready';
      statusElement.style.background = 'rgba(0,200,0,0.7)';

      const levelBtn = document.getElementById('level-btn');

      if (levelBtn) levelBtn.disabled = false;


      return true;

    } catch (error) {
      console.error('Camera initialization error:', error);

      statusElement.textContent = 'Camera startup failed';
      statusElement.style.background = 'rgba(200,0,0,0.7)';

      return false;
    }
  }

  resetGestureState() {

    this.lastFistState = false;
    this.fistJustClosed = false;
    this.isFistClosed = false;

    this.jumpTriggered = false;
    this.lastPinchState = false;
  }

  handleHandResults(results) {

    if (!results.multiHandLandmarks ||
        results.multiHandLandmarks.length === 0) {

      this.resetGestureState();
      return;
    }

    const landmarks = results.multiHandLandmarks[0];

    if (this.controlMode === "angle") {

      const wrist = landmarks[0];
      const indexTip = landmarks[8];

      const dx = indexTip.x - wrist.x;
      const dy = wrist.y - indexTip.y;

      let angle = -Math.atan2(dx, dy) * 180 / Math.PI;
      angle = Phaser.Math.Clamp(angle, -45, 45);

      this.latestDX = angle;

      

    }
    else if (this.controlMode === "pinch") {
  
      this.detectPinch(landmarks);

    }
      this.detectFistAndFingers(landmarks);
    
  }
 detectPinch(landmarks) {

    const thumbTip = landmarks[4];

    const fingerTips = [
      landmarks[8],
      landmarks[12],
      landmarks[16],
      landmarks[20]
    ];

    let pinchNow = false;

    for (const finger of fingerTips) {

      const dx = thumbTip.x - finger.x;
      const dy = thumbTip.y - finger.y;

      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.05) {
        pinchNow = true;
        break;
      }
    }

    this.isPinching = pinchNow;
    this.lastPinchState = pinchNow;
}
  justJumped() {

    const result = this.jumpTriggered;

    this.jumpTriggered = false;

    return result;
  }
isJumping(gameName) {

    if (!this.isPinching) {
        return false;
    }

    const now = Date.now();

    const interval =
        this.jumpIntervals[gameName] || 80;

    if (
        now -
        this.lastJumpTimes[gameName]
        >= interval
    ) {

        this.lastJumpTimes[gameName] = now;

        return true;
    }

    return false;
}

  updateMovement() {
    let angle = this.latestDX;

    let targetPosition = (angle + 45) / 90;

    const s = Phaser.Math.Clamp(this.smoothingFactor, 0, 1);

    this.paddlePosition =
      this.paddlePosition * s + targetPosition * (1 - s);

    this.paddlePosition = Phaser.Math.Clamp(this.paddlePosition, 0, 1);

  }

  detectFistAndFingers(landmarks) {
    function dist(a, b) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dz = (a.z || 0) - (b.z || 0);
      return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }

    const palmSize = dist(landmarks[0], landmarks[9]);

    if (!palmSize || palmSize < 0.001) {
      this.isFistClosed = false;
      this.fistJustClosed = false;
      return;
    }

    const d4_11 = dist(landmarks[4], landmarks[11]);
    const d4_12 = dist(landmarks[4], landmarks[12]);
    const cluster1 =
      d4_11 < palmSize * 0.25 &&
      d4_12 < palmSize * 0.25;

    const d3_7 = dist(landmarks[3], landmarks[7]);
    const d3_8 = dist(landmarks[3], landmarks[8]);
    const cluster2 =
      d3_7 < palmSize * 0.25 &&
      d3_8 < palmSize * 0.25;

    const currentFist = cluster1 && cluster2;

    if (!this.lastFistState && currentFist) {
      this.fistJustClosed = true;
    } else {
      this.fistJustClosed = false;
    }

    this.lastFistState = currentFist;
    this.isFistClosed = currentFist;

  }

  getPaddlePosition() {
    return this.paddlePosition;
  }

  isFist() {
    return this.isFistClosed;
  }

  justClosedFist() {
    const result = this.fistJustClosed;

    if (result) {
      console.log('✅ justClosedFist() returning TRUE');
      this.fistJustClosed = false;
    }

    return result;
  }


  toggleCamera() {
    if (!this.handDetector) return false;

    if (this.handDetector.isRunning) {
      this.handDetector.stop();
      this.resetGestureState();
      return false;
    } else {
      this.handDetector.start();
      return true;
    }
  }

}
