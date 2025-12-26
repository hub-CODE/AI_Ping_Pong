/* NeuraPong - Enhanced AI Ping Pong Game */
/* Fixed version with proper error handling */

// Check if p5.js is loaded
if (typeof p5 === 'undefined') {
    console.error("p5.js is not loaded!");
    document.getElementById("status").innerHTML = "❌ Error: Game engine not loaded";
} else {
    console.log("p5.js loaded successfully!");
}

// Global variables
let video;
let poseNet;
let poses = [];
let gameStarted = false;
let score = 0;
let aiScore = 0;
let ball;
let playerPaddle;
let aiPaddle;
let gameState = "waiting"; // waiting, playing, gameOver
let rightWristY = 0;
let rightWristX = 0;

// Sound variables
let paddleHitSound;
let scoreSound;
let gameOverSound;

function preload() {
    // We'll create simple tones instead of loading files
    console.log("Preload complete");
}

function setup() {
    console.log("Setup started...");
    
    try {
        // Create canvas
        const canvas = createCanvas(800, 500);
        canvas.parent('canvas');
        
        // Style canvas
        canvas.style('border-radius', '10px');
        canvas.style('box-shadow', '0 10px 30px rgba(0,0,0,0.3)');
        
        // Initialize game objects
        initGameObjects();
        
        // Setup video
        setupVideo();
        
        // Update status
        updateStatus("🎮 Ready! Click 'Play Game'");
        
        console.log("Setup complete!");
        
    } catch (error) {
        console.error("Setup error:", error);
        showError("Setup failed: " + error.message);
    }
}

function initGameObjects() {
    // Initialize ball
    ball = {
        x: width / 2,
        y: height / 2,
        diameter: 20,
        speedX: 5,
        speedY: random(-3, 3),
        color: [100, 255, 100]
    };
    
    // Initialize paddles
    playerPaddle = {
        x: 30,
        y: height / 2 - 50,
        width: 15,
        height: 100,
        color: [255, 50, 50],
        speed: 0
    };
    
    aiPaddle = {
        x: width - 45,
        y: height / 2 - 50,
        width: 15,
        height: 100,
        color: [255, 165, 0],
        speed: 4
    };
}

function setupVideo() {
    try {
        // Create video capture
        video = createCapture(VIDEO);
        video.size(width, height);
        video.hide();
        
        // Setup PoseNet
        poseNet = ml5.poseNet(video, modelReady);
        poseNet.on('pose', function(results) {
            poses = results;
        });
        
    } catch (error) {
        console.warn("Video/PoseNet setup warning:", error);
        updateStatus("⚠️ Camera not available - Using mouse controls");
    }
}

function modelReady() {
    console.log('✅ PoseNet model ready!');
    updateStatus("✅ AI Ready! Click 'Play Game'");
}

function draw() {
    try {
        // Clear background
        drawBackground();
        
        // Draw video if available
        if (video && gameState === "playing") {
            drawVideoLayer();
        }
        
        // Update and draw game elements based on state
        switch(gameState) {
            case "waiting":
                drawWelcomeScreen();
                break;
            case "playing":
                updateGame();
                drawGame();
                break;
            case "gameOver":
                drawGameOver();
                break;
        }
        
    } catch (error) {
        console.error("Draw error:", error);
        // Don't show error on screen during gameplay
    }
}

function drawBackground() {
    // Gradient background
    for (let i = 0; i <= height; i++) {
        let inter = map(i, 0, height, 0, 1);
        let c = lerpColor(color(30, 30, 60), color(10, 10, 30), inter);
        stroke(c);
        line(0, i, width, i);
    }
    
    // Court boundaries
    stroke(255, 255, 255, 100);
    strokeWeight(3);
    noFill();
    rect(0, 0, width, height);
    
    // Center line
    stroke(255, 255, 255, 50);
    strokeWeight(2);
    for (let i = 0; i < height; i += 20) {
        line(width/2, i, width/2, i + 10);
    }
}

function drawVideoLayer() {
    try {
        push();
        tint(255, 100); // Semi-transparent
        image(video, 0, 0, width, height);
        pop();
    } catch (e) {
        // Video might not be available
    }
}

function drawWelcomeScreen() {
    // Welcome text
    fill(255);
    noStroke();
    textAlign(CENTER);
    
    // Title
    textSize(48);
    text("NEURAPONG", width/2, 100);
    
    // Subtitle
    textSize(24);
    text("AI Ping Pong with Hand Tracking", width/2, 140);
    
    // Instructions box
    fill(255, 255, 255, 30);
    stroke(255, 255, 255, 100);
    strokeWeight(2);
    rect(width/2 - 200, 180, 400, 200, 10);
    
    // Instructions text
    fill(255);
    noStroke();
    textSize(18);
    textAlign(LEFT);
    
    let instructions = [
        "🎮 How to Play:",
        "1. Click 'Play Game' to start",
        "2. Move your right wrist up/down",
        "3. Control the red paddle",
        "4. Hit the ball back to AI",
        "5. First to 5 points wins!"
    ];
    
    for (let i = 0; i < instructions.length; i++) {
        text(instructions[i], width/2 - 180, 220 + i * 30);
    }
    
    // Status indicator
    textAlign(CENTER);
    textSize(20);
    if (poseNet) {
        fill(100, 255, 100);
        text("✅ AI System Ready", width/2, 400);
    } else {
        fill(255, 200, 100);
        text("⚠️ Using Mouse Controls", width/2, 400);
    }
}

