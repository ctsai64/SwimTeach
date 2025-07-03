// --- Color palettes ---
const COLOR_PALETTES = [
  ['#4fc3f7', '#81c784', '#ffd54f', '#ff8a65', '#ba68c8', '#f06292', '#a1887f', '#90caf9'],
  ['#ffb300', '#f44336', '#8bc34a', '#00bcd4', '#e040fb', '#ff7043', '#cddc39', '#7e57c2'],
  ['#00bfae', '#ff6f00', '#d500f9', '#00b8d4', '#ff4081', '#ffd600', '#64dd17', '#ff1744'],
  ['#ff80ab', '#b388ff', '#69f0ae', '#ffe57f', '#40c4ff', '#ea80fc', '#ffd180', '#a7ffeb'],
  ['#f48fb1', '#ce93d8', '#80cbc4', '#ffcc80', '#b0bec5', '#c5e1a5', '#fff59d', '#b39ddb'],
];

const MAX_BARS = 20;
const MIN_BARS = 1;

let numBars = 8;
let bars = [];
let filledCount = 0;
let fastestLap = null;
let currentPalette = [];
let stopwatchInterval = null;
let stopwatchStart = null;
let stopwatchRunning = false;
let lapTimes = [];

const barsContainer = document.getElementById('bars-container');
const stopwatchTime = document.getElementById('stopwatch-time');
const stopwatchBtn = document.getElementById('stopwatch-btn');
const fastestLapTime = document.getElementById('fastest-lap-time');
const celebration = document.getElementById('celebration');
const celebrationText = document.querySelector('.celebration-text');
const confetti = document.querySelector('.confetti');
const celebrationSound = document.getElementById('celebration-sound');
const swipeMenu = document.getElementById('swipe-menu');
const addBarBtn = document.getElementById('add-bar');
const removeBarBtn = document.getElementById('remove-bar');
const toggleBarList = document.getElementById('toggle-bar-list');

// --- Utility Functions ---
function pickPalette() {
  const palette = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
  // Pick a single color for the set
  return [palette[Math.floor(Math.random() * palette.length)]];
}
function formatTime(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}
function updateFastestLapDisplay() {
  if (fastestLap !== null) {
    fastestLapTime.textContent = formatTime(fastestLap);
  } else {
    fastestLapTime.textContent = '--:--.--';
  }
}

// --- Bar Rendering ---
function renderBars() {
  barsContainer.innerHTML = '';
  let fastestIndex = null;
  if (fastestLap !== null) {
    fastestIndex = lapTimes.findIndex(t => t === fastestLap);
  }
  bars.forEach((bar, i) => {
    const barDiv = document.createElement('div');
    let barClass = 'bar';
    if (bar.filled) barClass += ' filled';
    if (fastestIndex !== null && i === fastestIndex && bar.filled) barClass += ' fastest';
    barDiv.className = barClass;
    barDiv.style.setProperty('--bar-color', currentPalette[0]);
    barDiv.dataset.index = i;
    const barInner = document.createElement('div');
    barInner.className = 'bar-inner';
    barDiv.appendChild(barInner);
    barsContainer.appendChild(barDiv);
  });
}

function animateBarFill(index) {
  const barDiv = barsContainer.children[index];
  if (!barDiv) return;
  barDiv.classList.add('filled');
  setTimeout(() => {
    barDiv.querySelector('.bar-inner').style.background = currentPalette[0];
  }, 100);
}

// --- Stopwatch Logic ---
function resetStopwatch() {
  clearInterval(stopwatchInterval);
  stopwatchTime.textContent = '00:00.00';
  stopwatchRunning = false;
  stopwatchBtn.textContent = 'Start';
}
function startStopwatch() {
  stopwatchStart = Date.now();
  stopwatchRunning = true;
  stopwatchBtn.textContent = 'Stop';
  stopwatchInterval = setInterval(() => {
    const elapsed = Date.now() - stopwatchStart;
    stopwatchTime.textContent = formatTime(elapsed);
  }, 30);
}
function stopStopwatch() {
  clearInterval(stopwatchInterval);
  stopwatchRunning = false;
  stopwatchBtn.textContent = 'Start';
  const elapsed = Date.now() - stopwatchStart;
  stopwatchTime.textContent = formatTime(elapsed);
  return elapsed;
}

stopwatchBtn.addEventListener('click', () => {
  if (!stopwatchRunning) {
    startStopwatch();
  } else {
    const elapsed = stopStopwatch();
    fillNextBar(elapsed);
  }
});

