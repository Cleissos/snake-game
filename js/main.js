const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let riverWidth = canvas.width * 0.5; // 50% da tela
let riverX = canvas.width / 2 - riverWidth / 2;
let landOffset = 0;

let waveOffset = 0; // Crie essa variável no topo do código

let fireworks = []; // Array para os fogos de artifício
// ----------imagem do açaí para mudança de fase---------------
const acaiImage = new Image();
acaiImage.src = "assets/acai.png";

let score = 0;
let level = 1;
const coinsToNextLevel = 10;
let coins = [];
//----------------------------------------------------------

const terraEsq1 = new Image(); terraEsq1.src = "assets/terra_left1.png";
const terraDir1 = new Image(); terraDir1.src = "assets/terra_right1.png";

// FASE 2
const terraEsq2 = new Image(); terraEsq2.src = "assets/terra_left2.png";
const terraDir2 = new Image(); terraDir2.src = "assets/terra_right2.png";

// FASE 3
const terraEsq3 = new Image(); terraEsq3.src = "assets/terra_left3.png";
const terraDir3 = new Image(); terraDir3.src = "assets/terra_right3.png";

// Variáveis que o jogo vai usar para desenhar (começam com a fase 1)
let currentLandLeft = terraEsq1;
let currentLandRight = terraDir1;

const snakeSprites = {
    down: [],
    up: [],
    left: [],
    right: []
};

let currentDirection = "down";
let currentFrame = 0;
let frameTimer = 0;
let frameInterval = 120; // velocidade da animação (ms)

let riverSpeed = 1.5;
let riverAcceleration = 0.02;
let maxRiverSpeed = 8;

let enginePower = 0;
let maxEnginePower = 6;
let engineAcceleration = 0.2;

//Áudio global do motor do barco
// const engineSound = new Audio("audio/audio1.mp3");
const engineSound = new Audio("audio/audio_barco.mpeg");
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

function startGame(selectedLevel = 1) {
    // 1. Esconde o menu HTML principal e botões extras se existirem
    const menu = document.getElementById("gameMenu");
    if (menu) menu.style.display = "none";
    
    const extraButtons = document.getElementById("menuButtons");
    if (extraButtons) extraButtons.remove();

    const instructions = document.getElementById("instructionsContainer");
    if (instructions) instructions.remove();

    // 2. Define o estado e a dificuldade
    gameState = "playing";
    level = selectedLevel;
    score = 0;
    lives = 3;

    // 3. Configura o cenário inicial baseado na fase
    if (level === 1) {
        currentLandLeft = terraEsq1;
        currentLandRight = terraDir1;
        riverSpeed = 1.5;
    } else if (level === 2) {
        currentLandLeft = terraEsq2;
        currentLandRight = terraDir2;
        riverSpeed = 3.0;
    } else {
        currentLandLeft = terraEsq3;
        currentLandRight = terraDir3;
        riverSpeed = 4.5;
    }

    // 4. Reseta a Física e Posição do Barco
    player.x = canvas.width / 2 - (player.width || 50) / 2;
    player.y = canvas.height * 0.7; // Começa um pouco mais abaixo
    player.velocityX = 0;
    player.velocityY = 0;
    player.angle = 0;
    player.upgraded = false;
    
    // 5. Limpa Inimigos e Itens
    snakeActive = false;
    obstacles = [];
    coins = [];
    upgrades = [];
    particles = [];

    // 6. Áudio e Controles
    if (typeof unlockAudio === "function") unlockAudio();
    
    if (engineSound) {
        engineSound.pause();
        engineSound.currentTime = 0;
    }

    // Atualiza o tamanho e controles para mobile
    resizeCanvas();
    if (typeof updateMobileControls === "function") {
        updateMobileControls();
    }
}


// function startGame(selectedLevel = 1) {
//     // Esconde o menu HTML
//     const menu = document.getElementById("gameMenu");
//     if (menu) menu.style.display = "none";

