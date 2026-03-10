(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayMessage = document.getElementById('overlayMessage');
  const startBtn = document.getElementById('startBtn');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('highScore');
  const levelEl = document.getElementById('level');
  const topScoresList = document.getElementById('topScores');
  const playerNameInput = document.getElementById('playerName');

  const CELL = 20;
  const BASE_SPEED = 140;  // ms per snake move (higher = slower)
const SPEED_PER_POINT = 0.6;  // less aggressive speed-up (was 2)
const MIN_TICK_MS = 90;  // minimum ms per move (was 60, now slightly slower cap)
  const MOHAWK_SPIKES = 5;
  const MOHAWK_COLOR = '#e63946';
  const HEAD_COLOR = '#2a9d8f';
  const BODY_COLOR = '#264653';
  const FOOD_COLOR = '#f4a261';

  // 5 levels: minScore, grid size, food count
  const LEVELS = [
    { minScore: 0, w: 640, h: 480, foodCount: 1 },
    { minScore: 150, w: 960, h: 720, foodCount: 2 },
    { minScore: 300, w: 960, h: 720, foodCount: 3 },
    { minScore: 450, w: 960, h: 720, foodCount: 4 },
    { minScore: 600, w: 960, h: 720, foodCount: 5 },
  ];

  const LEVEL1_BG = 'bgs/images.jpeg';
  const LEVEL2_BGS = [
    'bgs/level2/40543072_001_3116.jpg',
    'bgs/level2/40543072_009_565d.jpg',
    'bgs/level2/43196569_046_e3d3.jpg',
    'bgs/level2/90025385_189_e128.jpg',
    'bgs/level2/90025385_094_2234.jpg',
    'bgs/level2/10960988_086_9a29.jpg',
  ];

  const ARROW_KEYS = {
    ArrowUp: { dx: 0, dy: -1 },
    ArrowDown: { dx: 0, dy: 1 },
    ArrowLeft: { dx: -1, dy: 0 },
    ArrowRight: { dx: 1, dy: 0 },
  };

  let mouse = { x: 0, y: 0 };
  let snake = [];
  let foods = [];
  let direction = { dx: 1, dy: 0 };
  let nextDirection = { dx: 1, dy: 0 };
  let useKeyboard = false;
  let score = 0;
  let highScore = 0;
  let level = 1;
  let gameLoopId = null;
  let lastTick = 0;
  let running = false;
  let COLS = Math.floor(LEVELS[0].w / CELL);
  let ROWS = Math.floor(LEVELS[0].h / CELL);

  let bgImageLevel1 = null;
  let bgImagesLevel2 = [];
  let currentLevel2Bg = null;
  let currentLevel2BgImage = null;

  // Game mode: 'snake' | 'invaders' (level 3)
  let gameMode = 'snake';
  const INVADER_COLS = 11;
  const INVADER_ROWS = 5;
  const INVADER_W = 36;
  const INVADER_H = 24;
  const INVADER_GAP = 8;
  const PLAYER_W = 48;
  const PLAYER_H = 24;
  const PLAYER_Y_OFFSET = 60;
  const BULLET_SPEED = 14;
  const INVADER_SPEED = 2;
  const INVADER_DROP = 20;
  const INVADER_POINTS = 10;
  const INVADER_TICK_MS = 90;
  let playerX = 0;
  let bullets = [];
  let invaders = [];
  let invaderDir = 1;
  let invaderLastTick = 0;
  let invaderMinX = 0;
  let invaderMaxX = 0;
  const CHEAT_CODE = 'idkfa';
  let cheatBuffer = '';

  function loadImages(cb) {
    const img1 = new Image();
    img1.onload = function () {
      bgImageLevel1 = img1;
      let loaded = 0;
      if (LEVEL2_BGS.length === 0) return cb();
      LEVEL2_BGS.forEach((src) => {
        const img = new Image();
        img.onload = function () {
          bgImagesLevel2.push({ src, img });
          loaded++;
          if (loaded === LEVEL2_BGS.length) cb();
        };
        img.onerror = function () {
          loaded++;
          if (loaded === LEVEL2_BGS.length) cb();
        };
        img.src = src;
      });
    };
    img1.onerror = function () {
      cb();
    };
    img1.src = LEVEL1_BG;
  }

  function getMouseCell() {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (mouse.x - rect.left) * scaleX;
    const y = (mouse.y - rect.top) * scaleY;
    return {
      col: Math.floor(x / CELL),
      row: Math.floor(y / CELL),
    };
  }

  function setDirectionFromKeys(keyDir) {
    if (!keyDir) return;
    const head = snake[0];
    if (!head) return;
    if (snake.length > 1) {
      const neck = snake[1];
      if (keyDir.dx === neck.x - head.x && keyDir.dy === neck.y - head.y) return;
    }
    nextDirection = keyDir;
    direction = keyDir;
  }

  function updateDirectionFromMouse() {
    const head = snake[0];
    if (!head) return;
    const cell = getMouseCell();
    const targetX = cell.col * CELL + CELL / 2;
    const targetY = cell.row * CELL + CELL / 2;
    const headCenterX = head.x * CELL + CELL / 2;
    const headCenterY = head.y * CELL + CELL / 2;
    const dx = targetX - headCenterX;
    const dy = targetY - headCenterY;
    const len = Math.hypot(dx, dy);
    if (len < 2) return;
    const ndx = dx / len;
    const ndy = dy / len;
    const angle = Math.atan2(ndy, ndx);
    const snap = Math.PI / 2;
    const snapped = Math.round(angle / snap) * snap;
    nextDirection = {
      dx: Math.round(Math.cos(snapped)),
      dy: Math.round(Math.sin(snapped)),
    };
    if (nextDirection.dx === 0 && nextDirection.dy === 0) return;
    if (snake.length > 1) {
      const neck = snake[1];
      if (nextDirection.dx === neck.x - head.x && nextDirection.dy === neck.y - head.y)
        return;
    }
    direction = nextDirection;
  }

  function initSnake() {
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);
    snake = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ];
    direction = { dx: 1, dy: 0 };
    nextDirection = { dx: 1, dy: 0 };
  }

  function getFreeCells() {
    const set = new Set(snake.map(s => `${s.x},${s.y}`));
    foods.forEach((f) => set.add(`${f.x},${f.y}`));
    const free = [];
    for (let x = 0; x < COLS; x++)
      for (let y = 0; y < ROWS; y++)
        if (!set.has(`${x},${y}`)) free.push({ x, y });
    return free;
  }

  function placeOneFood() {
    const free = getFreeCells();
    if (free.length === 0) return;
    const f = free[Math.floor(Math.random() * free.length)];
    foods.push({ x: f.x, y: f.y });
  }

  function getLevelConfig(levelNum) {
    return LEVELS[Math.min(levelNum - 1, LEVELS.length - 1)] || LEVELS[0];
  }

  function placeFoods() {
    const cfg = getLevelConfig(level);
    const want = cfg.foodCount;
    foods = [];
    for (let i = 0; i < want; i++) placeOneFood();
  }

  function pickRandomLevel2Bg() {
    if (bgImagesLevel2.length === 0) return;
    const idx = Math.floor(Math.random() * bgImagesLevel2.length);
    currentLevel2Bg = bgImagesLevel2[idx];
    currentLevel2BgImage = currentLevel2Bg ? currentLevel2Bg.img : null;
  }

  function drawImageCover(img) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
  }

  function drawBackground() {
    if (level === 1 && bgImageLevel1) {
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawImageCover(bgImageLevel1);
      return;
    }
    if (level >= 2 && currentLevel2BgImage) {
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawImageCover(currentLevel2BgImage);
      return;
    }
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawMohawk(head, dir) {
    const cx = head.x * CELL + CELL / 2;
    const cy = head.y * CELL + CELL / 2;
    const angle = Math.atan2(dir.dy, dir.dx);
    const perp = angle + Math.PI / 2;
    const baseY = cy - (CELL / 2) * Math.sign(Math.cos(perp));
    const baseX = cx - (CELL / 2) * Math.sign(Math.sin(perp));
    const forward = { x: Math.cos(angle), y: Math.sin(angle) };
    const spikeH = CELL * 0.7;
    const spikeW = CELL * 0.25;

    ctx.fillStyle = MOHAWK_COLOR;
    ctx.strokeStyle = '#c1121f';
    ctx.lineWidth = 1;

    for (let i = 0; i < MOHAWK_SPIKES; i++) {
      const t = (i / (MOHAWK_SPIKES - 1)) * 2 - 1;
      const px = baseX + t * (CELL * 0.5);
      const py = baseY + t * (CELL * 0.1);
      const tipX = px + forward.x * spikeH;
      const tipY = py + forward.y * spikeH;
      const leftX = px - forward.y * spikeW;
      const leftY = py + forward.x * spikeW;
      const rightX = px + forward.y * spikeW;
      const rightY = py - forward.x * spikeW;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  function drawSnake() {
    snake.forEach((seg, i) => {
      const isHead = i === 0;
      const x = seg.x * CELL;
      const y = seg.y * CELL;
      ctx.fillStyle = isHead ? HEAD_COLOR : BODY_COLOR;
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
      if (isHead) {
        drawMohawk(seg, direction);
      }
    });
  }

  function drawFoods() {
    foods.forEach((food) => {
      const x = food.x * CELL + CELL / 2;
      const y = food.y * CELL + CELL / 2;
      ctx.fillStyle = FOOD_COLOR;
      ctx.beginPath();
      ctx.arc(x, y, CELL / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e76f51';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  function getLevelFromScore(s) {
    let lvl = 1;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (s >= LEVELS[i].minScore) {
        lvl = i + 1;
        break;
      }
    }
    return lvl;
  }

  function initInvaders() {
    playerX = (canvas.width - PLAYER_W) / 2;
    bullets = [];
    invaders = [];
    invaderDir = 1;
    invaderLastTick = 0;
    const startX = (canvas.width - (INVADER_COLS * (INVADER_W + INVADER_GAP) - INVADER_GAP)) / 2;
    const startY = 80;
    for (let row = 0; row < INVADER_ROWS; row++) {
      for (let col = 0; col < INVADER_COLS; col++) {
        invaders.push({
          x: startX + col * (INVADER_W + INVADER_GAP),
          y: startY + row * (INVADER_H + INVADER_GAP),
          alive: true,
        });
      }
    }
  }

  function getInvaderBounds() {
    let minX = 1e9, maxX = -1e9;
    invaders.forEach((inv) => {
      if (!inv.alive) return;
      minX = Math.min(minX, inv.x);
      maxX = Math.max(maxX, inv.x + INVADER_W);
    });
    return { minX, maxX };
  }

  function tickInvaders(now) {
    const elapsed = now - invaderLastTick;
    if (elapsed >= INVADER_TICK_MS) {
      invaderLastTick = now;
      const { minX, maxX } = getInvaderBounds();
      if (minX <= 0 || maxX >= canvas.width) {
        invaderDir *= -1;
        invaders.forEach((inv) => {
          if (inv.alive) inv.y += INVADER_DROP;
        });
      } else {
        invaders.forEach((inv) => {
          if (inv.alive) inv.x += INVADER_SPEED * invaderDir;
        });
      }
    }
    bullets.forEach((b) => (b.y -= BULLET_SPEED));
    bullets = bullets.filter((b) => b.y > 0);
    bullets.forEach((bullet) => {
      invaders.forEach((inv) => {
        if (!inv.alive) return;
        if (bullet.x >= inv.x && bullet.x <= inv.x + INVADER_W &&
            bullet.y >= inv.y && bullet.y <= inv.y + INVADER_H) {
          inv.alive = false;
          bullet.dead = true;
          score += INVADER_POINTS;
          scoreEl.textContent = score;
          if (score > highScore) {
            highScore = score;
            highScoreEl.textContent = highScore;
          }
        }
      });
    });
    bullets = bullets.filter((b) => !b.dead);
    const aliveCount = invaders.filter((inv) => inv.alive).length;
    if (aliveCount === 0) {
      initInvaders();
      return;
    }
    const playerY = canvas.height - PLAYER_Y_OFFSET;
    invaders.forEach((inv) => {
      if (!inv.alive) return;
      if (inv.y + INVADER_H >= playerY &&
          inv.x + INVADER_W >= playerX && inv.x <= playerX + PLAYER_W) {
        gameOver();
      }
      if (inv.y + INVADER_H >= canvas.height) gameOver();
    });
  }

  function drawInvaders() {
    const playerY = canvas.height - PLAYER_Y_OFFSET;
    ctx.fillStyle = '#2a9d8f';
    ctx.fillRect(playerX, playerY, PLAYER_W, PLAYER_H);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(playerX + PLAYER_W / 2 - 4, playerY - 8, 8, 8);
    bullets.forEach((b) => {
      ctx.fillStyle = '#f4a261';
      ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
    });
    invaders.forEach((inv) => {
      if (!inv.alive) return;
      ctx.fillStyle = '#9b59b6';
      ctx.fillRect(inv.x, inv.y, INVADER_W, INVADER_H);
      ctx.strokeStyle = '#7d3c98';
      ctx.lineWidth = 2;
      ctx.strokeRect(inv.x, inv.y, INVADER_W, INVADER_H);
    });
  }

  function switchToLevel(newLevel) {
    level = newLevel;
    if (levelEl) levelEl.textContent = String(level);
    const cfg = getLevelConfig(level);
    canvas.width = cfg.w;
    canvas.height = cfg.h;
    COLS = Math.floor(cfg.w / CELL);
    ROWS = Math.floor(cfg.h / CELL);
    if (level === 3) {
      gameMode = 'invaders';
      initInvaders();
      if (level >= 2) pickRandomLevel2Bg();
    } else {
      gameMode = 'snake';
      initSnake();
      placeFoods();
      if (level >= 2) pickRandomLevel2Bg();
    }
  }

  function tick(now) {
    if (!running) return;
    if (gameMode === 'invaders') {
      tickInvaders(now);
      draw();
      gameLoopId = requestAnimationFrame(tick);
      return;
    }
    if (!lastTick) lastTick = now;
    const elapsed = now - lastTick;
    const speed = Math.max(MIN_TICK_MS, BASE_SPEED - score * SPEED_PER_POINT);
    if (elapsed < speed) {
      gameLoopId = requestAnimationFrame(tick);
      return;
    }
    lastTick = now;

    if (useKeyboard) {
      setDirectionFromKeys(nextDirection);
    } else {
      updateDirectionFromMouse();
    }
    const head = snake[0];
    const nx = (head.x + direction.dx + COLS) % COLS;
    const ny = (head.y + direction.dy + ROWS) % ROWS;

    if (snake.some(s => s.x === nx && s.y === ny)) {
      gameOver();
      return;
    }

    snake.unshift({ x: nx, y: ny });
    const eatenIdx = foods.findIndex((f) => f.x === nx && f.y === ny);
    if (eatenIdx !== -1) {
      score += 10;
      scoreEl.textContent = score;
      if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
      }
      const newLevel = getLevelFromScore(score);
      if (newLevel > level) {
        switchToLevel(newLevel);
      } else if (level >= 2) {
        pickRandomLevel2Bg();
        foods.splice(eatenIdx, 1);
        placeOneFood();
      } else {
        foods = [];
        placeFoods();
      }
    } else {
      snake.pop();
    }

    draw();
    gameLoopId = requestAnimationFrame(tick);
  }

  function draw() {
    drawBackground();
    if (gameMode === 'invaders') {
      drawInvaders();
    } else {
      drawFoods();
      drawSnake();
    }
  }

  function showOverlay(title, message, showButton) {
    overlayTitle.textContent = title;
    overlayMessage.textContent = message;
    startBtn.style.display = showButton ? 'block' : 'none';
    overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function gameOver() {
    running = false;
    if (gameLoopId != null) cancelAnimationFrame(gameLoopId);
    const name = (playerNameInput.value || 'Anon').trim() || 'Anon';
    fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_name: name, score }),
    })
      .then(() => loadTopScores())
      .catch(() => {});
    showOverlay(
      'Game over!',
      `Je score: ${score}. Beweeg je muis en klik Start om opnieuw te spelen.`,
      true
    );
  }

  function loadTopScores() {
    fetch('/api/scores?limit=10')
      .then(r => r.json())
      .then(rows => {
        topScoresList.innerHTML = rows.length
          ? rows.map(r => `<li><span>${escapeHtml(r.player_name)}</span><strong>${r.score}</strong></li>`).join('')
          : '<li class="empty">Nog geen scores.</li>';
      })
      .catch(() => {
        topScoresList.innerHTML = '<li class="empty">Scores laden mislukt.</li>';
      });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function start() {
    level = 1;
    gameMode = 'snake';
    if (levelEl) levelEl.textContent = '1';
    const cfg = getLevelConfig(1);
    canvas.width = cfg.w;
    canvas.height = cfg.h;
    COLS = Math.floor(cfg.w / CELL);
    ROWS = Math.floor(cfg.h / CELL);
    initSnake();
    foods = [];
    placeFoods();
    currentLevel2Bg = null;
    currentLevel2BgImage = null;
    score = 0;
    scoreEl.textContent = '0';
    highScoreEl.textContent = highScore;
    lastTick = 0;
    running = true;
    hideOverlay();
    canvas.focus();
    gameLoopId = requestAnimationFrame(tick);
  }

  canvas.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (gameMode === 'invaders' && running) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const x = (e.clientX - rect.left) * scaleX;
      playerX = Math.max(0, Math.min(canvas.width - PLAYER_W, x - PLAYER_W / 2));
    }
    useKeyboard = false;
  });

  document.addEventListener('keydown', e => {
    if (e.key.length === 1 && e.key.toLowerCase().match(/[a-z]/)) {
      cheatBuffer = (cheatBuffer + e.key.toLowerCase()).slice(-CHEAT_CODE.length);
      if (cheatBuffer === CHEAT_CODE) {
        cheatBuffer = '';
        if (running && level < LEVELS.length) {
          const newLevel = level + 1;
          score = LEVELS[newLevel - 1].minScore;
          scoreEl.textContent = score;
          if (score > highScore) {
            highScore = score;
            highScoreEl.textContent = highScore;
          }
          switchToLevel(newLevel);
        }
        return;
      }
    }
    if (!running) return;
    if (gameMode === 'invaders') {
      if (e.code === 'Space') {
        e.preventDefault();
        bullets.push({
          x: playerX + PLAYER_W / 2,
          y: canvas.height - PLAYER_Y_OFFSET - 8,
        });
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        playerX = Math.max(0, playerX - 20);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        playerX = Math.min(canvas.width - PLAYER_W, playerX + 20);
        return;
      }
      return;
    }
    const keyDir = ARROW_KEYS[e.key];
    if (!keyDir) return;
    e.preventDefault();
    useKeyboard = true;
    const head = snake[0];
    if (!head) return;
    if (snake.length > 1) {
      const neck = snake[1];
      if (keyDir.dx === neck.x - head.x && keyDir.dy === neck.y - head.y) return;
    }
    nextDirection = keyDir;
    direction = keyDir;
  });

  canvas.addEventListener('click', e => {
    if (!overlay.classList.contains('hidden')) {
      const rect = canvas.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        start();
      }
      return;
    }
    if (gameMode === 'invaders' && running) {
      bullets.push({
        x: playerX + PLAYER_W / 2,
        y: canvas.height - PLAYER_Y_OFFSET - 8,
      });
    }
  });

  startBtn.addEventListener('click', start);

  if (document.getElementById('mainContent') && !document.getElementById('mainContent').classList.contains('hidden')) {
    overlay.classList.remove('hidden');
  }
  if (levelEl) levelEl.textContent = '1';
  loadImages(() => loadTopScores());
})();