function updateGame() {
    // Update wrist position from PoseNet or mouse
    updatePlayerPosition();
    
    // Update ball
    updateBall();
    
    // Update AI paddle
    updateAIPaddle();
    
    // Check collisions
    checkCollisions();
    
    // Check score
    checkScore();
}

function updatePlayerPosition() {
    if (poses.length > 0) {
        // Get right wrist position from PoseNet
        let rightWrist = poses[0].pose.rightWrist;
        rightWristY = rightWrist.y;
        rightWristX = rightWrist.x;
        
        // Update paddle position
        playerPaddle.y = constrain(rightWristY - playerPaddle.height/2, 0, height - playerPaddle.height);
        
        // Draw wrist marker
        drawWristMarker(rightWrist.x, rightWrist.y);
        
    } else {
        // Fallback to mouse control
        playerPaddle.y = constrain(mouseY - playerPaddle.height/2, 0, height - playerPaddle.height);
        rightWristY = mouseY;
        rightWristX = mouseX;
    }
}

function drawWristMarker(x, y) {
    // Draw pulsing circle at wrist
    let pulse = sin(frameCount * 0.1) * 3 + 10;
    
    fill(255, 50, 50, 150);
    noStroke();
    ellipse(x, y, pulse * 2);
    
    fill(255, 100, 100);
    ellipse(x, y, 15);
}

function updateBall() {
    // Move ball
    ball.x += ball.speedX;
    ball.y += ball.speedY;
    
    // Bounce off top and bottom
    if (ball.y < 0 || ball.y > height) {
        ball.speedY *= -1;
    }
}

function updateAIPaddle() {
    // Simple AI - follow the ball
    let targetY = ball.y - aiPaddle.height/2;
    
    // Move towards target
    if (aiPaddle.y < targetY) {
        aiPaddle.y += min(aiPaddle.speed, targetY - aiPaddle.y);
    } else if (aiPaddle.y > targetY) {
        aiPaddle.y -= min(aiPaddle.speed, aiPaddle.y - targetY);
    }
    
    // Keep paddle in bounds
    aiPaddle.y = constrain(aiPaddle.y, 0, height - aiPaddle.height);
}

function checkCollisions() {
    // Player paddle collision
    if (ball.x - ball.diameter/2 <= playerPaddle.x + playerPaddle.width &&
        ball.x + ball.diameter/2 >= playerPaddle.x &&
        ball.y >= playerPaddle.y &&
        ball.y <= playerPaddle.y + playerPaddle.height) {
        
        // Reverse direction and add slight random angle
        ball.speedX = abs(ball.speedX) * 1.05;
        ball.speedY += random(-2, 2);
        
        // Visual feedback
        ball.color = [100, 255, 100];
        
        // Play sound if available
        playPaddleSound();
    }
    
    // AI paddle collision
    if (ball.x + ball.diameter/2 >= aiPaddle.x &&
        ball.x - ball.diameter/2 <= aiPaddle.x + aiPaddle.width &&
        ball.y >= aiPaddle.y &&
        ball.y <= aiPaddle.y + aiPaddle.height) {
        
        // Reverse direction
        ball.speedX = -abs(ball.speedX) * 1.05;
        ball.speedY += random(-2, 2);
        
        // Visual feedback
        ball.color = [255, 100, 100];
    }
}

function checkScore() {
    // Player scores (ball passes AI paddle)
    if (ball.x > width) {
        score++;
        resetBall();
        ball.speedX = -5;
        updateScoreDisplay();
    }
    
    // AI scores (ball passes player paddle)
    if (ball.x < 0) {
        aiScore++;
        resetBall();
        ball.speedX = 5;
        updateScoreDisplay();
    }
    
    // Check for winner
    if (score >= 5 || aiScore >= 5) {
        gameState = "gameOver";
        document.getElementById("status").innerHTML = "🏆 Game Over!";
    }
}

function resetBall() {
    ball.x = width / 2;
    ball.y = height / 2;
    ball.speedY = random(-3, 3);
}

function drawGame() {
    // Draw paddles
    drawPaddle(playerPaddle);
    drawPaddle(aiPaddle);
    
    // Draw ball
    drawBall();
    
    // Draw score
    drawScoreDisplay();
}

