const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let riverWidth = canvas.width * 0.5; // 50% da tela
let riverX = canvas.width / 2 - riverWidth / 2;
let landOffset = 0;

const landLeftImage = new Image();
landLeftImage.src = "assets/terra_left.png";

const landRightImage = new Image();
landRightImage.src = "assets/terra_right.png";


const snakeSprites = {
    down: [],
    up: [],
    left: [],
    right: []
};

let currentDirection = "down";
let currentFrame = 0;
let frameTimer = 0;
let frameInterval = 150; // velocidade da animação (ms)

let riverSpeed = 1.5;
let riverAcceleration = 0.02;
let maxRiverSpeed = 8;

let enginePower = 0;
let maxEnginePower = 6;
let engineAcceleration = 0.2;

//Áudio global do motor do barco
const engineSound = new Audio("audio/audio1.mp3");
engineSound.loop = true;
engineSound.volume = 0;

const boatImage = new Image();
boatImage.src = "assets/boat.png";
const snakeImage = new Image();
snakeImage.src = "assets/snake.png";

const boatUpgradeImage = new Image();
boatUpgradeImage.src = "assets/barquinho3 (2).png";

// Obstáculos
const obstacleImage = new Image();
// obstacleImage.src = "assets/tronco.png";
obstacleImage.src = "assets/murure.png";

// Upgrade
const upgradeImage = new Image();
upgradeImage.src = "assets/estrela.png";

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
    speed: 1.5,          // perseguição
    emergeSpeed: 0.8,    // surgimento
    emerging: false,
    direction: "down" // direção inicial
};

let snakeActive = false;

let obstacles = [];
let cameraShake = 0;
const splashSound = new Audio("audio/Splash de Água 3.mp3");

// 🎮 Jogador
const player = {
    x: canvas.width / 2,
    // y: canvas.height - 100,
    y: canvas.height * 0.65,
    width: 40,
    height: 60,

    baseWidth: 40,  // para voltar ao normal depois
    baseHeight: 60,

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

    boosting: false,

    // NOVO: upgrade
    upgraded: false,
    upgradeTimer: 0,   // duração do upgrade em frames

    angle: 0,
    targetAngle: 0,
    rotationSpeed: 0.15,
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;

    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height * 0.6;

    riverWidth = canvas.width * 0.5;
    riverX = canvas.width / 2 - riverWidth / 2;

}


window.addEventListener("resize", () => {
    resizeCanvas();
    updateMobileControls();
});

window.addEventListener("load", () => {
    setTimeout(() => {
        resizeCanvas();
        updateMobileControls();
    }, 200); // pequeno delay para o mobile calcular a viewport correta
});


let upgrades = [];

function spawnUpgrade() {
    upgrades.push({
        // x: Math.random() * (canvas.width - 40),
        x: riverX + Math.random() * (riverWidth - 40),
        y: -50,
        width: 40,
        height: 40,
        speed: 2,
        type: "powerboat", // só como exemplo
        image: upgradeImage // referencia da imagem
    });
}
setInterval(spawnUpgrade, 10000)


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
let lives = 3;

function drawLives() {
    const heartSize = 30; // tamanho do coração
    const padding = 10;   // distância entre eles

    for (let i = 0; i < lives; i++) {
        ctx.fillStyle = "red";
        ctx.beginPath();
        const x = padding + i * (heartSize + padding);
        const y = 20;

        // forma simples de coração usando curvas
        ctx.moveTo(x + heartSize / 2, y + heartSize / 4);
        ctx.bezierCurveTo(
            x + heartSize / 2, y,
            x, y,
            x, y + heartSize / 4
        );
        ctx.bezierCurveTo(
            x, y + heartSize / 2,
            x + heartSize / 2, y + heartSize * 0.75,
            x + heartSize / 2, y + heartSize
        );
        ctx.bezierCurveTo(
            x + heartSize / 2, y + heartSize * 0.75,
            x + heartSize, y + heartSize / 2,
            x + heartSize, y + heartSize / 4
        );
        ctx.bezierCurveTo(
            x + heartSize, y,
            x + heartSize / 2, y,
            x + heartSize / 2, y + heartSize / 4
        );
        ctx.fill();
    }
}

