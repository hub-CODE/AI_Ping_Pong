/* Enhanced by AI Assistant - Based on original by Prashant Shukla */

// Game variables
var paddle2 = 12, paddle1 = 12;
var paddle1X = 20, paddle1Height = 110;
var paddle2Y = 665, paddle2Height = 90;

var score1 = 0, score2 = 0;
var paddle1Y;

var playerscore = 0;
var pcscore = 0;

// Ball properties with enhanced physics
var ball = {
    x: 350/2,
    y: 480/2,
    r: 15,
    dx: 4,
    dy: 4,
    trail: [],
    maxTrail: 8
}

// PoseNet variables
var rightWristY = 0;
var rightWristX = 0;
var scoreRightWrist = 0;
var game_status = "";

// Visual effects
var particles = [];
var hitEffects = [];
var gameStarted = false;

// Sound variables
var ball_touch_paddel;
var missed;
var backgroundMusic;
var victorySound;

function preload() {
    ball_touch_paddel = loadSound("https://assets.mixkit.co/sfx/preview/mixkit-retro-game-emergency-alarm-1000.mp3");
    missed = loadSound("https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-over-213.mp3");
    // You can replace these with your own sound files
}

function setup() {
    var canvas = createCanvas(700, 600);
    canvas.parent('canvas');
    
    // Enhanced canvas styling
    canvas.elt.style.border = '3px solid rgba(255, 255, 255, 0.3)';
    canvas.elt.style.borderRadius = '15px';
    canvas.elt.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    
    video = createCapture(VIDEO);
    video.size(700, 600);
    video.hide();
    
    poseNet = ml5.poseNet(video, modelLoaded);
    poseNet.on('pose', gotPoses);
    
    // Initialize particles
    for(let i = 0; i < 20; i++) {
        particles.push({
            x: random(width),
            y: random(height),
            size: random(2, 5),
            speed: random(1, 3)
        });
    }
}

function modelLoaded() {
    console.log('PoseNet Is Initialized - Ready for NeuraPong!');
}

function gotPoses(results) {
    if(results.length > 0) {
        rightWristY = results[0].pose.rightWrist.y;
        rightWristX = results[0].pose.rightWrist.x;
        scoreRightWrist = results[0].pose.keypoints[10].score;
    }
}

function startGame() {
    game_status = "start";
    gameStarted = true;
    document.getElementById("status").innerHTML = "🎮 Game Loaded - Move Your Wrist!";
    document.getElementById("status").style.background = "linear-gradient(45deg, #00b09b, #96c93d)";
}

function draw() {
    // Enhanced background with gradient effect
    drawEnhancedBackground();
    
    // Draw video feed with overlay
    drawVideoFeed();
    
    // Draw court elements
    drawCourt();
    
    // Draw wrist tracking
    if(scoreRightWrist > 0.2) {
        drawWristMarker();
    }
    
    if(game_status == "start") {
        updateGameStatus();
        paddleInCanvas();
        
        // Draw paddles with enhanced graphics
        drawPlayerPaddle();
        drawComputerPaddle();
        
        // Draw game elements
        midline();
        drawScore();
        drawModels();
        
        // Update game physics
        move();
        updateTrail();
        updateParticles();
        updateHitEffects();
    }
}

function drawEnhancedBackground() {
    // Gradient background
    for(let y = 0; y < height; y++) {
        let inter = map(y, 0, height, 0, 1);
        let c = lerpColor(color(102, 126, 234), color(118, 75, 162), inter);
        stroke(c);
        line(0, y, width, y);
    }
}

function drawVideoFeed() {
    // Draw video with transparency and overlay
    tint(255, 150);
    image(video, 0, 0, 700, 600);
    noTint();
    
    // Add overlay
    fill(0, 0, 0, 50);
    rect(0, 0, width, height);
}

function drawCourt() {
    // Enhanced court boundaries
    fill(255, 255, 255, 30);
    stroke(255, 255, 255, 80);
    strokeWeight(3);
    rect(680, 0, 20, 700);
    rect(0, 0, 20, 700);
}

