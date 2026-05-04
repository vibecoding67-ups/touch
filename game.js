// ── State ────────────────────────────────────────────────────────────────────
const state = {
  screen: 'menu',
  selectedChar: null,
  difficulty: 'easy',
  score: 0,
  misses: 0,
  combo: 0,
  timeLeft: 30,
  timerInterval: null,
  spawnInterval: null,
  activeCreatures: [],
  isPaused: false,
};

// ── Difficulty config ─────────────────────────────────────────────────────────
const DIFFICULTY = {
  easy:   { spawnMs: 1200, lifeMs: 2200, speedMultiplier: 1.0, timeBonus: 0 },
  medium: { spawnMs: 900,  lifeMs: 1600, speedMultiplier: 1.4, timeBonus: 0 },
  hard:   { spawnMs: 600,  lifeMs: 1100, speedMultiplier: 2.0, timeBonus: 0 },
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const screens = {
  menu:     document.getElementById('screen-menu'),
  game:     document.getElementById('screen-game'),
  pause:    document.getElementById('screen-pause'),
  gameover: document.getElementById('screen-gameover'),
};

const gameArea   = document.getElementById('game-area');
const timerEl    = document.getElementById('timer');
const scoreEl    = document.getElementById('score');
const missesEl   = document.getElementById('misses');
const comboEl    = document.getElementById('combo-display');
const comboCount = document.getElementById('combo-count');

// ── Custom characters (localStorage) ─────────────────────────────────────────
const CUSTOM_KEY = 'catchCutie_customChars';

function loadCustomChars() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');
  } catch { return []; }
}

function saveCustomChars(arr) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(arr));
}

function getAllChars() {
  return [...CHARACTERS, ...loadCustomChars()];
}

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  buildCharacterList();
  loadHighScore();
  bindMenuEvents();
  bindUploadEvents();
}

function buildCharacterList() {
  const grid = document.getElementById('char-list');
  grid.innerHTML = '';

  const all = getAllChars();

  all.forEach((char, i) => {
    grid.appendChild(makeCharCard(char, i === 0));
  });

  // ── Tombol tambah foto ──
  const addBtn = document.createElement('div');
  addBtn.className = 'char-card char-add-btn';
  addBtn.innerHTML = `<span class="add-icon">➕</span><span class="char-name">Foto</span><span class="char-desc">Upload gambar</span>`;
  addBtn.addEventListener('click', () => document.getElementById('file-input').click());
  grid.appendChild(addBtn);

  // default select first
  state.selectedChar = all[0];
}

function makeCharCard(char, isSelected = false) {
  const card = document.createElement('div');
  card.className = 'char-card' + (isSelected ? ' selected' : '');
  card.dataset.id = char.id;

  const size = char.size || 64;
  const visual = char.type === 'image'
    ? `<img src="${char.src}" alt="${char.name}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:50%">`
    : `<span style="font-size:${size * 0.6}px">${char.src}</span>`;

  // tombol hapus hanya untuk karakter custom
  const isCustom = char.id.startsWith('custom_');
  const deleteBtn = isCustom
    ? `<button class="char-delete-btn" data-id="${char.id}" title="Hapus">✕</button>`
    : '';

  card.innerHTML = `
    ${deleteBtn}
    ${visual}
    <span class="char-name">${char.name}</span>
    <span class="char-desc">${char.description}</span>
  `;

  card.addEventListener('click', (e) => {
    if (e.target.classList.contains('char-delete-btn')) return;
    selectCharacter(char.id);
  });

  // hapus karakter custom
  if (isCustom) {
    card.querySelector('.char-delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCustomChar(char.id);
    });
  }

  return card;
}

function selectCharacter(id) {
  state.selectedChar = getAllChars().find(c => c.id === id);
  document.querySelectorAll('.char-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === id);
  });
}