function startGame() {

    gameState = "playing";

    resizeCanvas();

    createMobileControls();   // garante que existe
    updateMobileControls();   // posiciona corretamente

    lives = 3;
    snakeActive = false;
    snake.emerging = false;

    snake.x = canvas.width / 2;
    snake.y = canvas.height + 200;

    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height * 0.6;

    player.velocityX = 0;
    player.velocityY = 0;

    obstacles = [];
    particles = [];

    enginePower = 0;
    engineSound.pause();
    engineSound.currentTime = 0;


}

function loseLife() {
    lives--;

    // 🔥 TREMER TELA
    cameraShake = 15; // intensidade
    player.velocityX *= 0.3;
    player.velocityY *= 0.3;

    // Ativa cobra apenas se ainda não estiver ativa
    if (!snakeActive && !player.upgraded) {
        snakeActive = true;
        snake.emerging = true;
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

    const controls = document.getElementById("mobileControls");
    if (controls && window.innerWidth <= 900) {
        controls.style.display = "grid";
    }

}

function unlockAudio() {
    engineSound.volume = 0;

    engineSound.play()
        .then(() => {
            engineSound.pause();
            engineSound.currentTime = 0;
        })
        .catch(() => { });
}

function spawnObstacle() {
    obstacles.push({
        x: riverX + Math.random() * (riverWidth - 40),

        y: -50,
        width: 40,
        height: 40,
        speed: 1.5,
        image: obstacleImage
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
            if (!player.upgraded) {
                obstacles.splice(index, 1);
                loseLife();
            } else {
                obstacles.splice(index, 1);
            }
        }

    });
}

function drawObstacles() {

    ctx.fillStyle = "brown";

    obstacles.forEach(obs => {
        // ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.drawImage(obs.image, obs.x, obs.y, obs.width, obs.height);
    });
}

function updateSnake(deltaTime) {


    if (!snakeActive) return;

    // ========================
    // IA DE PERSEGUIÇÃO
    // ========================
    const dx = player.x - snake.x;
    const dy = player.y - snake.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 1) {
        snake.x += (dx / distance) * snake.speed;
        snake.y += (dy / distance) * snake.speed;

        // Define direção
        if (Math.abs(dx) > Math.abs(dy)) {
            currentDirection = dx > 0 ? "right" : "left";
        } else {
            currentDirection = dy > 0 ? "down" : "up";
        }
    }

    // ========================
    // ANIMAÇÃO
    // ========================
    frameTimer += deltaTime;

    if (frameTimer > frameInterval) {
        frameTimer = 0;
        currentFrame++;

        if (currentFrame >= TOTAL_FRAMES) {
            currentFrame = 0;
        }
    }

    // ========================
    // COLISÃO
    // ========================
    if (
        player.x < snake.x + snake.width &&
        player.x + player.width > snake.x &&
        player.y < snake.y + snake.height &&
        player.y + player.height > snake.y
    ) {
        if (!player.upgraded) {
            gameState = "gameover";
        } else {
            snakeActive = false;
        }
    }

    const isMoving = keys["ArrowLeft"] ||
        keys["ArrowRight"] ||
        keys["ArrowUp"] ||
        keys["ArrowDown"];

    if (isMoving) {

        frameTimer += deltaTime;

        if (frameTimer > frameInterval) {
            frameTimer = 0;
            currentFrame++;

            if (currentFrame >= TOTAL_FRAMES) {
                currentFrame = 0;
            }
        }
    } else {
        currentFrame = 0; // parado usa primeiro frame
    }
}

const TOTAL_FRAMES = 47;

function loadSnakeFrames() {

    for (let i = 0; i < TOTAL_FRAMES; i++) {

        const down = new Image();
        down.src = `snake_down/frame_${i}.png`;
        snakeSprites.down.push(down);

        const up = new Image();
        up.src = `snake_up/frame_${i}.png`;
        snakeSprites.up.push(up);

        const left = new Image();
        left.src = `snake_left/frame_${i}.png`;
        snakeSprites.left.push(left);

        const right = new Image();
        right.src = `snake_right/frame_${i}.png`;
        snakeSprites.right.push(right);
    }
}

loadSnakeFrames();


function drawSnake() {

    const sprite = snakeSprites[currentDirection][currentFrame];

    if (sprite) {
        ctx.drawImage(sprite, snake.x, snake.y, snake.width, snake.height);
    }
}



// =============================
// LOOP PRINCIPAL

let lastTime = 0;

function gameLoop(time) {

    let deltaTime = time - lastTime;
    lastTime = time;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}


