// Taco Truck Rush — game logic: orders, grill, chopping, assembly, serving,
// timer, coins and combo. Plain DOM + requestAnimationFrame, no libraries.

const SHIFT_SECONDS = 120;
const GRILL_SECONDS = 4;
const BURN_SECONDS = 4; // ready beef burns if left this long after grilling
const CHOP_SECONDS = 2;
const MAX_ORDERS = 3;
const ORDER_SPAWN_SECONDS = 7;

const $ = (id) => document.getElementById(id);

const state = {
  running: false,
  timeLeft: SHIFT_SECONDS,
  elapsed: 0,
  coins: 0,
  combo: 0,
  bestCombo: 0,
  served: 0,
  mistakes: 0,
  nextOrderId: 1,
  spawnIn: 0,
  orders: [],          // {id, items, pay, patience, maxPatience}
  grill: [null, null, null], // {state:'cooking'|'ready'|'burnt', t}
  chop: [null, null, null],  // {item, state:'chopping'|'ready', t}
  tray: [],            // ready ingredient names, click to add to plate
  plate: [],           // ingredient names on the current taco
};

let lastTick = 0;
let toastTimer = null;

// ---------- helpers ----------

function showToast(text, bad) {
  const toast = $('toast');
  toast.textContent = text;
  toast.classList.toggle('bad', !!bad);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function chip(item) {
  return '<span class="chip"><span class="dot ' + item + '"></span>' + INGREDIENTS[item].name + '</span>';
}

// ---------- rendering ----------

function renderHud() {
  $('timer').textContent = formatTime(state.timeLeft);
  $('coins').textContent = state.coins;
  $('combo').textContent = 'x' + (state.combo + 1);
  $('served').textContent = state.served;
  $('hud-timer').classList.toggle('low', state.running && state.timeLeft <= 15);
}

function renderOrders() {
  const wrap = $('order-slots');
  wrap.innerHTML = '';
  for (let i = 0; i < MAX_ORDERS; i++) {
    const order = state.orders[i];
    if (!order) {
      const div = document.createElement('div');
      div.className = 'order-card waiting';
      div.textContent = 'Waiting for a customer…';
      wrap.appendChild(div);
      continue;
    }
    const card = document.createElement('div');
    card.className = 'order-card';
    card.dataset.orderId = order.id;
    const pct = Math.max(0, (order.patience / order.maxPatience) * 100);
    card.innerHTML =
      '<span class="order-num">#' + order.id + '</span>' +
      '<div class="order-items">' + order.items.map(chip).join('') + '</div>' +
      '<div class="patience' + (pct < 35 ? ' low' : '') + '"><div style="width:' + pct + '%"></div></div>' +
      '<div class="pay">Pays ' + order.pay + ' coins</div>';
    wrap.appendChild(card);
  }
}

function renderGrill() {
  const wrap = $('grill-slots');
  wrap.innerHTML = '';
  state.grill.forEach((slot, i) => {
    const div = document.createElement('div');
    div.className = 'slot';
    div.dataset.slot = i;
    if (!slot) {
      div.innerHTML = '<span class="emoji">🍳</span>Empty grill';
    } else if (slot.state === 'cooking') {
      const pct = Math.min(100, (slot.t / GRILL_SECONDS) * 100);
      div.classList.add('cooking');
      div.innerHTML = '<span class="emoji">🥩</span>Grilling…<span class="bar" style="width:' + pct + '%"></span>';
    } else if (slot.state === 'ready') {
      const pct = Math.min(100, (slot.t / BURN_SECONDS) * 100);
      div.classList.add('ready');
      div.innerHTML = '<span class="emoji">🥩</span>Ready! Click to take<span class="bar done" style="width:' + pct + '%"></span>';
    } else {
      div.classList.add('burnt');
      div.innerHTML = '<span class="emoji">🔥</span>Burnt! Click to trash';
    }
    div.addEventListener('click', () => onGrillSlot(i));
    wrap.appendChild(div);
  });
}

function renderChop() {
  const wrap = $('chop-slots');
  wrap.innerHTML = '';
  state.chop.forEach((slot, i) => {
    const div = document.createElement('div');
    div.className = 'slot';
    div.dataset.slot = i;
    if (!slot) {
      div.innerHTML = '<span class="emoji">🧅</span>Empty board';
    } else if (slot.state === 'chopping') {
      const pct = Math.min(100, (slot.t / CHOP_SECONDS) * 100);
      div.classList.add('cooking');
      div.innerHTML = '<span class="emoji">🔪</span>Chopping ' + INGREDIENTS[slot.item].name + '…<span class="bar" style="width:' + pct + '%"></span>';
    } else {
      div.classList.add('ready');
      div.innerHTML = '<span class="emoji">🥗</span>' + INGREDIENTS[slot.item].name + ' ready!<span class="bar done" style="width:100%"></span>';
    }
    div.addEventListener('click', () => onChopSlot(i));
    wrap.appendChild(div);
  });
}

function renderTray() {
  const wrap = $('tray-items');
  wrap.innerHTML = '';
  if (state.tray.length === 0) {
    wrap.innerHTML = '<span class="tray-empty">Nothing ready yet</span>';
    return;
  }
  state.tray.forEach((item, i) => {
    const el = document.createElement('button');
    el.className = 'tray-item';
    el.innerHTML = '<span class="dot ' + item + '"></span>' + INGREDIENTS[item].name;
    el.addEventListener('click', () => addToPlate(item, i));
    wrap.appendChild(el);
  });
}

function renderPlate() {
  const wrap = $('plate-items');
  wrap.innerHTML = '';
  if (state.plate.length === 0) {
    wrap.innerHTML = '<span class="plate-empty">Empty plate — start with a tortilla</span>';
  } else {
    state.plate.forEach((item) => {
      const layer = document.createElement('div');
      layer.className = 'plate-layer';
      layer.innerHTML = '<span class="dot ' + item + '"></span>' + INGREDIENTS[item].name;
      wrap.appendChild(layer);
    });
  }
  $('serve-btn').disabled = state.plate.length === 0 || !state.running;
}

function renderAll() {
  renderHud();
  renderOrders();
  renderGrill();
  renderChop();
  renderTray();
  renderPlate();
}

// ---------- actions ----------

function spawnOrder() {
  if (state.orders.length >= MAX_ORDERS) return;
  state.orders.push(makeOrder(state.nextOrderId++, state.elapsed));
}

function onGrillSlot(i) {
  if (!state.running) return;
  const slot = state.grill[i];
  if (!slot) return;
  if (slot.state === 'ready') {
    state.tray.push('beef');
    state.grill[i] = null;
    showToast('Grilled beef to the tray!');
  } else if (slot.state === 'burnt') {
    state.grill[i] = null;
    showToast('Burnt beef trashed.', true);
  }
  renderAll();
}

function onChopSlot(i) {
  if (!state.running) return;
  const slot = state.chop[i];
  if (!slot || slot.state !== 'ready') return;
  state.tray.push(slot.item);
  state.chop[i] = null;
  TacoSounds.chop();
  showToast(INGREDIENTS[slot.item].name + ' to the tray!');
  renderAll();
}

function onBin(item) {
  if (!state.running) return;
  if (item === 'beef') {
    const free = state.grill.findIndex((s) => s === null);
    if (free === -1) { showToast('Grill is full!', true); return; }
    state.grill[free] = { state: 'cooking', t: 0 };
  } else if (CHOP_ITEMS.includes(item)) {
    const free = state.chop.findIndex((s) => s === null);
    if (free === -1) { showToast('Chop board is full!', true); return; }
    state.chop[free] = { item, state: 'chopping', t: 0 };
  } else {
    addToPlate(item, -1);
    return;
  }
  renderAll();
}

function addToPlate(item, trayIndex) {
  if (!state.running) return;
  if (item !== 'tortilla' && !state.plate.includes('tortilla')) {
    showToast('Start the taco with a tortilla first!', true);
    return;
  }
  if (state.plate.filter((x) => x === item).length >= 1 && item !== 'tortilla') {
    showToast('Already on the taco!', true);
    return;
  }
  if (trayIndex >= 0) state.tray.splice(trayIndex, 1);
  state.plate.push(item);
  renderAll();
}

function serveTaco() {
  if (!state.running || state.plate.length === 0) return;
  const match = state.orders.find((o) => setsMatch(o.items, state.plate));
  if (match) {
    // Fast serve bonus: a customer served with most of their patience left
    // tips extra, which rewards planning a route through the kitchen.
    const fastBonus = match.patience / match.maxPatience > 0.7 ? 2 : 0;
    const bonus = Math.min(state.combo, 4);
    const earned = match.pay + bonus + fastBonus;
    state.coins += earned;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.served += 1;
    state.orders = state.orders.filter((o) => o !== match);
    state.plate = [];
    TacoSounds.chaChing();
    showToast('Served! +' + earned + ' coins' + (bonus > 0 ? ' (combo +' + bonus + ')' : '') + (fastBonus > 0 ? ' (fast +2)' : ''));
    // Keep the rush going: a fresh order walks in right away.
    spawnOrder();
  } else {
    state.coins = Math.max(0, state.coins - 5);
    state.combo = 0;
    state.mistakes += 1;
    state.plate = [];
    TacoSounds.buzz();
    showToast('Wrong taco! -5 coins, combo lost.', true);
    $('plate-station').classList.add('shake');
    setTimeout(() => $('plate-station').classList.remove('shake'), 350);
  }
  renderAll();
}

function clearPlate() {
  if (!state.running) return;
  state.plate = [];
  renderAll();
}

// ---------- main loop ----------

function tick(now) {
  if (!state.running) return;
  const dt = Math.min(0.1, (now - lastTick) / 1000);
  lastTick = now;
  state.elapsed += dt;
  state.timeLeft -= dt;

  // Grill timers.
  state.grill.forEach((slot) => {
    if (!slot) return;
    slot.t += dt;
    if (slot.state === 'cooking' && slot.t >= GRILL_SECONDS) {
      slot.state = 'ready';
      slot.t = 0;
      TacoSounds.ding();
    } else if (slot.state === 'ready' && slot.t >= BURN_SECONDS) {
      slot.state = 'burnt';
      slot.t = 0;
    }
  });

  // Chop timers.
  state.chop.forEach((slot) => {
    if (!slot) return;
    slot.t += dt;
    if (slot.state === 'chopping' && slot.t >= CHOP_SECONDS) {
      slot.state = 'ready';
      slot.t = 0;
      TacoSounds.chop();
    }
  });

  // Order patience.
  let ordersChanged = false;
  state.orders.forEach((o) => { o.patience -= dt; });
  const before = state.orders.length;
  state.orders = state.orders.filter((o) => o.patience > 0);
  if (state.orders.length < before) {
    state.combo = 0;
    state.mistakes += 1;
    TacoSounds.walkAway();
    showToast('A customer walked away! Combo lost.', true);
    ordersChanged = true;
  }

  // Spawn new orders.
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    spawnOrder();
    state.spawnIn = ORDER_SPAWN_SECONDS;
    ordersChanged = true;
  }

  if (state.timeLeft <= 0) {
    endShift();
    return;
  }

  renderAll();
  requestAnimationFrame(tick);
}

