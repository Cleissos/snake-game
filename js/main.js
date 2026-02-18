const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas(); // inicializa o tamanho correto

let riverSpeed = 3;
let riverAcceleration = 0.02;
let maxRiverSpeed = 8;

let enginePower = 0;
let maxEnginePower = 6;
let engineAcceleration = 0.2;


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
    speed: 0.5,
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
};
resizeCanvas();

let upgrades = [];

function spawnUpgrade() {
    upgrades.push({
        x: Math.random() * (canvas.width - 40),
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

function spawnObstacle() {
    obstacles.push({
        x: Math.random() * (canvas.width - 40),
        y: -50,
        width: 40,
        height: 40,
        speed: 3,
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

            // loseLife();
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

function loseLife() {
    lives--;
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

function updateSnake() {
    if (snake.emerging) {
        // Fase de surgimento
        snake.y -= 4;
        if (snake.y < player.y + 150) snake.emerging = false;
        return;
    }

    if (!snakeActive) return;

    // IA da cobra
    const dx = player.x - snake.x;
    const dy = player.y - snake.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 1) {
        snake.x += (dx / distance) * snake.speed;
        snake.y += (dy / distance) * snake.speed;
    }

    // Colisão com jogador
    if (
        player.x < snake.x + snake.width &&
        player.x + player.width > snake.x &&
        player.y < snake.y + snake.height &&
        player.y + player.height > snake.y
    ) {
        if (!player.upgraded) {
            gameState = "gameover";
        } else {
            // Cobra some
            snakeActive = false;
            // Opcional: criar efeito de partículas de água
            drawWaterExplosion(snake.x + snake.width / 2, snake.y + snake.height / 2);
        }
    }
}


function drawGameOver() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "red";
    ctx.font = "50px Arial";
    // ctx.fillText("GAME OVER", 250, 300);
    ctx.fillText("GAME OVER", canvas.width/2 - 150, canvas.height/2);

    // Mostrar botão
    // if (!document.getElementById("restartButton")) {
    //     showRestartButton();
    // }

    const controls = document.getElementById("mobileControls");
    if (controls) controls.style.display = "none";

    showRestartButton();
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
        createBoatWaves();
        updatePlayer();
        updateSnake();
        updateObstacles();
        updateUpgrades();
    }

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
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("RIVER RACE", 280, 250);

    ctx.font = "20px Arial";
    ctx.fillText("Pressione ENTER para começar", 250, 300);
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

    // =========================
    // VELOCIDADE DO RIO
    // =========================
    player.y += riverSpeed * 0.5;

    // Motor empurra para cima
    player.y -= enginePower;

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
        player.boosting = true;

        enginePower += engineAcceleration;
        if (enginePower > maxEnginePower) {
            enginePower = maxEnginePower;
        }

    } else {
        player.boosting = false;

        enginePower -= 0.1; // perde força aos poucos
        if (enginePower < 0) enginePower = 0;
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

    createSideWaves();

    if (player.y > canvas.height) {
        gameState = "gameover";
    }

}

function drawPlayer() {

    const imageToDraw = player.upgraded ? boatUpgradeImage : boatImage;

    ctx.drawImage(
        imageToDraw,
        player.x,
        player.y,
        player.width,
        player.height
    );
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

    // 🎨 Gradiente de água
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

    gradient.addColorStop(0, "#1e90ff");   // azul claro
    gradient.addColorStop(0.5, "#187bcd"); // médio
    gradient.addColorStop(1, "#0f3057");   // fundo escuro

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawWaterReflection();
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
    const waveHeight = 5;      // altura da onda
    const waveLength = 100;     // comprimento da onda
    const waveSpeed = 0.05;     // velocidade de deslocamento
    const waveCount = 20;        // número de ondas no rio

    for (let i = 0; i < waveCount; i++) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + i * 0.05})`; // transparencia suave
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let x = 0; x < canvas.width; x++) {
            let y = canvas.height / 3 + i * 20 + Math.sin((x * 0.05) + (Date.now() * waveSpeed) + i) * waveHeight;
            if (x === 0) ctx.moveTo(x, y);
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


function startGame() {
    gameState = "playing";
    lives = 3;
    snakeActive = false;
    snake.emerging = false;
    snake.x = canvas.width / 2;
    snake.y = canvas.height + 200;

    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    player.velocityX = 0;
    player.velocityY = 0;

    obstacles = [];
    particles = [];
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Reposiciona o barco um pouco abaixo do meio
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height * 0.6; // 👈 60% da altura
}

window.addEventListener("resize", resizeCanvas);






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


// toque geral para iniciar o jogo
canvas.addEventListener("touchstart", (e) => {
    if (gameState === "menu") {
        startGame();
        e.preventDefault(); // evita rolagem da tela
        return;
    }
});



// function createMobileControls() {
//     // Verifica se já existem
//     if (document.getElementById("mobileControls")) return;

//     // Só ativa para telas menores (tablet/celular)
//     if (window.innerWidth > 900) return;

//     const container = document.createElement("div");
//     container.id = "mobileControls";

//     // Estilo do container
//     Object.assign(container.style, {
//         position: "fixed",
//         bottom: "20px",
//         left: "50%",
//         transform: "translateX(-50%)",
//         display: "flex",
//         gap: "10px",
//         zIndex: 1000,
//     });

//     const directions = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
//     directions.forEach(dir => {
//         const btn = document.createElement("button");
//         btn.textContent = dir.replace("Arrow", ""); // só mostra Left, Right, Up, Down
//         btn.style.padding = "20px 25px";
//         btn.style.fontSize = "16px";
//         btn.style.borderRadius = "10px";
//         btn.style.border = "none";
//         btn.style.background = "#1e90ff";
//         btn.style.color = "white";
//         btn.style.touchAction = "none"; // previne scroll do navegador

//         // Eventos de toque
//         btn.addEventListener("touchstart", (e) => {
//             keys[dir] = true;
//             e.preventDefault();
//         });
//         btn.addEventListener("touchend", (e) => {
//             keys[dir] = false;
//             e.preventDefault();
//         });

//         container.appendChild(btn);
//     });

//     document.body.appendChild(container);
// }

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

window.addEventListener("resize", () => {
    const container = document.getElementById("mobileControls");
    if (!container) return;
    if (window.innerWidth > 900) {
        container.style.display = "none";
    } else {
        container.style.display = "flex";
    }
});



// Para soltar a tecla quando tira o dedo
canvas.addEventListener("touchend", (e) => {
    keys["ArrowLeft"] = false;
    keys["ArrowRight"] = false;
    keys["ArrowUp"] = false;
    keys["ArrowDown"] = false;
});


gameLoop();
setInterval(spawnObstacle, 1500);

