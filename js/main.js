const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas(); // inicializa o tamanho correto



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
let cameraShake = 0;
const splashSound = new Audio("audio/Splash de Água 3.mp3");


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

function showRestartButton() {
    // Evitar criar mais de um
    if (document.getElementById("restartButton")) return;

    const button = document.createElement("button");
    button.id = "restartButton";
    button.textContent = "Jogar Novamente";

    // Centralizar com flex e responsivo
    Object.assign(button.style, {
        position: "fixed",
        left: "50%",
        top: "60%",
        transform: "translateX(-50%)",
        padding: "2vh 4vw",
        fontSize: "3vw",
        cursor: "pointer",
        backgroundColor: "#1e90ff",
        color: "white",
        border: "none",
        borderRadius: "10px",
        zIndex: 1000,
    });

    // Suporte a clique e toque
    button.addEventListener("click", restartGame);
    button.addEventListener("touchstart", restartGame);

    document.body.appendChild(button);
}


// function showRestartButton() {
//     // Criar botão
//     const button = document.createElement("button");
//     button.id = "restartButton";
//     button.textContent = "Jogar Novamente";

//     // Estilizar botão
//     button.style.position = "absolute";
//     button.style.left = "50%";
//     button.style.top = "300px";
//     button.style.transform = "translateX(-50%)";
//     button.style.padding = "15px 30px";
//     button.style.fontSize = "20px";
//     button.style.cursor = "pointer";
//     button.style.backgroundColor = "#1e90ff";
//     button.style.color = "white";
//     button.style.border = "none";
//     button.style.borderRadius = "10px";

//     // Adicionar evento
//     button.addEventListener("click", restartGame);

//     document.body.appendChild(button);
// }

function restartGame() {
    // Remover botão
    const button = document.getElementById("restartButton");
    if (button) button.remove();

    // Resetar variáveis
    gameState = "playing";
    lives = 3;
    snakeActive = false;
    snake.emerging = false;
    snake.x = canvas.width / 2;
    snake.y = canvas.height + 200;

    obstacles = [];
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    player.velocityX = 0;
    player.velocityY = 0;

    particles = [];
}



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

    lives--;

    player.velocityX *= 0.3;
    player.velocityY *= 0.3;

    // Só ativa se ainda não estiver ativa
    if (!snakeActive) {

        snakeActive = true;
        snake.emerging = true;

        // Posicionar atrás do jogador
        snake.x = player.x;
        snake.y = canvas.height + 100;

        splashSound.currentTime = 0;
        splashSound.play();
        cameraShake = 20;
    }

    if (lives <= 0) {
        gameState = "gameover";
    }
}


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

    } else {
        // 🧠 IA NORMAL (agora está certo)

        const dx = player.x - snake.x;
        const dy = player.y - snake.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            snake.x += (dx / distance) * snake.speed;
            snake.y += (dy / distance) * snake.speed;
        }
    }


    if (snakeActive && !snake.emerging) {
        if (
            player.x < snake.x + snake.width &&
            player.x + player.width > snake.x &&
            player.y < snake.y + snake.height &&
            player.y + player.height > snake.y
        ) {
            gameState = "gameover";
        }
    }
}

function drawGameOver() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "red";
    ctx.font = "50px Arial";
    ctx.fillText("GAME OVER", 250, 300);

    // Mostrar botão
    if (!document.getElementById("restartButton")) {
        showRestartButton();
    }
}

function drawSnake() {

    const segments = 8;
    const segmentHeight = snake.height / segments;

    for (let i = 0; i < segments; i++) {

        const wave = Math.sin(Date.now() * 0.01 + i) * 10;

        ctx.drawImage(
            snakeImage,
            snake.x + wave,
            snake.y + i * segmentHeight,
            snake.width,
            segmentHeight
        );
    }

    // 💀 Olhos brilhando
    if (snake.emerging) {
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(snake.x + 20, snake.y + 15, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(snake.x + 45, snake.y + 15, 5, 0, Math.PI * 2);
        ctx.fill();
    }
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

    ctx.save();

    if (cameraShake > 0) {
        const shakeX = (Math.random() - 0.5) * 10;
        const shakeY = (Math.random() - 0.5) * 10;
        ctx.translate(shakeX, shakeY);
        cameraShake--;
    }

    if (gameState === "menu") drawMenu();
    if (gameState === "playing") drawGame();
    if (gameState === "gameover") drawGameOver();

    ctx.restore();
}

function drawWaterExplosion(x, y) {

    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 10 + 5,
            speedY: Math.random() * -5,
            alpha: 1
        });
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
    drawWaterWaves()
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
            x: player.x + player.width / 2 + (Math.random() - 0.5) * 15,
            y: player.y + player.height,
            size: Math.random() * 6 + 2,
            speedY: Math.random() * 2 + 1,
            alpha: 1,
            drift: (Math.random() - 0.5) * 1.5 // 🌊 espalhamento lateral
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

    // 🎨 Gradiente de água
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

    gradient.addColorStop(0, "#1e90ff");   // azul claro
    gradient.addColorStop(0.5, "#187bcd"); // médio
    gradient.addColorStop(1, "#0f3057");   // fundo escuro

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawWaterTrail();
    drawWaterReflection();
}

function drawWaterReflection() {
    // reflexo simples do barco na água
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.scale(1, -1); // inverte verticalmente
    ctx.drawImage(
        boatImage,
        player.x,
        -player.y - player.height * 2, // espelhamento
        player.width,
        player.height
    );
    ctx.restore();
}


function drawWaterWaves() {
    const waveHeight = 5;      // altura da onda
    const waveLength = 100;     // comprimento da onda
    const waveSpeed = 0.05;     // velocidade de deslocamento
    const waveCount = 20;        // número de ondas no rio

    for (let i = 0; i < waveCount; i++) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + i*0.05})`; // transparencia suave
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let x = 0; x < canvas.width; x++) {
            let y = canvas.height/3 + i * 20 + Math.sin((x * 0.05) + (Date.now() * waveSpeed) + i) * waveHeight;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.stroke();
    }
}


function drawWaterTrail() {

    particles.forEach((p, index) => {

        p.y += p.speedY;

        // Se drift existir, usa. Senão, usa 0.
        p.x += p.drift || 0;

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

canvas.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    if (touch.clientX < window.innerWidth / 2) keys["ArrowLeft"] = true;
    else keys["ArrowRight"] = true;

    if (touch.clientY < window.innerHeight / 2) keys["ArrowUp"] = true;
    else keys["ArrowDown"] = true;
});

canvas.addEventListener("touchend", () => {
    keys = {}; // limpa todos os movimentos
});


gameLoop();
setInterval(spawnObstacle, 1500);