// --- Bar Fill Logic ---
function fillNextBar(lapTime) {
  const next = bars.findIndex(bar => !bar.filled);
  if (next === -1) return;
  bars[next].filled = true;
  animateBarFill(next);
  filledCount++;
  lapTimes[next] = lapTime;
  if (fastestLap === null || lapTime < fastestLap) {
    fastestLap = lapTime;
    updateFastestLapDisplay();
  }
  renderBars();
  if (filledCount === bars.length) {
    setTimeout(() => {
      celebrate();
    }, 700);
  }
  resetStopwatch();
}

// --- Celebration ---
function celebrate() {
  showCelebration();
  playCelebrationSound();
  showConfetti();
  setTimeout(() => {
    hideCelebration();
    setTimeout(() => {
      newSet();
    }, 400);
  }, 2200);
}
function showCelebration() {
  celebration.classList.remove('hidden');
  celebration.style.opacity = 1;
}
function hideCelebration() {
  celebration.classList.add('hidden');
  celebration.style.opacity = 0;
}
function playCelebrationSound() {
  // Use Web Audio API for a fun sound
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(440, ctx.currentTime);
    o.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.3);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.5);
    o.onended = () => ctx.close();
  } catch (e) {}
}
function showConfetti() {
  confetti.innerHTML = '';
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.style.position = 'absolute';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.top = (Math.random() * 10 + 5) + 'vw';
    piece.style.width = '1.2vw';
    piece.style.height = '3vw';
    piece.style.background = currentPalette[0];
    piece.style.borderRadius = '0.6vw';
    piece.style.transform = `rotate(${Math.random()*360}deg)`;
    piece.style.opacity = 0.85;
    piece.style.transition = 'top 1.5s cubic-bezier(.68,-0.55,.27,1.55), opacity 1.5s';
    confetti.appendChild(piece);
    setTimeout(() => {
      piece.style.top = (Math.random() * 30 + 30) + 'vw';
      piece.style.opacity = 0.1;
    }, 100);
  }
}

// --- New Set ---
function newSet() {
  currentPalette = pickPalette();
  bars = Array.from({length: numBars}, () => ({filled: false}));
  filledCount = 0;
  fastestLap = null;
  lapTimes = [];
  updateFastestLapDisplay();
  renderBars();
  updateToggleBarList();
  resetStopwatch();
}

// --- Swipe Menu ---
let touchStartX = null;
let touchStartY = null;
let menuOpen = false;

document.body.addEventListener('touchstart', (e) => {
  if (e.touches[0].clientX > window.innerWidth - 40) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  } else {
    touchStartX = null;
  }
});
document.body.addEventListener('touchmove', (e) => {
  if (touchStartX !== null) {
    const dx = e.touches[0].clientX - touchStartX;
    if (dx < -30 && !menuOpen) {
      openMenu();
      touchStartX = null;
    }
  }
});
document.body.addEventListener('touchend', (e) => {
  touchStartX = null;
});
function openMenu() {
  swipeMenu.classList.add('visible');
  swipeMenu.classList.remove('hidden');
  menuOpen = true;
}
function closeMenu() {
  swipeMenu.classList.remove('visible');
  swipeMenu.classList.add('hidden');
  menuOpen = false;
}
swipeMenu.addEventListener('touchstart', (e) => {
  // Prevent menu from closing on touch inside
  e.stopPropagation();
});
document.body.addEventListener('touchstart', (e) => {
  if (menuOpen && (!swipeMenu.contains(e.target))) {
    closeMenu();
  }
});

// --- Menu Controls ---
addBarBtn.addEventListener('click', () => {
  if (numBars < MAX_BARS) {
    numBars++;
    bars.push({filled: false});
    renderBars();
    updateToggleBarList();
  }
});
removeBarBtn.addEventListener('click', () => {
  if (numBars > MIN_BARS) {
    numBars--;
    bars.pop();
    renderBars();
    updateToggleBarList();
    if (filledCount > numBars) filledCount = numBars;
  }
});
function updateToggleBarList() {
  toggleBarList.innerHTML = '';
  bars.forEach((bar, i) => {
    const btn = document.createElement('button');
    btn.className = 'toggle-bar-btn' + (bar.filled ? ' filled' : '');
    btn.textContent = i+1;
    btn.addEventListener('click', () => {
      bar.filled = !bar.filled;
      if (bar.filled) {
        filledCount++;
        animateBarFill(i);
      } else {
        filledCount--;
        barsContainer.children[i].classList.remove('filled');
      }
      renderBars();
      updateToggleBarList();
    });
    toggleBarList.appendChild(btn);
  });
}

// --- Init ---
window.addEventListener('DOMContentLoaded', () => {
  newSet();
}); 