function deleteCustomChar(id) {
  const customs = loadCustomChars().filter(c => c.id !== id);
  saveCustomChars(customs);
  // jika yang dihapus sedang dipilih, reset ke karakter pertama
  if (state.selectedChar && state.selectedChar.id === id) {
    state.selectedChar = getAllChars().find(c => c.id !== id) || CHARACTERS[0];
  }
  buildCharacterList();
  // pertahankan seleksi
  if (state.selectedChar) {
    document.querySelectorAll('.char-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.id === state.selectedChar.id);
    });
  }
}

// ── Upload foto ───────────────────────────────────────────────────────────────
let pendingImageData = null; // base64 sementara sebelum disimpan

function bindUploadEvents() {
  const fileInput    = document.getElementById('file-input');
  const modal        = document.getElementById('modal-upload');
  const nameInput    = document.getElementById('upload-name-input');
  const preview      = document.getElementById('upload-preview');
  const btnConfirm   = document.getElementById('btn-upload-confirm');
  const btnCancel    = document.getElementById('btn-upload-cancel');

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // validasi tipe
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar ya! 🖼️');
      fileInput.value = '';
      return;
    }

    // validasi ukuran (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 5MB ya! 📦');
      fileInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      pendingImageData = ev.target.result;
      preview.src = pendingImageData;
      nameInput.value = file.name.replace(/\.[^.]+$/, '').slice(0, 20);
      modal.classList.remove('hidden');
      nameInput.focus();
      nameInput.select();
    };
    reader.readAsDataURL(file);
    fileInput.value = ''; // reset supaya bisa upload file sama lagi
  });

  btnConfirm.addEventListener('click', () => {
    const name = nameInput.value.trim() || 'Foto Baru';
    if (!pendingImageData) return;

    const newChar = {
      id: 'custom_' + Date.now(),
      name: name,
      type: 'image',
      src: pendingImageData,
      size: 72,
      unlocked: true,
      description: 'Karakter uploadanku 📸',
    };

    const customs = loadCustomChars();
    customs.push(newChar);
    saveCustomChars(customs);

    pendingImageData = null;
    modal.classList.add('hidden');

    buildCharacterList();
    selectCharacter(newChar.id); // langsung pilih karakter baru
  });

  btnCancel.addEventListener('click', () => {
    pendingImageData = null;
    modal.classList.add('hidden');
  });

  // tutup modal kalau klik di luar box
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      pendingImageData = null;
      modal.classList.add('hidden');
    }
  });

  // konfirmasi dengan Enter
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnConfirm.click();
    if (e.key === 'Escape') btnCancel.click();
  });
}

function bindMenuEvents() {
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.difficulty = btn.dataset.diff;
    });
  });

  document.getElementById('btn-start').addEventListener('click', startGame);
  document.getElementById('btn-pause').addEventListener('click', pauseGame);
  document.getElementById('btn-resume').addEventListener('click', resumeGame);
  document.getElementById('btn-quit').addEventListener('click', () => { stopGame(); showScreen('menu'); });
  document.getElementById('btn-replay').addEventListener('click', startGame);
  document.getElementById('btn-menu').addEventListener('click', () => showScreen('menu'));
}

// ── Screen management ─────────────────────────────────────────────────────────
function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });
  state.screen = name;
}

// ── Game flow ─────────────────────────────────────────────────────────────────
function startGame() {
  stopGame(); // clear any previous session

  state.score    = 0;
  state.misses   = 0;
  state.combo    = 0;
  state.timeLeft = 30;
  state.isPaused = false;

  updateHUD();
  gameArea.innerHTML = '';
  showScreen('game');

  const diff = DIFFICULTY[state.difficulty];

  state.timerInterval = setInterval(tickTimer, 1000);
  state.spawnInterval = setInterval(spawnCreature, diff.spawnMs);
}

function stopGame() {
  clearInterval(state.timerInterval);
  clearInterval(state.spawnInterval);
  state.activeCreatures.forEach(c => c.el && c.el.remove());
  state.activeCreatures = [];
}

function tickTimer() {
  if (state.isPaused) return;
  state.timeLeft--;
  timerEl.textContent = state.timeLeft;
  if (state.timeLeft <= 0) endGame();
}