function update(deltaTime) {
    if (gameState === "playing") {
        landOffset += riverSpeed;

        createBoatWaves();
        updatePlayer();
        updateSnake(deltaTime);
        updateObstacles();
        updateUpgrades();
    }
}

function drawGameOver() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "red";
    ctx.font = "50px Arial";
    // ctx.fillText("GAME OVER", 250, 300);
    ctx.fillText("GAME OVER", canvas.width / 2 - 150, canvas.height / 2);

    const controls = document.getElementById("mobileControls");
    if (controls) controls.style.display = "none";

    showRestartButton();
}

function updateUpgrades() {
    upgrades.forEach((up, index) => {
        up.y += up.speed;

        // colisão com o jogador
        if (
            player.x < up.x + up.width &&
            player.x + player.width > up.x &&
            player.y < up.y + up.height &&
            player.y + player.height > up.y
        ) {
            player.upgraded = true;
            player.upgradeTimer = 600; // duração do upgrade, ex: 600 frames = 10 segundos se rodando 60fps
            player.width = 40;  // aumenta tamanho
            player.height = 80;

            upgrades.splice(index, 1);
        }

        // remover se sair da tela
        if (up.y > canvas.height) {
            upgrades.splice(index, 1);
        }
    });

    // reduzir o timer do upgrade
    if (player.upgraded) {
        player.upgradeTimer--;
        if (player.upgradeTimer <= 0) {
            player.upgraded = false;
            player.width = player.baseWidth;
            player.height = player.baseHeight;
        }
    }
}

function drawUpgrades() {
    upgrades.forEach(up => {
        ctx.drawImage(up.image, up.x, up.y, up.width, up.height);
    });
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
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";

    ctx.fillText("RIVER ESCAPE", canvas.width / 2, canvas.height / 2 - 40);
    ctx.fillText("Pressione ENTER", canvas.width / 2, canvas.height / 2 + 20);
}


function drawGame() {
    // ================================
    // 1️⃣ Desenhar rio e ondas
    // ================================
    drawRiver();
    drawWaterWaves(); // função que cria ondas animadas

    // ================================
    // 2️⃣ Desenhar obstáculos
    // ================================
    drawObstacles();

    drawUpgrades();
    // ================================
    // 3️⃣ Desenhar vidas do jogador
    // ================================
    drawLives();


    // ================================
    // 4️⃣ Desenhar cobra se estiver ativa
    // ================================
    if (snakeActive) {
        drawSnake();
    }

    drawPlayer();

    // ================================
    // 6️⃣ Desenhar partículas de água
    // ================================
    drawWaterTrail();

}

// =============================
// PLAYER
// =============================
function updatePlayer() {

    if (gameState !== "playing") return;

    // =========================
    // VELOCIDADE DO RIO
    // =========================
    player.y += riverSpeed * 0.5;

    // Motor empurra para cima
    // player.y -= enginePower;

    // Movimento baseado no ângulo do barco
    player.x += Math.sin(player.angle) * enginePower;
    player.y -= Math.cos(player.angle) * enginePower;


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
    // MOVIMENTO VERTICAL (Motor)
    // =========================
    if (keys["ArrowUp"]) {
        player.boosting = true;

        enginePower += engineAcceleration;
        if (enginePower > maxEnginePower) {
            enginePower = maxEnginePower;
        }
    } else {
        player.boosting = false;

        enginePower -= 0.1;
        if (enginePower < 0) enginePower = 0;
    }

    if (keys["ArrowDown"]) {
        player.boosting = true;

        enginePower += engineAcceleration;
        if (enginePower > maxEnginePower) {
            enginePower = maxEnginePower;
        }
    }

    // =========================
    // DIREÇÃO FIXA 90°
    // =========================

    if (keys["ArrowUp"]) {
        player.targetAngle = 0;
    }

    if (keys["ArrowRight"]) {
        player.targetAngle = Math.PI / 2;
    }

    if (keys["ArrowDown"]) {
        player.targetAngle = Math.PI;
    }

    if (keys["ArrowLeft"]) {
        player.targetAngle = -Math.PI / 2;
    }


    // =========================
    // CONTROLE DO SOM DO MOTOR
    // =========================
    if (enginePower > 0) {

        if (engineSound.paused) {
            engineSound.play().catch(() => { });
        }

        engineSound.volume = enginePower / maxEnginePower;

    } else {

        if (!engineSound.paused) {
            engineSound.pause();
            engineSound.currentTime = 0;
        }
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
    // LIMITES DO RIO
    // =========================
    if (player.x < riverX)
        player.x = riverX;

    if (player.x + player.width > riverX + riverWidth)
        player.x = riverX + riverWidth - player.width;

    if (player.y < 0)
        player.y = 0;

    // =========================
    // 🔥 ROTACIONAR BARCO

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
            drift: (Math.random() - 0.5) * 1.5
        });

        if (particles.length > 100) {
            particles.shift();
        }
    }

    createSideWaves();

    // =========================
    // CAIU PARA FORA DA TELA
    // =========================
    if (player.y > canvas.height) {
        endGame();
        updateMobileControls();
    }

    // =========================
    // INTERPOLAÇÃO DA ROTAÇÃO
    // =========================

    let difference = player.targetAngle - player.angle;

    // Normaliza diferença entre -PI e PI
    difference = Math.atan2(Math.sin(difference), Math.cos(difference));

    player.angle += difference * player.rotationSpeed;
}