//     // REMOVE A TELA DE INSTRUÇÕES (se houver)
//     const instructions = document.getElementById("instructionsContainer");
//     if (instructions) instructions.remove();

//     // 2. Define o estado e a fase escolhida
//     gameState = "playing";
//     level = selectedLevel;
//     score = 0;
//     lives = 3;
//     // Configura o cenário inicial baseado na fase escolhida
//     if (level === 1) {
//         currentLandLeft = terraEsq1;
//         currentLandRight = terraDir1;
//         riverSpeed = 1.5;
//     } else if (level === 2) {
//         currentLandLeft = terraEsq2;
//         currentLandRight = terraDir2;
//         riverSpeed = 3.0;
//     } else {
//         currentLandLeft = terraEsq3;
//         currentLandRight = terraDir3;
//         riverSpeed = 4.5;
//     }
//     // 4. Reseta a Física e Posição do Barco (A parte antiga importante)
//     player.x = canvas.width / 2 - player.width / 2;
//     player.y = canvas.height * 0.6;
//     player.velocityX = 0;
//     player.velocityY = 0;
//     player.angle = 0;
//     player.upgraded = false;
//     player.width = player.baseWidth;
//     player.height = player.baseHeight;

//     // 5. Reseta a Cobra e Inimigos
//     snakeActive = false;
//     snake.emerging = false;
//     snake.x = canvas.width / 2;
//     snake.y = canvas.height + 200;

//     // Limpa o jogo para começar do zero
//     obstacles = [];
//     coins = [];
//     upgrades = [];
//     particles = [];

//     // 6. Áudio e Controles
//     unlockAudio();
//     enginePower = 0;
//     engineSound.pause();
//     engineSound.currentTime = 0;

//     resizeCanvas();
//     if (typeof createMobileControls === "function") {
//         createMobileControls();
//         updateMobileControls();
//     }
// }

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
    // 1. Remover botão de restart
    const button = document.getElementById("restartButton");
    if (button) button.remove();

    // 2. Resetar Estado do Jogo
    gameState = "playing";
    level = 1;      // Volta para a fase 1
    score = 0;      // Zera o açaí
    lives = 3;      // Restaura as vidas
    riverSpeed = 1.5; // Reseta a velocidade do rio para o padrão da fase 1

    // --- NOVO: Resetar o cenário para a Fase 1 ---
    currentLandLeft = terraEsq1;
    currentLandRight = terraDir1;

    // 3. Resetar FÍSICA do Jogador (Onde está o bug)
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height * 0.6;
    player.velocityX = 0;
    player.velocityY = 0;
    player.angle = 0;
    player.targetAngle = 0;

    // IMPORTANTE: Resetar o motor e o upgrade
    enginePower = 0;
    maxEnginePower = 6; // Volta o motor ao normal
    player.upgraded = false;
    player.width = player.baseWidth;
    player.height = player.baseHeight;

    // 4. Limpar Inimigos e Itens
    snakeActive = false;
    snake.emerging = false;
    snake.x = canvas.width / 2;
    snake.y = canvas.height + 200;

    obstacles = [];
    coins = [];
    upgrades = [];
    particles = [];

    // 5. Parar o som
    engineSound.pause();
    engineSound.currentTime = 0;

    // 6. Reexibir controles se for mobile
    const controls = document.getElementById("mobileControls");
    if (controls && window.innerWidth <= 900) {
        controls.style.display = "grid";
    }
    showMainMenu();
}
// No seu restartGame, certifique-se de mostrar o menu de volta se quiser:
function showMainMenu() {
    gameState = "menu";
    document.getElementById("gameMenu").style.display = "flex";
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

        // --- NOVA LÓGICA DE DIREÇÃO SUAVE ---
        // Calcula o ângulo real para o jogador
        let targetAngle = Math.atan2(dy, dx);

        // Converte o ângulo em uma das 4 direções de sprite
        // Isso evita que ela mude de frame por qualquer grauzinho
        let angleDeg = targetAngle * (180 / Math.PI);

        if (angleDeg > -45 && angleDeg <= 45) {
            currentDirection = "right";
        } else if (angleDeg > 45 && angleDeg <= 135) {
            currentDirection = "down";
        } else if (angleDeg > -135 && angleDeg <= -45) {
            currentDirection = "up";
        } else {
            currentDirection = "left";
        }
    }

    // ========================
    // ANIMAÇÃO
    // ========================
    frameTimer += deltaTime;

    if (frameTimer > frameInterval) {
        frameTimer = 0;
        currentFrame = (currentFrame + 1) % TOTAL_FRAMES;
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

}
const TOTAL_FRAMES = 47;