function endGame() {
  stopGame();
  const prev = getHighScore();
  if (state.score > prev) saveHighScore(state.score);

  document.getElementById('final-score').textContent = state.score;
  document.getElementById('result-char').textContent =
    state.selectedChar.type === 'emoji'
      ? state.selectedChar.src + ' ' + state.selectedChar.name
      : '📸 ' + state.selectedChar.name;

  const newHsMsg = document.getElementById('new-highscore-msg');
  newHsMsg.classList.toggle('hidden', state.score <= prev);

  // result emoji based on score
  const emoji = state.score >= 20 ? '🏆' : state.score >= 10 ? '🎉' : '😅';
  document.getElementById('result-emoji').textContent = emoji;

  showScreen('gameover');
}

function pauseGame() {
  state.isPaused = true;
  showScreen('pause');
}

function resumeGame() {
  state.isPaused = false;
  showScreen('game');
}

// ── Spawn ─────────────────────────────────────────────────────────────────────
function spawnCreature() {
  if (state.isPaused) return;

  const char = state.selectedChar;
  const diff = DIFFICULTY[state.difficulty];
  const size = char.size || 64;

  const areaW = gameArea.clientWidth  - size - 10;
  const areaH = gameArea.clientHeight - size - 10;
  const x = Math.random() * areaW + 5;
  const y = Math.random() * areaH + 5;

  const el = document.createElement('div');
  el.className = 'creature';
  el.style.left   = x + 'px';
  el.style.top    = y + 'px';
  el.style.width  = size + 'px';
  el.style.height = size + 'px';

  if (char.type === 'image') {
    el.innerHTML = `<img src="${char.src}" alt="${char.name}" draggable="false">`;
  } else {
    el.style.fontSize = (size * 0.75) + 'px';
    el.textContent = char.src;
  }

  // wiggle animation direction randomised
  el.style.animationDuration = (0.4 + Math.random() * 0.3) + 's';

  gameArea.appendChild(el);

  const creature = { el, caught: false };
  state.activeCreatures.push(creature);

  // click handler
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    if (creature.caught || state.isPaused) return;
    creature.caught = true;
    catchCreature(creature);
  });

  // auto-remove after lifeMs
  setTimeout(() => {
    if (!creature.caught) {
      missCreature(creature);
    }
  }, diff.lifeMs);
}

function catchCreature(creature) {
  state.combo++;
  const points = state.combo >= 3 ? 2 : 1; // combo bonus
  state.score += points;

  // pop animation
  creature.el.classList.add('caught');

  if (state.combo >= 3) showCombo(state.combo);

  setTimeout(() => creature.el.remove(), 300);
  removeFromActive(creature);
  updateHUD();
}

function missCreature(creature) {
  state.combo = 0;
  state.misses++;
  creature.el.classList.add('missed');
  setTimeout(() => creature.el.remove(), 400);
  removeFromActive(creature);
  updateHUD();
}

function removeFromActive(creature) {
  const idx = state.activeCreatures.indexOf(creature);
  if (idx !== -1) state.activeCreatures.splice(idx, 1);
}

// ── HUD ───────────────────────────────────────────────────────────────────────
function updateHUD() {
  scoreEl.textContent  = state.score;
  missesEl.textContent = state.misses;
  timerEl.textContent  = state.timeLeft;
}

function showCombo(n) {
  comboCount.textContent = n;
  comboEl.classList.remove('hidden');
  comboEl.classList.add('pop');
  setTimeout(() => {
    comboEl.classList.add('hidden');
    comboEl.classList.remove('pop');
  }, 800);
}

// ── High Score ────────────────────────────────────────────────────────────────
function getHighScore() {
  return parseInt(localStorage.getItem('catchCutie_hs') || '0', 10);
}

function saveHighScore(score) {
  localStorage.setItem('catchCutie_hs', score);
}

function loadHighScore() {
  document.getElementById('hs-value').textContent = getHighScore();
}

// ── Start ─────────────────────────────────────────────────────────────────────
init();