function drawWristMarker() {
    // Enhanced wrist marker with glow effect
    fill(255, 50, 50, 200);
    stroke(255, 100, 100);
    strokeWeight(3);
    
    // Pulsing effect
    let pulseSize = sin(frameCount * 0.1) * 5 + 25;
    circle(rightWristX, rightWristY, pulseSize);
    
    // Inner circle
    fill(255, 100, 100);
    noStroke();
    circle(rightWristX, rightWristY, 15);
}

function drawPlayerPaddle() {
    // Glowing player paddle
    drawGlowingRect(paddle1X, paddle1Y, paddle1, paddle1Height, color(255, 50, 50));
    
    // Paddle details
    fill(255, 100, 100);
    noStroke();
    rect(paddle1X + 2, paddle1Y + 2, paddle1 - 4, paddle1Height - 4, 5);
}

function drawComputerPaddle() {
    var paddle2y = ball.y - paddle2Height/2;
    drawGlowingRect(paddle2Y, paddle2y, paddle2, paddle2Height, color(255, 165, 0));
    
    // Paddle details
    fill(255, 200, 100);
    noStroke();
    rect(paddle2Y + 2, paddle2y + 2, paddle2 - 4, paddle2Height - 4, 5);
}

function drawGlowingRect(x, y, w, h, col) {
    // Multiple layers for glow effect
    for(let i = 5; i > 0; i--) {
        fill(red(col), green(col), blue(col), 50/i);
        stroke(red(col), green(col), blue(col), 100/i);
        strokeWeight(i);
        rect(x, y, w, h, 10);
    }
}

function midline() {
    stroke(255, 255, 255, 100);
    strokeWeight(2);
    
    // Dashed center line
    for(let i = 0; i < height; i += 20) {
        line(width/2, i, width/2, i + 10);
    }
    
    // Center circle
    noFill();
    stroke(255, 255, 255, 80);
    ellipse(width/2, height/2, 100, 100);
}

function drawScore() {
    textAlign(CENTER);
    textSize(26);
    fill(255);
    stroke(0);
    strokeWeight(4);
    
    // Player score with glow
    drawTextWithShadow("Player: " + playerscore, 120, 50);
    drawTextWithShadow("Computer: " + pcscore, 580, 50);
    
    // Score divider
    fill(255, 255, 255, 100);
    noStroke();
    text("|", width/2, 50);
}

function drawTextWithShadow(text, x, y) {
    // Text shadow
    fill(0, 0, 0, 150);
    text(text, x + 2, y + 2);
    
    // Main text
    fill(255);
    text(text, x, y);
}

function drawModels() {
    textSize(14);
    fill(255, 200);
    noStroke();
    text("Speed: " + abs(ball.dx).toFixed(1), 60, 25);
    text("Level: " + (playerscore + pcscore + 1), width/2, 25);
}

function move() {
    drawBall();
    
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Ball trail
    ball.trail.push({x: ball.x, y: ball.y});
    if(ball.trail.length > ball.maxTrail) {
        ball.trail.shift();
    }
    
    // Right wall collision
    if(ball.x + ball.r > width - ball.r/2) {
        ball.dx = -ball.dx - 0.2;
        createHitEffect(ball.x, ball.y);
    }
    
    // Left wall collision (player paddle)
    if(ball.x - 2.5 * ball.r/2 < 30) {
        if(ball.y >= paddle1Y && ball.y <= paddle1Y + paddle1Height) {
            handlePaddleHit();
        } else {
            handleMiss();
        }
    }
    
    // Game over condition
    if(pcscore >= 5) {
        gameOver();
    }
    
    // Top/bottom wall collision
    if(ball.y + ball.r > height || ball.y - ball.r < 0) {
        ball.dy = -ball.dy;
        createHitEffect(ball.x, ball.y);
    }
    
    // Speed limits
    ball.dx = constrain(ball.dx, -8, 8);
    ball.dy = constrain(ball.dy, -8, 8);
}

function drawBall() {
    // Draw trail
    for(let i = 0; i < ball.trail.length; i++) {
        let alpha = map(i, 0, ball.trail.length, 50, 200);
        let size = map(i, 0, ball.trail.length, ball.r * 0.3, ball.r * 0.8);
        
        fill(50, 350, 0, alpha);
        noStroke();
        ellipse(ball.trail[i].x, ball.trail[i].y, size);
    }
    
    // Main ball with glow
    fill(50, 350, 0);
    stroke(255, 255, 0);
    strokeWeight(2);
    ellipse(ball.x, ball.y, ball.r * 2);
    
    // Ball inner detail
    fill(200, 255, 100);
    noStroke();
    ellipse(ball.x, ball.y, ball.r);
}