function loadSnakeFrames() {
    const directions = ['down', 'up', 'left', 'right'];
    directions.forEach(dir => {
        for (let i = 0; i < TOTAL_FRAMES; i++) {
            const img = new Image();
            // O segredo aqui é não travar o jogo esperando carregar
            img.src = `snake_${dir}/frame_${i}.png`;
            snakeSprites[dir].push(img);
        }
    });
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
        waveOffset += 0.05; // Faz as ondas "pularem"

        // Só cria ondas se o barco tiver alguma velocidade (funciona para os dois)
        if (Math.abs(player.velocityX) > 0.1 || Math.abs(player.velocityY) > 0.1) {
            createBoatWaves();
        }

        createBoatWaves();
        updateParticles();
        updatePlayer();
        updateSnake(deltaTime);
        updateObstacles();
        updateUpgrades();
        updateCoins();
        
    }
    if (gameState === "win") {
            updateFireworks();
            if (Math.random() < 0.05) createFirework();
        }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        
        // Faz a partícula subir ou se espalhar um pouco (opcional)
        p.y += riverSpeed * 0.8; 
        
        // Se a partícula não tiver decay (por ser antiga), define um padrão
        let decayRate = p.decay || 0.02;
        p.alpha -= decayRate; // Ajuste este valor para o rastro sumir mais rápido ou devagar

        // Se a partícula sumiu, remove do array para não pesar o jogo
        if (p.alpha <= 0 || p.y > canvas.height) {
            particles.splice(i, 1);
        }
    }
}

function spawnObstacle() {
    const x = riverX + Math.random() * (riverWidth - 50);
    // Adicionei 'speed' aqui
    obstacles.push({ 
        x: x, 
        y: -50, 
        width: 50, 
        height: 50, 
        speed: riverSpeed + 1, // Ele desce um pouco mais rápido que o rio
        image: obstacleImage 
    });
}

let upgrades = [];

function spawnUpgrade() { // As estrelas
    const x = riverX + Math.random() * (riverWidth - 30);
    // Adicionei 'speed' aqui
    upgrades.push({ 
        x: x, 
        y: -30, 
        width: 30, 
        height: 30, 
        speed: riverSpeed,
        image: upgradeImage 
    });
}

setInterval(() => {
    if (gameState === "playing") spawnUpgrade();
}, 10000); // Uma estrela a cada 10 segundos
//-----------------------------------------
function spawnCoin() { // Açaí
    const x = riverX + Math.random() * (riverWidth - 25);
    // Adicionei 'speed' aqui
    coins.push({ 
        x: x, 
        y: -25, 
        width: 25, 
        height: 25, 
        speed: riverSpeed 
    });
}
// Chame isso no seu setInterval ou dentro do update
function updateCoins() {
    // Verificação de segurança: se o array não existe, sai da função
    if (!coins || coins.length === 0) return;

    for (let i = coins.length - 1; i >= 0; i--) {
        let c = coins[i];
        c.y += c.speed;
        // Verifica se 'c' realmente existe antes de acessar o 'y'
        if (!c) continue;
        // Colisão com o jogador
        if (
            player.x < c.x + c.width &&
            player.x + player.width > c.x &&
            player.y < c.y + c.height &&
            player.y + player.height > c.y
        ) {
            coins.splice(i, 1);
            score++;
            checkLevelUp(); // Verifica se passou de fase
            return; // IMPORTANTE: Sai da função após subir de nível para evitar ler o próximo item do array vazio
        }
        // Remove se sair da tela
        else if (c && c.y > canvas.height) {
            coins.splice(i, 1);
        }
    }
}
setInterval(() => {
    if (gameState === "playing") spawnCoin();
}, 1500); // Um açaí a cada 1.5 segundos

