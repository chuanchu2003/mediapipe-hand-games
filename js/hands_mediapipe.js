class HandsMediaPipe {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        this.onResultsCallback = null;
        this.isRunning = false;
        this.lastFrameTime = Date.now();
        this.fps = 0;
    }

    async initialize(videoElement, canvasElement, onResults) {
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;
        this.canvasCtx = canvasElement.getContext('2d');
        this.onResultsCallback = onResults;

        // Khởi tạo MediaPipe Hands
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 1, // Chỉ phát hiện 1 tay để tăng hiệu suất
            modelComplexity: 0, // Sử dụng model đơn giản hơn
            minDetectionConfidence: 0.6, // Giảm ngưỡng
            minTrackingConfidence: 0.6
        });

        this.hands.onResults((results) => this.processResults(results));

        // Khởi tạo camera
        this.camera = new Camera(this.videoElement, {
            onFrame: async () => {
                if (this.isRunning) {
                    await this.hands.send({ image: this.videoElement });
                    this.updateFPS();
                }
            },
            width: 320, // Giảm độ phân giải để tăng FPS
            height: 240
        });

        return this.camera.start();
    }

    processResults(results) {
        // Xóa canvas
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        // Vẽ landmarks nếu có tay được phát hiện
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (const landmarks of results.multiHandLandmarks) {
                drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS, {
                    color: '#00FF00',
                    lineWidth: 3
                });
                drawLandmarks(this.canvasCtx, landmarks, {
                    color: '#FF0000',
                    lineWidth: 2,
                    radius: 4
                });
            }
        }

        this.canvasCtx.restore();

        // Gọi callback với kết quả
        if (this.onResultsCallback) {
            this.onResultsCallback(results);
        }
    }

    updateFPS() {
        const now = Date.now();
        const delta = now - this.lastFrameTime;
        this.fps = Math.round(1000 / delta);
        this.lastFrameTime = now;
        
        const fpsElement = document.getElementById('fps');
        if (fpsElement) {
            fpsElement.textContent = this.fps;
        }
    }

    start() {
        this.isRunning = true;
    }

    stop() {
        this.isRunning = false;
    }

    getHandPosition(landmarks) {
        if (!landmarks || landmarks.length === 0) return null;

        // Lấy vị trí của cổ tay (landmark 0)
        const wrist = landmarks[0];
        
        // Lấy vị trí trung bình của ngón giữa (landmarks 9-12)
        const middleFinger = landmarks.slice(9, 13);
        const avgX = middleFinger.reduce((sum, point) => sum + point.x, 0) / middleFinger.length;
        const avgY = middleFinger.reduce((sum, point) => sum + point.y, 0) / middleFinger.length;

        return {
            x: (wrist.x + avgX) / 2,
            y: (wrist.y + avgY) / 2,
            z: (wrist.z + middleFinger[0].z) / 2
        };
    }

    async close() {
        this.isRunning = false;
        if (this.camera) {
            await this.camera.stop();
        }
        if (this.hands) {
            this.hands.close();
        }
    }
}