function endGame() {
    gameState = "gameover";

    enginePower = 0;
    engineSound.pause();
    engineSound.currentTime = 0;
}

function drawPlayer() {

    const imageToDraw = player.upgraded ? boatUpgradeImage : boatImage;

    ctx.save();

    // mover origem para centro do barco
    ctx.translate(
        player.x + player.width / 2,
        player.y + player.height / 2
    );

    // aplicar rotação
    ctx.rotate(player.angle);

    // desenhar imagem centralizada
    ctx.drawImage(
        imageToDraw,
        -player.width / 2,
        -player.height / 2,
        player.width,
        player.height
    );

    ctx.restore();
}



function createSideWaves() {

    const wavePower = player.upgraded ? 2 : 1;

    const speedIntensity = Math.abs(player.velocityX) + Math.abs(player.velocityY);

    if (speedIntensity > 0.5) {

        for (let i = 0; i < wavePower; i++) {

            // Lado esquerdo
            particles.push({
                x: player.x - 5,
                y: player.y + player.height / 2,
                size: Math.random() * 4 + 2 * wavePower,
                speedY: Math.random() * 1.5,
                alpha: 1,
                drift: - (Math.random() * 2 + 1) * wavePower
            });

            // Lado direito
            particles.push({
                x: player.x + player.width + 5,
                y: player.y + player.height / 2,
                size: Math.random() * 4 + 2 * wavePower,
                speedY: Math.random() * 1.5,
                alpha: 1,
                drift: (Math.random() * 2 + 1) * wavePower
            });
        }
    }
}


function drawRiver() {

    // 🌳 LADO ESQUERDO (Desenha a imagem repetida verticalmente)
    for (let i = -canvas.height; i < canvas.height * 2; i += canvas.height) {
        // O cálculo do Y usa o landOffset para dar a sensação de movimento
        let yPos = (i + landOffset) % (canvas.height * 2) - canvas.height;

        ctx.drawImage(
            landLeftImage,
            0,          // X: encostado na esquerda
            yPos,       // Y animado
            riverX,     // Largura: vai até o início do rio
            canvas.height // Altura: tamanho do canvas para preencher tudo
        );
    }

    // 🌳 LADO DIREITO
    for (let i = -canvas.height; i < canvas.height * 2; i += canvas.height) {
        let yPos = (i + landOffset) % (canvas.height * 2) - canvas.height;

        ctx.drawImage(
            landRightImage,
            riverX + riverWidth,              // X: começa onde o rio termina
            yPos,                             // Y animado
            canvas.width - (riverX + riverWidth), // Largura: o que sobrar da tela
            canvas.height
        );
    }

    // 🌲 Árvores animadas
    for (let i = 0; i < canvas.height; i += 120) {

        const treeY =
            (i + landOffset) % (canvas.height + 120) - 60;

        // esquerda
        drawTree(
            riverX / 2,
            treeY
        );

        // direita
        drawTree(
            riverX + riverWidth +
            (canvas.width - (riverX + riverWidth)) / 2,
            treeY
        );
    }

    // 🎨 Gradiente de água
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

    gradient.addColorStop(0, "#1e90ff");   // azul claro
    gradient.addColorStop(0.5, "#187bcd"); // médio
    gradient.addColorStop(1, "#0f3057");   // fundo escuro

    ctx.fillStyle = gradient;
    ctx.fillRect(riverX, 0, riverWidth, canvas.height);
    drawWaterReflection();
}

function drawTree(x, y) {

    // Tronco
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(x - 5, y + 20, 10, 20);

    // Copa
    ctx.fillStyle = "#125212";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
}