// Cria um obstáculo (vitória-régia/tronco) a cada 1.5 segundos
setInterval(() => {
    if (gameState === "playing") {
        spawnObstacle();
    }
}, 2000);
//---------------------------------------
function checkLevelUp() {
    if (score >= coinsToNextLevel) {
        if (level < 3) {
            alert("Nível " + level + "!");
            keys = {}; // <--- ADICIONE ISSO AQUI
            player.velocityX = 0; // Para o barco não "voar" com o embalo da fase anterior
            player.velocityY = 0;
            level++;
            score = 0; // Reseta o score para a nova fase ou mantém acumulado
            riverSpeed += 1.5; // Aumenta a dificuldade

            // Lógica de troca manual
            if (level === 2) {
                currentLandLeft = terraEsq2;
                currentLandRight = terraDir2;
            } else if (level === 3) {
                currentLandLeft = terraEsq3;
                currentLandRight = terraDir3;
            }
            obstacles.length = 0;
            coins.length = 0;
            keys = {}; // Reseta teclas para não bugar
        } else {
            // VITÓRIA TOTAL
            gameState = "win"; // Você pode criar uma tela de vitória
            engineSound.pause();
            showWinScreen();
        }
    }
}
//--------------------------------------------------------
function showWinScreen() {
    // Evita duplicados
    if (document.getElementById("winContainer")) return;
    const container = document.createElement("div");
    container.id = "winContainer";
    Object.assign(container.style, {
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center", backgroundColor: "rgba(0,0,0,0.8)",
        padding: "30px", borderRadius: "20px", color: "white", zIndex: "2000",
        fontFamily: "Arial"
    });
    container.innerHTML = `
        <h1>🏆 VOCÊ VENCEU! 🏆</h1>
        <p>Parabéns! Você escapou do rio.</p>
        <input type="text" id="playerName" placeholder="Seu Nome" style="padding:10px; border-radius:5px; border:none;"><br><br>
        <button id="saveScore" style="padding:10px 20px; cursor:pointer; background:#2ecc71; color:white; border:none; border-radius:5px;">Salvar no Ranking</button>
        <button id="restartWin" style="padding:10px 20px; cursor:pointer; background:#3498db; color:white; border:none; border-radius:5px; margin-left:10px;">Jogar Denovo</button>
    `;

    document.body.appendChild(container);
    // mude a lógica do botão saveScore para:

    document.getElementById("saveScore").onclick = () => {
        const nameInput = document.getElementById("playerName");
        const name = nameInput.value.trim() || "Anônimo";

        saveToRanking(name); // Salva no localStorage

        // Pequeno efeito visual antes de abrir o ranking
        nameInput.disabled = true;
        document.getElementById("saveScore").innerText = "Salvo!";

        setTimeout(() => {
            showRankingScreen(); // Abre a telinha de Ranking que criamos acima
        }, 1000);
    };

    // Botão Reiniciar
    document.getElementById("restartWin").onclick = () => {
        container.remove();
        restartGame();
    };
}
//-----------------Exibir ranking---------------------------
function showRankingScreen() {
    // Remove qualquer tela de vitória ou ranking que já esteja aberta
    const oldWin = document.getElementById("winContainer");
    if (oldWin) oldWin.remove();

    const oldRank = document.getElementById("rankingContainer");
    if (oldRank) oldRank.remove();

    const container = document.createElement("div");
    container.id = "rankingContainer";
    Object.assign(container.style, {
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "rgba(20, 30, 48, 0.95)",
        padding: "30px", borderRadius: "15px", color: "white",
        zIndex: "3000", fontFamily: "Arial", textAlign: "center",
        boxShadow: "0 0 20px rgba(0,0,0,0.5)", minWidth: "300px"
    });

    // Pega os dados do localStorage e ordena (se você tivesse pontuação, ordenaria por ela)
    let ranking = JSON.parse(localStorage.getItem("riverRanking") || "[]");

    let tableHTML = `
        <h2 style="color: #f1c40f;">🏆 TOP ESCAPISTAS 🏆</h2>
        <table style="width: 100%; margin-top: 10px; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 2px solid #555;">
                    <th style="padding: 10px;">Nome</th>
                    <th style="padding: 10px;">Data</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (ranking.length === 0) {
        tableHTML += `<tr><td colspan="2" style="padding: 20px;">Nenhum recorde ainda!</td></tr>`;
    } else {
        // Mostra os últimos 10 que venceram
        ranking.slice(-10).reverse().forEach(item => {
            tableHTML += `
                <tr style="border-bottom: 1px solid #333;">
                    <td style="padding: 10px;">${item.name}</td>
                    <td style="padding: 10px;">${item.date}</td>
                </tr>
            `;
        });
    }

    tableHTML += `
            </tbody>
        </table>
        <br>
        <button id="closeRanking" style="padding: 10px 20px; cursor:pointer; background:#e74c3c; color:white; border:none; border-radius:5px;">Fechar</button>
    `;

    container.innerHTML = tableHTML;
    document.body.appendChild(container);

    document.getElementById("closeRanking").onclick = () => {
        container.remove();
        if (gameState === "win") restartGame(); // Se fechar após vencer, reinicia o jogo
    };
}

//-----------------------------fim exibir ranking----------------------
function saveToRanking(name) {
    let ranking = JSON.parse(localStorage.getItem("riverRanking") || "[]");
    ranking.push({ name: name, date: new Date().toLocaleDateString() });
    localStorage.setItem("riverRanking", JSON.stringify(ranking));
}

function createFirework() {
    if (gameState !== "win") return;
    const x = Math.random() * canvas.width;
    const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    for (let i = 0; i < 30; i++) {
        fireworks.push({
            x: x, y: canvas.height,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() * -10) - 5,
            alpha: 1, color: color
        });
    }
}

function updateFireworks() {
    fireworks.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // gravidade
        p.alpha -= 0.01;
        if (p.alpha <= 0) fireworks.splice(i, 1);
    });
}

function drawFireworks() {
    fireworks.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}
//------------------------------------------------------
// function drawUI() {
//     ctx.fillStyle = "white";
//     ctx.font = "bold 24px Arial";
//     ctx.textAlign = "right";

//     // Desenha no canto superior direito com um pouco de margem
//     ctx.fillText("Score: " + score + " / " + coinsToNextLevel, canvas.width - 20, 40);
//     ctx.fillText("Fase: " + level, canvas.width - 20, 70);

//     // Ícone do Açaí ao lado do texto
//     if (acaiImage.complete) {
//         ctx.drawImage(acaiImage, canvas.width - 185, 18, 25, 25);
//     }
// }
function drawUI() {
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "right";

    // Texto do Score e Fase
    ctx.fillText("Score: " + score + " / " + coinsToNextLevel, canvas.width - 20, 40);
    ctx.fillText("Fase: " + level, canvas.width - 20, 75);

    // Desenha as vidas (Corações) no canto superior esquerdo
    if (typeof drawLives === "function") {
        drawLives();
    }

    // Ícone do Açaí (Ajustado para ficar alinhado ao texto)
    if (acaiImage && acaiImage.complete) {
        // O valor -180 pode variar dependendo do tamanho da sua fonte
        ctx.drawImage(acaiImage, canvas.width - 210, 18, 28, 28);
    }
}
//------------------------------------------------------
// --- FUNÇÕES DE SUPORTE AO DESENHO ---

function drawLand() {
    if (currentLandLeft && currentLandLeft.complete) {
        ctx.drawImage(currentLandLeft, 0, 0, riverX, canvas.height);
    }
    if (currentLandRight && currentLandRight.complete) {
        ctx.drawImage(currentLandRight, riverX + riverWidth, 0, canvas.width - (riverX + riverWidth), canvas.height);
    }
}

function drawRiver() {
    ctx.fillStyle = "#1e90ff";
    ctx.fillRect(riverX, 0, riverWidth, canvas.height);

    // Ondas/Espuma nas bordas (O efeito de "bater na praia")
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let i = 0; i < canvas.height; i += 20) {
        let wave = Math.sin(waveOffset + i * 0.05) * 7;
        
        // Espuma esquerda
        ctx.beginPath();
        ctx.arc(riverX + wave, i, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Espuma direita
        ctx.beginPath();
        ctx.arc(riverX + riverWidth + wave, i, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Agrupa o desenho dos itens para organizar o draw()
function drawItems() {
    // Desenha o Açaí
    coins.forEach(c => {
        if (acaiImage.complete) ctx.drawImage(acaiImage, c.x, c.y, c.width, c.height);
    });

    // Desenha as Estrelas (Upgrades)
    upgrades.forEach(up => {
        if (upgradeImage.complete) ctx.drawImage(upgradeImage, up.x, up.y, up.width, up.height);
    });

    // Desenha os Obstáculos
    obstacles.forEach(obs => {
        if (obstacleImage.complete) ctx.drawImage(obstacleImage, obs.x, obs.y, obs.width, obs.height);
    });
}
// Efeito de Maresia Realista (Vento soprando sobre o rio)
function drawWindMist() {
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "white";
    for(let i = 0; i < 3; i++) {
        let yMist = (Date.now() * 0.05 + i * 300) % canvas.height;
        ctx.fillRect(riverX, yMist, riverWidth, 20);
    }
    ctx.restore();
}

function drawWaterTrail() {
    // Se você usa o sistema de partículas para o rastro do barco:
    particles.forEach((p, index) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.angle);
    
    // Escolhe a imagem (normal ou upgrade)
    let img = player.upgraded ? boatUpgradeImage : boatImage;
    
    if (img.complete) {
        ctx.drawImage(img, -player.width / 2, -player.height / 2, player.width, player.height);
    } else {
        // Fallback caso a imagem falhe
        ctx.fillStyle = player.upgraded ? "gold" : "orange";
        ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    }
    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "playing" || gameState === "paused" || gameState === "win") {
        
        // 1. Camada de Fundo (Terra/Margens)
        drawLand(); 

        // 2. O Rio e as Ondas (Área azul e espuma)
        drawRiver(); 

        // 3. Itens e Inimigos
        drawItems(); // Nova função que agrupa Açaí, Estrelas e Obstáculos
        if (snakeActive) drawSnake();

        // 4. O Jogador e seu rastro
        drawWaterTrail();
        drawPlayer();

        // 5. Efeitos de Clima (Vento/Maresia)
        drawWindMist(); 

        // 6. Interface
        drawUI();
        drawLives();

        // 7. Fogos de Artifício (Só aparecem se vencer)
        if (gameState === "win") {
            drawFireworks();
        }

    } else if (gameState === "menu") {
        drawMenu();
    } else if (gameState === "gameover") {
        drawGameOver();
    }
}


// function drawMenu() {
//     ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
//     ctx.fillRect(0, 0, canvas.width, canvas.height);

//     ctx.fillStyle = "white";
//     ctx.font = "bold 30px Arial"; // Fonte um pouco menor para caber no celular
//     ctx.textAlign = "center";
//     ctx.fillText("RIVER ESCAPE", canvas.width / 2, canvas.height / 2 - 80);

//     //No mobile, criamos botões HTML se eles não existirem
//     if (window.innerWidth <= 900 && !document.getElementById("menuButtons")) {
//         const menuDiv = document.createElement("div");
//         menuDiv.id = "menuButtons";
//         Object.assign(menuDiv.style, {
//             position: "fixed", top: "60%", left: "50%",
//             transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", gap: "10px"
//         });
//         menuDiv.innerHTML = `
//             <button onclick="startGame()" style="padding:15px 30px; font-size:18px; background:#2ecc71; color:white; border:none; border-radius:10px;">INICIAR JOGO</button>
//             <button onclick="showRankingScreen()" style="padding:15px 30px; font-size:18px; background:#f1c40f; color:white; border:none; border-radius:10px;">RANKING</button>
//         `;
//         document.body.appendChild(menuDiv);
//     }
// }

function drawMenu() {
    // Escurece o fundo do canvas
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Garante que o menu HTML esteja visível
    const menu = document.getElementById("gameMenu");
    if (menu && gameState === "menu") {
        menu.style.display = "flex";
    }
}

function drawWindEffects() {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"; // Riscos de vento quase invisíveis
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        let x = (Math.random() * canvas.width);
        let y = (Math.random() * canvas.height);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 100, y + 20); // Vento soprando inclinado
        ctx.stroke();
    }
}

