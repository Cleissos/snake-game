const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const boatImage = new Image();
boatImage.src = "assets/boat.png";
const snakeImage = new Image();
snakeImage.src = "assets/snake.png";

let wavesOffset = 0;
let particles = [];

canvas.width = 800;
canvas.height = 600;

let gameState = "menu";

// Variáveis da cobra
const snake = {
    // x: 100,
    // y: 100,
    // width: 60,
    // height: 60,
    // speed: 2

    x: canvas.width / 2,
    y: canvas.height + 200, // começa fora da tela
    width: 80,
    height: 80,
    speed: 2,
    emerging: false
};

let lives = 3;
let snakeActive = false;

let obstacles = [];

// 🎮 Jogador

const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 40,
    height: 60,

    // Velocidades
    velocityX: 0,
    velocityY: 0,

    // Aceleração
    acceleration: 0.5,
    forwardAcceleration: 0.3,

    // Velocidade máxima
    maxSpeedX: 6,
    maxSpeedY: 6,

    // Atrito
    frictionX: 0.95,
    frictionY: 0.95,

    boosting: false
};


let keys = {};

function spawnObstacle() {
    obstacles.push({
        x: Math.random() * (canvas.width - 40),
        y: -50,
        width: 40,
        height: 40,
        speed: 3
    });
}

function updateObstacles() {

    obstacles.forEach((obs, index) => {

        obs.y += obs.speed;

        // Remove quando sai da tela
        if (obs.y > canvas.height) {
            obstacles.splice(index, 1);
        }

        // Colisão com player
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            obstacles.splice(index, 1);
            loseLife();
        }

    });
}

function drawObstacles() {

    ctx.fillStyle = "brown";

    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });
}


function loseLife() {
    // lives--;

    // player.velocityX *= 0.3;
    // player.velocityY *= 0.3;

    // snakeActive = true;

    // if (snakeActive) {
    //     updateSnake();
    //     drawSnake();
    // }

    // if (lives <= 0) {
    //     gameState = "gameover";
    // }

     lives--;

    player.velocityX *= 0.3;
    player.velocityY *= 0.3;

    // Ativar cobra
    snakeActive = true;
    snake.emerging = true;

    // Posicionar atrás do jogador
    snake.x = player.x;
    snake.y = canvas.height + 100;

    if (lives <= 0) {
        gameState = "gameover";
    }
}


// function updateSnake() {
//     const dx = player.x - snake.x;
//     const dy = player.y - snake.y;

//     snake.x += dx * 0.02;
//     snake.y += dy * 0.02;
// }

function updateSnake() {

    // 🎬 FASE DE SURGIMENTO
    if (snake.emerging) {

        snake.y -= 4; // sobe da água

        // Criar partículas grandes de água
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: snake.x + snake.width / 2,
                y: snake.y + snake.height,
                size: Math.random() * 8 + 4,
                speedY: Math.random() * 3,
                alpha: 1
            });
        }

        // Quando chegar perto do jogador
        if (snake.y < player.y + 150) {
            snake.emerging = false;
        }

        return; // não persegue ainda
    }

    // 🧠 IA NORMAL
    const dx = player.x - snake.x;
    const dy = player.y - snake.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 1) {
        snake.x += (dx / distance) * snake.speed;
        snake.y += (dy / distance) * snake.speed;
    }
}


function drawSnake() {
    ctx.drawImage(
        snakeImage,
        snake.x,
        snake.y,
        snake.width,
        snake.height
    );
}

// =============================
// LOOP PRINCIPAL
// =============================
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);

}

function update() {
    if (gameState === "playing") {
        updatePlayer();
        updateSnake();
        updateObstacles();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "menu") {
        drawMenu();
    }

    if (gameState === "playing") {
        drawGame();
    }
}

function drawMenu() {
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("RIVER RACE", 280, 250);

    ctx.font = "20px Arial";
    ctx.fillText("Pressione ENTER para começar", 250, 300);
}