function startShift() {
  TacoSounds.unlock();
  Object.assign(state, {
    running: true, timeLeft: SHIFT_SECONDS, elapsed: 0, coins: 0, combo: 0,
    bestCombo: 0, served: 0, mistakes: 0, nextOrderId: 1, spawnIn: 0,
    orders: [], grill: [null, null, null], chop: [null, null, null], tray: [], plate: [],
  });
  $('overlay').classList.add('hidden');
  spawnOrder();
  spawnOrder();
  lastTick = performance.now();
  renderAll();
  requestAnimationFrame(tick);
  showToast('Shift started — first orders are in!');
}

function endShift() {
  state.running = false;
  TacoSounds.fanfare();
  renderAll();
  $('overlay-title').textContent = '⏰ Shift over!';
  $('overlay-text').textContent = 'The lunch rush is done. How did the truck do?';
  $('overlay-stats').textContent =
    'Coins: ' + state.coins + '  •  Tacos served: ' + state.served +
    '  •  Best combo: x' + (state.bestCombo + 1) + '  •  Mistakes: ' + state.mistakes;
  $('start-btn').textContent = 'PLAY AGAIN';
  $('overlay').classList.remove('hidden');
}

// ---------- wiring ----------

document.querySelectorAll('.bin').forEach((btn) => {
  btn.addEventListener('click', () => onBin(btn.dataset.item));
});
$('serve-btn').addEventListener('click', serveTaco);
$('trash-btn').addEventListener('click', clearPlate);
$('start-btn').addEventListener('click', startShift);

// Keyboard shortcuts: 1 beef, 2 tomato, 3 onion, 4 lettuce, 5 tortilla,
// 6 cheese, 7 salsa, Space serve, Backspace clear plate.
const KEY_ITEMS = { 1: 'beef', 2: 'tomato', 3: 'onion', 4: 'lettuce', 5: 'tortilla', 6: 'cheese', 7: 'salsa' };
document.addEventListener('keydown', (e) => {
  if (!state.running) return;
  if (KEY_ITEMS[e.key]) onBin(KEY_ITEMS[e.key]);
  else if (e.key === ' ') { e.preventDefault(); serveTaco(); }
  else if (e.key === 'Backspace') { e.preventDefault(); clearPlate(); }
});

renderAll();

// Exposed for automated play-testing only (headless browser checks).
window.TacoTruck = { state, startShift, onBin, onGrillSlot, onChopSlot, addToPlate, serveTaco, clearPlate };
