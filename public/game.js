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
  const LEVEL1_SIZE = { w: 640, h: 480 };
  const LEVEL2_SIZE = { w: 960, h: 720 };
  const BASE_SPEED = 120;
  const MOHAWK_SPIKES = 5;
  const MOHAWK_COLOR = '#e63946';
  const HEAD_COLOR = '#2a9d8f';
  const BODY_COLOR = '#264653';
  const FOOD_COLOR = '#f4a261';
  const SCORE_TO_LEVEL2 = 150;

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
  let COLS = Math.floor(LEVEL1_SIZE.w / CELL);
  let ROWS = Math.floor(LEVEL1_SIZE.h / CELL);

  let bgImageLevel1 = null;
  let bgImagesLevel2 = [];
  let currentLevel2Bg = null;
  let currentLevel2BgImage = null;

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

  function placeFoods() {
    const want = level === 1 ? 1 : 2;
    foods = [];
    for (let i = 0; i < want; i++) placeOneFood();
  }

  function pickRandomLevel2Bg() {
    if (bgImagesLevel2.length === 0) return;
    const idx = Math.floor(Math.random() * bgImagesLevel2.length);
    currentLevel2Bg = bgImagesLevel2[idx];
    currentLevel2BgImage = currentLevel2Bg ? currentLevel2Bg.img : null;
  }

  function drawBackground() {
    if (level === 1 && bgImageLevel1) {
      ctx.drawImage(bgImageLevel1, 0, 0, canvas.width, canvas.height);
      return;
    }
    if (level === 2 && currentLevel2BgImage) {
      ctx.drawImage(currentLevel2BgImage, 0, 0, canvas.width, canvas.height);
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

  function switchToLevel2() {
    level = 2;
    if (levelEl) levelEl.textContent = '2';
    canvas.width = LEVEL2_SIZE.w;
    canvas.height = LEVEL2_SIZE.h;
    COLS = Math.floor(LEVEL2_SIZE.w / CELL);
    ROWS = Math.floor(LEVEL2_SIZE.h / CELL);
    initSnake();
    placeFoods();
    pickRandomLevel2Bg();
  }

  function tick(now) {
    if (!running) return;
    if (!lastTick) lastTick = now;
    const elapsed = now - lastTick;
    const speed = Math.max(60, BASE_SPEED - score * 2);
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
      if (level === 2) {
        pickRandomLevel2Bg();
        foods.splice(eatenIdx, 1);
        placeOneFood();
      } else {
        foods = [];
        if (score >= SCORE_TO_LEVEL2) {
          switchToLevel2();
        } else {
          placeFoods();
        }
      }
    } else {
      snake.pop();
    }

    draw();
    gameLoopId = requestAnimationFrame(tick);
  }

  function draw() {
    drawBackground();
    drawFoods();
    drawSnake();
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
    if (levelEl) levelEl.textContent = '1';
    canvas.width = LEVEL1_SIZE.w;
    canvas.height = LEVEL1_SIZE.h;
    COLS = Math.floor(LEVEL1_SIZE.w / CELL);
    ROWS = Math.floor(LEVEL1_SIZE.h / CELL);
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
    useKeyboard = false;
  });

  document.addEventListener('keydown', e => {
    const keyDir = ARROW_KEYS[e.key];
    if (!keyDir || !running) return;
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
    if (overlay.classList.contains('hidden')) return;
    const rect = canvas.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
      start();
    }
  });

  startBtn.addEventListener('click', start);

  overlay.classList.remove('hidden');
  if (levelEl) levelEl.textContent = '1';
  loadImages(() => loadTopScores());
})();