function handlePaddleHit() {
    ball.dx = -ball.dx + 0.3;
    
    // Add spin based on paddle movement
    let paddleSpeed = abs(rightWristY - paddle1Y);
    ball.dy += paddleSpeed * 0.1;
    
    playerscore++;
    ball_touch_paddel.play();
    createHitEffect(ball.x, ball.y);
    
    // Visual feedback
    document.getElementById("status").innerHTML = "🔥 Great Save!";
    setTimeout(() => {
        if(game_status == "start") {
            document.getElementById("status").innerHTML = "🎮 Game Loaded - Move Your Wrist!";
        }
    }, 1000);
}

function handleMiss() {
    pcscore++;
    missed.play();
    
    // Enhanced vibration pattern
    if("vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
    
    createHitEffect(ball.x, ball.y, true);
    reset();
}

function gameOver() {
    // Game over screen
    fill(255, 165, 0, 200);
    noStroke();
    rect(0, 0, width, height);
    
    fill(255);
    stroke(0);
    strokeWeight(4);
    textSize(32);
    textAlign(CENTER);
    
    drawTextWithShadow("Game Over!", width/2, height/2 - 40);
    
    textSize(24);
    drawTextWithShadow("Final Score: " + playerscore + " - " + pcscore, width/2, height/2);
    drawTextWithShadow("Press Restart to play again!", width/2, height/2 + 40);
    
    noLoop();
}

function reset() {
    ball.x = width/2;
    ball.y = height/2;
    ball.dx = (random() > 0.5 ? 1 : -1) * 4;
    ball.dy = random(-3, 3);
    ball.trail = [];
}

function updateTrail() {
    // Keep trail length manageable
    if(ball.trail.length > ball.maxTrail) {
        ball.trail.shift();
    }
}

function updateParticles() {
    for(let particle of particles) {
        particle.y += particle.speed;
        if(particle.y > height) {
            particle.y = 0;
            particle.x = random(width);
        }
        
        fill(255, 255, 255, 50);
        noStroke();
        ellipse(particle.x, particle.y, particle.size);
    }
}

function createHitEffect(x, y, isMiss = false) {
    let effectColor = isMiss ? color(255, 50, 50) : color(100, 255, 100);
    
    for(let i = 0; i < 8; i++) {
        hitEffects.push({
            x: x,
            y: y,
            size: random(5, 15),
            speed: random(2, 6),
            angle: random(TWO_PI),
            life: 255,
            color: effectColor
        });
    }
}

function updateHitEffects() {
    for(let i = hitEffects.length - 1; i >= 0; i--) {
        let effect = hitEffects[i];
        
        effect.x += cos(effect.angle) * effect.speed;
        effect.y += sin(effect.angle) * effect.speed;
        effect.life -= 10;
        
        fill(red(effect.color), green(effect.color), blue(effect.color), effect.life);
        noStroke();
        ellipse(effect.x, effect.y, effect.size);
        
        if(effect.life <= 0) {
            hitEffects.splice(i, 1);
        }
    }
}

function updateGameStatus() {
    if(!document.getElementById("status").innerHTML.includes("Game Loaded")) {
        document.getElementById("status").innerHTML = "🎮 Game Loaded - Move Your Wrist!";
    }
}

function paddleInCanvas() {
    if(rightWristY + paddle1Height > height) {
        rightWristY = height - paddle1Height;
    }
    if(rightWristY < 0) {
        rightWristY = 0;
    }
    paddle1Y = rightWristY;
}

function restart() {
    pcscore = 0;
    playerscore = 0;
    reset();
    loop();
    game_status = "start";
    document.getElementById("status").innerHTML = "🔄 Game Restarted!";
    setTimeout(() => {
        document.getElementById("status").innerHTML = "🎮 Game Loaded - Move Your Wrist!";
    }, 1500);
}