function drawGame() {

    drawRiver();
    drawObstacles();

    if (snakeActive) {
        drawSnake(); // desenha primeiro
    }

    drawPlayer();   // barco por cima
    drawWaterTrail();
}


// =============================
// PLAYER
// =============================

function updatePlayer() {

    // =========================
    // MOVIMENTO HORIZONTAL
    // =========================

    if (keys["ArrowLeft"]) {
        player.velocityX -= player.acceleration;
    }

    if (keys["ArrowRight"]) {
        player.velocityX += player.acceleration;
    }

    // =========================
    // MOVIMENTO VERTICAL
    // =========================

    if (keys["ArrowUp"]) {
        player.velocityY -= player.forwardAcceleration;
        player.boosting = true;
    }
    else if (keys["ArrowDown"]) {
        player.velocityY += player.forwardAcceleration;
        player.boosting = false;
    }
    else {
        player.boosting = false;
    }

    // =========================
    // TURBO
    // =========================

    if (player.boosting) {
        player.maxSpeedX = 10;
        player.maxSpeedY = 8;
    } else {
        player.maxSpeedX = 6;
        player.maxSpeedY = 6;
    }

    // =========================
    // LIMITES DE VELOCIDADE
    // =========================

    player.velocityX = Math.max(
        -player.maxSpeedX,
        Math.min(player.velocityX, player.maxSpeedX)
    );

    player.velocityY = Math.max(
        -player.maxSpeedY,
        Math.min(player.velocityY, player.maxSpeedY)
    );

    // =========================
    // ATRITO
    // =========================

    player.velocityX *= player.frictionX;
    player.velocityY *= player.frictionY;

    // =========================
    // ATUALIZA POSIÇÃO
    // =========================

    player.x += player.velocityX;
    player.y += player.velocityY;

    // =========================
    // LIMITES DA TELA
    // =========================

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width)
        player.x = canvas.width - player.width;

    if (player.y < 0) player.y = 0;
    if (player.y + player.height > canvas.height)
        player.y = canvas.height - player.height;

    // =========================
    // PARTÍCULAS DE ÁGUA
    // =========================

    if (Math.abs(player.velocityX) > 1 || Math.abs(player.velocityY) > 1) {

        particles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height,
            size: Math.random() * 5 + 2,
            speedY: Math.random() * 2 + 1,
            alpha: 1
        });

        // Limite de partículas para não pesar
        if (particles.length > 100) {
            particles.shift();
        }
    }
}

function drawPlayer() {

    // 🔥 Sombra
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(
        player.x + player.width / 2,
        player.y + player.height + 8,
        player.width / 2,
        10,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // 🔥 Efeito visual de turbo
    if (player.boosting) {
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2 - 5, player.y + player.height);
        ctx.lineTo(player.x + player.width / 2 + 5, player.y + player.height);
        ctx.lineTo(player.x + player.width / 2, player.y + player.height + 20);
        ctx.closePath();
        ctx.fill();
    }


    // 🚤 Sprite
    ctx.drawImage(
        boatImage,
        player.x,
        player.y,
        player.width,
        player.height
    );
}

function drawRiver() {

    wavesOffset += 2;

    for (let i = 0; i < canvas.height; i += 40) {

        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.beginPath();

        for (let x = 0; x < canvas.width; x += 20) {
            let y = i + Math.sin((x + wavesOffset) * 0.02) * 5;
            ctx.lineTo(x, y);
        }

        ctx.stroke();
    }
}

function drawWaterTrail() {

    particles.forEach((p, index) => {

        p.y += p.speedY;
        p.alpha -= 0.02;

        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.alpha <= 0) {
            particles.splice(index, 1);
        }
    });
}


// =============================
// TECLADO
// =============================
document.addEventListener("keydown", (e) => {
    keys[e.key] = true;

    if (gameState === "menu" && e.key === "Enter") {
        gameState = "playing";
    }
});

document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

gameLoop();
setInterval(spawnObstacle, 1500);