function drawGameOver() {
    // Para o som do motor imediatamente ao morrer
    engineSound.pause();
    engineSound.currentTime = 0;

    // Fundo preto sólido
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Texto de Game Over
    ctx.fillStyle = "red";
    ctx.font = "bold 50px Arial";
    ctx.textAlign = "center"; // Isso facilita centralizar sem precisar fazer contas de subtração
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

    // Esconde os botões do celular para não atrapalhar o botão de restart
    const controls = document.getElementById("mobileControls");
    if (controls) controls.style.display = "none";

    // Mostra o botão para recomeçar
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
// =============================
// PLAYER
// =============================
function updatePlayer() {
    if (gameState !== "playing") return;
    updateMobileControls();

    // =========================
    // VELOCIDADE DO RIO
    // =========================
    player.y += riverSpeed * 0.5;

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

function drawFoam(edgeX, side) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    for (let i = 0; i < canvas.height; i += 15) {
        // Seno composto para dar impressão de água batendo irregularmente
        let wave = Math.sin(waveOffset + i * 0.05) * 8;
        let xPos = (side === "left") ? edgeX + wave : edgeX - 5 + wave;
        
        ctx.beginPath();
        ctx.arc(xPos, i, 3 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
    }
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
        // Partículas do motor (atrás)
        particles.push({
            x: player.x + Math.random() * player.width,
            y: player.y + player.height - 5,
            size: Math.random() * waveSize + 1,
            speedY: Math.random() * 1 + 0.5,
            alpha: 0.5,
            decay: 0.01 + Math.random() * 0.02 // Novo: cada partícula some em um tempo diferente
        });

        // Partículas laterais
        particles.push({
            x: player.x - spread + Math.random() * (player.width + spread * 2),
            y: player.y + player.height / 2,
            size: Math.random() * waveSize,
            speedY: Math.random() * 0.5,
            alpha: 0.4,
            decay: 0.005 + Math.random() * 0.01 // Novo: laterais duram um pouco mais
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

// =============================
// TECLADO
// =============================
document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (gameState === "menu" && e.key.toLowerCase() === "r") {
        showRankingScreen();
    }

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

    if (!isMobile || gameState === "playing") {
        controls.style.display = "grid";
    }else {
        controls.style.display = "none";
    }

    // controls.style.display = "grid"; // ⚠️ IMPORTANTE: grid, não flex
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