function drawWaterReflection() {

    const imageToDraw = player.upgraded ? boatUpgradeImage : boatImage;

    ctx.save();
    ctx.globalAlpha = 0.15;

    ctx.translate(player.x + player.width / 2, player.y + player.height + 10);
    ctx.scale(1, -1);

    ctx.drawImage(
        imageToDraw,
        -player.width / 2,
        0,
        player.width,
        player.height
    );

    ctx.restore();
}

function createBoatWaves() {

    const waveSize = player.upgraded ? 4 : 2;
    const spread = player.upgraded ? 25 : 15;

    for (let i = 0; i < 2; i++) {

        particles.push({
            x: player.x + Math.random() * player.width,
            y: player.y + player.height - 5,
            size: Math.random() * waveSize + 1,
            speedY: Math.random() * 1 + 0.5,
            alpha: 0.5
        });

        // laterais
        particles.push({
            x: player.x - spread + Math.random() * (player.width + spread * 2),
            y: player.y + player.height / 2,
            size: Math.random() * waveSize,
            speedY: Math.random() * 0.5,
            alpha: 0.4
        });
    }
}


function drawWaterWaves() {
    const waveHeight = 7;
    const waveSpeed = 2;
    const waveCount = 32;

    for (let i = 0; i < waveCount; i++) {

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.01 + i * 0.01})`;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let y = 0; y < canvas.height; y++) {

            let x =
                canvas.width / 4 +
                i * 15 +
                Math.sin((y * 0.05) + (Date.now() * waveSpeed) + i) * waveHeight;

            if (y === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.stroke();
    }
}


function drawWaterTrail() {

    particles.forEach((p, index) => {

        p.y += p.speedY;
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
        unlockAudio();
        startGame();
    }

});

document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});


canvas.addEventListener("touchstart", (e) => {
    if (gameState === "menu") {
        unlockAudio();
        startGame();
        e.preventDefault();
        return;
    }
});



function createMobileControls() {

    if (document.getElementById("mobileControls")) return;

    // Só para celular / tablet
    if (window.innerWidth > 900) return;

    const container = document.createElement("div");
    container.id = "mobileControls";

    Object.assign(container.style, {
        position: "fixed",
        bottom: "40px",
        left: "30px",
        width: "150px",
        height: "150px",
        zIndex: 1000,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr 1fr",
        opacity: "0.6",              // Transparente
        pointerEvents: "auto"
    });

    function createButton(direction, row, col) {

        const btn = document.createElement("button");
        btn.textContent = direction.replace("Arrow", "");

        Object.assign(btn.style, {
            gridRow: row,
            gridColumn: col,
            borderRadius: "50%",
            border: "none",
            background: "rgba(30,144,255,0.7)",
            color: "white",
            fontSize: "14px",
            touchAction: "none"
        });

        btn.addEventListener("touchstart", (e) => {
            keys[direction] = true;
            e.preventDefault();
        });

        btn.addEventListener("touchend", (e) => {
            keys[direction] = false;
            e.preventDefault();
        });

        container.appendChild(btn);
    }

    // Formato cruz
    createButton("ArrowUp", 1, 2);
    createButton("ArrowLeft", 2, 1);
    createButton("ArrowRight", 2, 3);
    createButton("ArrowDown", 3, 2);

    document.body.appendChild(container);
}

// chama essa função depois de inicializar o canvas
createMobileControls();

function updateMobileControls() {

    const controls = document.getElementById("mobileControls");
    if (!controls) return;

    const isMobile = window.innerWidth <= 900;

    if (!isMobile || gameState !== "playing") {
        controls.style.display = "none";
        return;
    }

    controls.style.display = "grid"; // ⚠️ IMPORTANTE: grid, não flex
}


// Para soltar a tecla quando tira o dedo
canvas.addEventListener("touchend", (e) => {
    keys["ArrowLeft"] = false;
    keys["ArrowRight"] = false;
    keys["ArrowUp"] = false;
    keys["ArrowDown"] = false;
});

document.addEventListener("keydown", (e) => {

    if (e.key === "ArrowLeft") currentDirection = "left";
    if (e.key === "ArrowRight") currentDirection = "right";
    if (e.key === "ArrowUp") currentDirection = "up";
    if (e.key === "ArrowDown") currentDirection = "down";

});



gameLoop();
setInterval(spawnObstacle, 1500);