function drawPaddle(paddle) {
    // Draw paddle with shadow
    fill(0, 0, 0, 100);
    noStroke();
    rect(paddle.x + 3, paddle.y + 3, paddle.width, paddle.height, 5);
    
    // Draw main paddle
    fill(paddle.color[0], paddle.color[1], paddle.color[2]);
    stroke(255, 255, 255, 150);
    strokeWeight(2);
    rect(paddle.x, paddle.y, paddle.width, paddle.height, 5);
    
    // Draw inner highlight
    fill(255, 255, 255, 50);
    noStroke();
    rect(paddle.x + 2, paddle.y + 2, paddle.width - 4, 10, 2);
}

function drawBall() {
    // Draw ball trail
    for (let i = 0; i < 5; i++) {
        let alpha = map(i, 0, 5, 30, 100);
        let size = map(i, 0, 5, ball.diameter * 0.5, ball.diameter);
        
        fill(ball.color[0], ball.color[1], ball.color[2], alpha);
        noStroke();
        ellipse(ball.x - i * ball.speedX * 0.2, ball.y - i * ball.speedY * 0.2, size);
    }
    
    // Draw main ball
    fill(ball.color[0], ball.color[1], ball.color[2]);
    stroke(255, 255, 255);
    strokeWeight(2);
    ellipse(ball.x, ball.y, ball.diameter);
    
    // Draw ball highlight
    fill(255, 255, 255, 100);
    noStroke();
    ellipse(ball.x - ball.diameter/4, ball.y - ball.diameter/4, ball.diameter/3);
}

function drawScoreDisplay() {
    // Score background
    fill(0, 0, 0, 150);
    noStroke();
    rect(width/2 - 100, 10, 200, 60, 10);
    
    // Score text
    fill(255);
    noStroke();
    textAlign(CENTER);
    textSize(32);
    
    // Player score (left)
    fill(255, 100, 100);
    text(score, width/2 - 40, 50);
    
    // Separator
    fill(255, 255, 255, 100);
    text(":", width/2, 50);
    
    // AI score (right)
    fill(255, 200, 100);
    text(aiScore, width/2 + 40, 50);
    
    // Score labels
    textSize(14);
    fill(200, 200, 200);
    text("PLAYER", width/2 - 40, 70);
    text("AI", width/2 + 40, 70);
}

function drawGameOver() {
    // Overlay
    fill(0, 0, 0, 200);
    noStroke();
    rect(0, 0, width, height);
    
    // Game over text
    fill(255);
    textAlign(CENTER);
    textSize(48);
    
    if (score > aiScore) {
        text("🎉 YOU WIN!", width/2, height/2 - 60);
    } else {
        text("💻 AI WINS!", width/2, height/2 - 60);
    }
    
    // Final score
    textSize(36);
    text(score + " - " + aiScore, width/2, height/2);
    
    // Restart prompt
    textSize(24);
    fill(200, 200, 255);
    text("Click 'Restart' to play again", width/2, height/2 + 60);
}

function playPaddleSound() {
    // Create a simple beep sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        
    } catch (e) {
        // Sound not supported
    }
}

function updateScoreDisplay() {
    // Update the HTML status
    document.getElementById("status").innerHTML = 
        `🎮 Score: ${score} - ${aiScore}`;
}

function updateStatus(message) {
    if (document.getElementById("status")) {
        document.getElementById("status").innerHTML = message;
    }
}

function showError(message) {
    console.error(message);
    if (document.getElementById("status")) {
        document.getElementById("status").innerHTML = "❌ " + message;
        document.getElementById("status").style.background = "linear-gradient(45deg, #ff6b6b, #ee5a24)";
    }
}

// Game control functions
function startGame() {
    console.log("Starting game...");
    
    try {
        gameState = "playing";
        score = 0;
        aiScore = 0;
        resetBall();
        
        updateStatus("🎮 Game Started! Move your wrist");
        document.getElementById("status").style.background = "linear-gradient(45deg, #00b09b, #96c93d)";
        
        // Ensure game is running
        loop();
        
    } catch (error) {
        console.error("Start game error:", error);
        showError("Failed to start game");
    }
}

function restart() {
    console.log("Restarting game...");
    
    try {
        gameState = "playing";
        score = 0;
        aiScore = 0;
        resetBall();
        
        updateStatus("🔄 Game Restarted!");
        
        // Change back to playing status after delay
        setTimeout(() => {
            if (gameState === "playing") {
                updateStatus("🎮 Game Running");
            }
        }, 1000);
        
        // Ensure game is running
        loop();
        
    } catch (error) {
        console.error("Restart error:", error);
        showError("Failed to restart");
    }
}

// Mouse fallback
function mouseMoved() {
    // This will be used if PoseNet isn't available
    if (gameState === "playing") {
        rightWristY = mouseY;
        rightWristX = mouseX;
    }
}

// Ensure p5 functions are globally available
window.setup = setup;
window.draw = draw;
window.mouseMoved = mouseMoved;
window.startGame = startGame;
window.restart = restart;

console.log("main.js loaded successfully!");
