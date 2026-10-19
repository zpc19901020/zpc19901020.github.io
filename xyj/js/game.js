/* 梦幻小西游 —— 单机 2D 回合制小游戏（纯 Canvas，无需联网，可直接双击 index.html 运行） */
'use strict';
(function () {
const W = 1280, H = 720, TS = 32, MW = 64, MH = 48;
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const FONT = '"Microsoft YaHei","PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","Noto Serif CJK SC","Source Han Sans SC",sans-serif';
const SAVE_KEY = 'mhxy_mini_save_v1';

// ---------------- 工具 ----------------
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function seeded(s) { return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const easeInOut = p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
const easeOut = p => 1 - Math.pow(1 - p, 3);
const linear = p => p;
function font(sz, bold) { return (bold ? 'bold ' : '') + sz + 'px ' + FONT; }

// ---------------- 补间 / 等待 ----------------
const tweens = [];
function tween(dur, fn, ease) {
  ease = ease || easeInOut;
  return new Promise(res => tweens.push({ t: 0, dur: Math.max(1, dur), fn, ease, res }));
}
const wait = ms => tween(ms, () => {}, linear);
function updateTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt * 1000;
    const p = Math.min(1, tw.t / tw.dur);
    tw.fn(tw.ease(p));
    if (p >= 1) { tweens.splice(i, 1); tw.res(); }
  }
}

// ---------------- 音效（WebAudio 合成） ----------------
let actx = null, muted = false;
function sfx(type) {
  if (muted) return;
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime;
    const o = actx.createOscillator(), g = actx.createGain();
    o.connect(g); g.connect(actx.destination);
    const S = {
      click: ['triangle', 660, 880, 0.06, 0.08],
      hit: ['square', 180, 60, 0.12, 0.12],
      crit: ['sawtooth', 260, 50, 0.2, 0.15],
      magic: ['sine', 400, 1200, 0.35, 0.12],
      fire: ['sawtooth', 120, 400, 0.4, 0.1],
      heal: ['sine', 520, 1040, 0.4, 0.1],
      level: ['triangle', 520, 1560, 0.6, 0.14],
      win: ['triangle', 440, 990, 0.5, 0.12],
      lose: ['sine', 300, 90, 0.7, 0.12],
      enc: ['sawtooth', 90, 700, 0.35, 0.08],
      coin: ['square', 990, 1320, 0.12, 0.06],
    }[type] || ['sine', 440, 440, 0.1, 0.1];
    o.type = S[0];
    o.frequency.setValueAtTime(S[1], t);
    o.frequency.exponentialRampToValueAtTime(S[2], t + S[3]);
    g.gain.setValueAtTime(S[4], t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + S[3]);
    o.start(t); o.stop(t + S[3] + 0.02);
  } catch (e) { /* 忽略音频错误 */ }
}

// ---------------- 美术资源（全部由 js/art.js 程序绘制，离线可用） ----------------
const IMG = {};
function loadImages(cb) {
  const A = window.ART;
  if (A) {
    ['hero', 'pet', 'npc', 'tree', 'boar', 'fox'].forEach(k => { try { IMG[k] = A[k](); } catch (e) { console.warn('art', k, e); } });
    try { IMG.bbg = A.battleBg(W, H); } catch (e) { console.warn('bg', e); }
  }
  cb();
}

// 后备形象（万一 art.js 缺失）
function fallbackSprite(key, h) {
  const c = document.createElement('canvas');
  const w = Math.round(h * 0.8); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const col = { hero: ['#2f5fb3', '#f3f0e6'], pet: ['#ffffff', '#4b7fd6'], npc: ['#8a8a8a', '#eeeeee'],
    tree: ['#6b4a2b', '#7aa83a'], boar: ['#5a3a22', '#c0392b'], fox: ['#8e5bd0', '#5ac8ff'] }[key] || ['#888', '#ccc'];
  g.fillStyle = col[0];
  g.beginPath(); g.ellipse(w / 2, h * 0.7, w * 0.33, h * 0.28, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = col[1]; g.beginPath(); g.arc(w / 2, h * 0.32, w * 0.26, 0, Math.PI * 2); g.fill();
  return c;
}
const spriteCache = {};
function getSprite(key) {
  if (IMG[key]) return IMG[key];
  if (!spriteCache[key]) spriteCache[key] = fallbackSprite(key, 200);
  return spriteCache[key];
}
// 以脚底 (x,y) 为锚点绘制
function drawSprite(key, x, y, h, flip, alpha, bright) {
  const im = getSprite(key);
  const w = h * im.width / im.height;
  ctx.save();
  ctx.globalAlpha = alpha == null ? 1 : alpha;
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  if (bright) ctx.filter = 'brightness(' + bright + ')';
  ctx.drawImage(im, -w / 2, -h, w, h);
  ctx.restore();
  return w;
}
function shadow(x, y, rx, ry) {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry || rx * 0.35, 0, 0, Math.PI * 2); ctx.fill();
}

// ---------------- 地图 ----------------
const tiles = new Uint8Array(MW * MH);   // 0 草地 1 道路 2 水 3 桥
const solid = new Uint8Array(MW * MH);
const flowers = [];
const objs = [];   // 带深度的场景物件
const idx = (x, y) => y * MW + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
const isSolid = (x, y) => !inMap(x, y) || solid[idx(x, y)] === 1;
const solidAtPx = (px, py) => isSolid(Math.floor(px / TS), Math.floor(py / TS));

const VILLAGE = { x0: 3, y0: 7, x1: 27, y1: 33 };
function zoneAt(tx, ty) {
  if (tx >= VILLAGE.x0 && tx <= VILLAGE.x1 && ty >= VILLAGE.y0 && ty <= VILLAGE.y1) return 'village';
  if (tx >= 44) return 'mountain';
  return 'wild';
}
const ZONES = {
  village: { name: '桃源村', safe: true },
  wild: { name: '桃源郊外', pool: ['tree', 'tree', 'boar'], lv: [1, 2] },
  mountain: { name: '落霞山', pool: ['boar', 'fox', 'fox', 'tree'], lv: [3, 5] },
};
const NPC = { name: '孙大夫', tx: 18, ty: 21, x: 18 * TS + 16, y: 21 * TS + 26 };
const START = { x: 15 * TS + 32, y: 25 * TS + 16 };

function riverX(y) { return Math.round(41 + Math.sin(y * 0.23) * 2.2 + Math.sin(y * 0.07 + 1) * 1.4); }

function genMap() {
  const R = seeded(20261019);
  const setT = (x, y, t) => { if (inMap(x, y)) tiles[idx(x, y)] = t; };
  const setS = (x, y) => { if (inMap(x, y)) solid[idx(x, y)] = 1; };
  // 河流
  for (let y = 0; y < MH; y++) { const cx = riverX(y); for (let x = cx - 1; x <= cx + 1; x++) setT(x, y, 2); }
  const road = (x, y) => { if (!inMap(x, y)) return; tiles[idx(x, y)] = tiles[idx(x, y)] === 2 ? 3 : (tiles[idx(x, y)] === 3 ? 3 : 1); };
  for (let x = 1; x < 58; x++) { road(x, 24); road(x, 25); }      // 东西大道
  for (let y = 3; y < 45; y++) { road(15, y); road(16, y); }      // 南北大道
  for (let y = 8; y < 42; y++) { road(55, y); road(56, y); }      // 山间小路
  for (let y = 12; y < 30; y++) for (let x = 12; x <= 19; x++) if (y >= 20 && y <= 28) road(x, y); // 村中广场
  // 水为阻挡
  for (let i = 0; i < tiles.length; i++) if (tiles[i] === 2) solid[i] = 1;
  // 房屋
  const houses = [{ x: 5, y: 16, w: 5, h: 3 }, { x: 19, y: 16, w: 5, h: 3 }, { x: 5, y: 28, w: 5, h: 3 },
    { x: 20, y: 29, w: 5, h: 3 }, { x: 8, y: 10, w: 4, h: 3 }, { x: 20, y: 9, w: 5, h: 3 }];
  houses.forEach((hs, i) => {
    for (let y = hs.y; y < hs.y + hs.h; y++) for (let x = hs.x; x < hs.x + hs.w; x++) setS(x, y);
    objs.push({ type: 'house', x: hs.x * TS, y: (hs.y + hs.h) * TS, w: hs.w, h: hs.h, v: i, base: (hs.y + hs.h) * TS });
  });
  // 宝塔（落霞山）
  for (let y = 4; y < 7; y++) for (let x = 58; x < 61; x++) setS(x, y);
  objs.push({ type: 'pagoda', x: 58 * TS, y: 7 * TS, base: 7 * TS });
  // 井
  setS(13, 21); objs.push({ type: 'well', x: 13 * TS + 16, y: 21 * TS + 28, base: 21 * TS + 28 });
  setS(NPC.tx, NPC.ty);
  // 村庄篱笆
  const V = VILLAGE;
  const gate = (x, y) => (x === 15 || x === 16) || (y === 24 || y === 25);
  for (let x = V.x0; x <= V.x1; x++) {
    [V.y0, V.y1].forEach(y => { if (!gate(x, y)) { setS(x, y); objs.push({ type: 'fence', x: x * TS, y: y * TS + 26, base: y * TS + 26, dir: 'h' }); } });
  }
  for (let y = V.y0 + 1; y < V.y1; y++) {
    [V.x0, V.x1].forEach(x => { if (!gate(x, y)) { setS(x, y); objs.push({ type: 'fence', x: x * TS, y: y * TS + 26, base: y * TS + 26, dir: 'v' }); } });
  }
  // 村内桃树
  [[4, 9], [26, 13], [4, 21], [26, 21], [11, 31], [25, 26], [13, 14], [18, 13], [4, 32], [26, 32], [22, 23]].forEach(([x, y]) => {
    if (!isSolid(x, y) && tiles[idx(x, y)] === 0) { setS(x, y); objs.push({ type: 'tree', x: x * TS + 16, y: y * TS + 26, base: y * TS + 26, v: 4 + (x % 2) }); }
  });
  // 野外树木、石头、花
  const nearRoad = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = inMap(x + dx, y + dy) ? tiles[idx(x + dx, y + dy)] : 0; if (t === 1 || t === 3) return true; } return false; };
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = idx(x, y);
    if (solid[i] || tiles[i] !== 0) continue;
    const edge = x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2;
    const z = zoneAt(x, y);
    const r = R();
    if (edge) {
      if (r < 0.92) { solid[i] = 1; objs.push({ type: 'tree', x: x * TS + 16, y: y * TS + 26, base: y * TS + 26, v: Math.floor(R() * 4) }); }
      continue;
    }
    if (z === 'village') { if (r < 0.06) flowers.push({ x: x * TS + R() * 32, y: y * TS + R() * 32, c: Math.floor(R() * 3) }); continue; }
    if (nearRoad(x, y)) { if (r < 0.08) flowers.push({ x: x * TS + R() * 32, y: y * TS + R() * 32, c: Math.floor(R() * 3) }); continue; }
    const treeP = z === 'mountain' ? 0.1 : 0.065;
    if (r < treeP) { solid[i] = 1; objs.push({ type: 'tree', x: x * TS + 16, y: y * TS + 26, base: y * TS + 26, v: z === 'mountain' ? (R() < 0.5 ? 2 : 3) : (R() < 0.25 ? 4 : Math.floor(R() * 2)) }); }
    else if (r < treeP + 0.02) { solid[i] = 1; objs.push({ type: 'rock', x: x * TS + 16, y: y * TS + 24, base: y * TS + 24, v: Math.floor(R() * 3) }); }
    else if (r < treeP + 0.09) flowers.push({ x: x * TS + R() * 32, y: y * TS + R() * 32, c: Math.floor(R() * 3) });
  }
}

// 从出生点出发的可达区域（怪物只在可达处刷新）
let reach = null;
function computeReach() {
  reach = new Uint8Array(MW * MH);
  const q = [[Math.floor(START.x / TS), Math.floor(START.y / TS)]];
  reach[idx(q[0][0], q[0][1])] = 1;
  while (q.length) {
    const [x, y] = q.shift();
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      if (inMap(nx, ny) && !solid[idx(nx, ny)] && !reach[idx(nx, ny)]) { reach[idx(nx, ny)] = 1; q.push([nx, ny]); }
    });
  }
}

// ---------------- 预渲染 ----------------
let groundCv = null;
const treeCvs = [], houseCvs = {}, rockCvs = [];
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }

function renderGround() {
  const [c, g] = mkCanvas(MW * TS, MH * TS);
  const R = seeded(77);
  // 草地
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const z = zoneAt(x, y);
    const hue = z === 'mountain' ? 100 + R() * 8 : 88 + R() * 10;
    const light = (z === 'mountain' ? 38 : 44) + R() * 5;
    g.fillStyle = `hsl(${hue},${z === 'mountain' ? 34 : 48}%,${light}%)`;
    g.fillRect(x * TS, y * TS, TS, TS);
  }
  // 草地斑驳
  for (let i = 0; i < 2600; i++) {
    const x = R() * MW * TS, y = R() * MH * TS;
    g.fillStyle = R() < 0.5 ? 'rgba(255,255,200,0.07)' : 'rgba(20,60,10,0.08)';
    g.beginPath(); g.ellipse(x, y, 10 + R() * 30, 6 + R() * 14, R() * 3, 0, 7); g.fill();
  }
  for (let i = 0; i < 9000; i++) {
    const x = R() * MW * TS, y = R() * MH * TS;
    g.strokeStyle = R() < 0.5 ? 'rgba(40,90,20,0.45)' : 'rgba(170,210,110,0.4)';
    g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + R() * 4 - 2, y - 3 - R() * 4); g.stroke();
  }
  // 道路（软边）
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = tiles[idx(x, y)];
    if (t === 1) {
      g.fillStyle = '#c9ad74';
      g.beginPath(); g.roundRect ? g.roundRect(x * TS - 3, y * TS - 3, TS + 6, TS + 6, 10) : g.rect(x * TS - 3, y * TS - 3, TS + 6, TS + 6); g.fill();
    }
  }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (tiles[idx(x, y)] !== 1) continue;
    g.fillStyle = '#dcc48e'; g.fillRect(x * TS, y * TS, TS, TS);
    for (let k = 0; k < 4; k++) { g.fillStyle = R() < 0.5 ? 'rgba(120,90,50,0.25)' : 'rgba(255,240,200,0.3)'; g.beginPath(); g.arc(x * TS + R() * 32, y * TS + R() * 32, 1 + R() * 2, 0, 7); g.fill(); }
  }
  // 村中广场石板
  for (let y = 20; y <= 28; y++) for (let x = 12; x <= 19; x++) {
    g.fillStyle = (x + y) % 2 ? '#cfc2a4' : '#c6b896'; g.fillRect(x * TS + 1, y * TS + 1, TS - 2, TS - 2);
  }
  // 水
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = tiles[idx(x, y)];
    if (t !== 2 && t !== 3) continue;
    g.fillStyle = '#e2d3a2'; g.fillRect(x * TS - 4, y * TS, TS + 8, TS);
  }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = tiles[idx(x, y)];
    if (t !== 2 && t !== 3) continue;
    const grd = g.createLinearGradient(x * TS, 0, x * TS + TS, 0);
    grd.addColorStop(0, '#3d86b8'); grd.addColorStop(1, '#3478a8');
    g.fillStyle = grd; g.fillRect(x * TS, y * TS, TS, TS);
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1.5;
    for (let k = 0; k < 2; k++) { const wx = x * TS + R() * 24, wy = y * TS + R() * 30; g.beginPath(); g.moveTo(wx, wy); g.quadraticCurveTo(wx + 4, wy - 3, wx + 8, wy); g.stroke(); }
  }
  // 桥
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (tiles[idx(x, y)] !== 3) continue;
    g.fillStyle = '#8a5a32'; g.fillRect(x * TS, y * TS, TS, TS);
    g.strokeStyle = '#5e3a1e'; g.lineWidth = 2;
    for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x * TS + k * 8 + 4, y * TS); g.lineTo(x * TS + k * 8 + 4, y * TS + TS); g.stroke(); }
    if (tiles[idx(x, y - 1)] !== 3) { g.fillStyle = '#b8322a'; g.fillRect(x * TS, y * TS - 2, TS, 5); }
    if (tiles[idx(x, y + 1)] !== 3) { g.fillStyle = '#b8322a'; g.fillRect(x * TS, y * TS + TS - 3, TS, 5); }
  }
  // 花
  const fc = ['#ffb7d0', '#fff6c8', '#f3f3ff'];
  flowers.forEach(f => {
    g.fillStyle = fc[f.c];
    for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(f.x + Math.cos(k * 1.57) * 2.2, f.y + Math.sin(k * 1.57) * 2.2, 1.8, 0, 7); g.fill(); }
    g.fillStyle = '#e8a33a'; g.beginPath(); g.arc(f.x, f.y, 1.2, 0, 7); g.fill();
  });
  groundCv = c;
}

function renderTrees() {
  const palettes = [
    ['#2f6b2a', '#3f8a35', '#5aa845'], ['#2c5f2e', '#3b7d3c', '#5e9e4e'],
    ['#25502c', '#2f6a38', '#4b8a4a'], ['#3a5e2a', '#4d7a33', '#70994a'],
    ['#c45d86', '#f08ab0', '#ffc6dc'], ['#d06b8f', '#f59cbc', '#ffd6e6'],
  ];
  palettes.forEach((p, vi) => {
    const [c, g] = mkCanvas(110, 140);
    const R = seeded(vi * 13 + 5);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(55, 128, 30, 9, 0, 0, 7); g.fill();
    g.fillStyle = '#6b4526'; g.beginPath(); g.moveTo(48, 130); g.lineTo(51, 70); g.lineTo(60, 70); g.lineTo(63, 130); g.closePath(); g.fill();
    g.fillStyle = '#4e3119'; g.fillRect(56, 80, 3, 45);
    const blobs = vi >= 2 && vi <= 3 ? [[55, 30, 22], [40, 52, 24], [70, 52, 24], [55, 70, 28]] : [[55, 48, 34], [32, 62, 24], [78, 62, 24], [55, 30, 26], [55, 74, 26]];
    blobs.forEach(([x, y, r]) => { g.fillStyle = p[0]; g.beginPath(); g.arc(x, y + 3, r, 0, 7); g.fill(); });
    blobs.forEach(([x, y, r]) => { g.fillStyle = p[1]; g.beginPath(); g.arc(x - 2, y, r * 0.88, 0, 7); g.fill(); });
    for (let k = 0; k < 40; k++) { const a = R() * 7, rr = R() * 30; g.fillStyle = p[2]; g.globalAlpha = 0.7; g.beginPath(); g.arc(50 + Math.cos(a) * rr, 46 + Math.sin(a) * rr, 2 + R() * 4, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    if (vi >= 4) for (let k = 0; k < 25; k++) { g.fillStyle = '#fff'; g.globalAlpha = 0.8; g.beginPath(); g.arc(25 + R() * 60, 20 + R() * 70, 1.5, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    treeCvs.push(c);
  });
  for (let v = 0; v < 3; v++) {
    const [c, g] = mkCanvas(60, 48);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(30, 40, 24, 6, 0, 0, 7); g.fill();
    g.fillStyle = ['#8d8f93', '#7e8085', '#9a958a'][v];
    g.beginPath(); g.moveTo(8, 40); g.lineTo(12, 18 - v * 3); g.lineTo(28, 8 + v * 2); g.lineTo(46, 14); g.lineTo(54, 40); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.moveTo(14, 20); g.lineTo(28, 10); g.lineTo(34, 22); g.closePath(); g.fill();
    g.fillStyle = 'rgba(90,140,60,0.6)'; g.fillRect(10, 36, 40, 4);
    rockCvs.push(c);
  }
}

function houseCanvas(w, h, v) {
  const key = w + '_' + h + '_' + v;
  if (houseCvs[key]) return houseCvs[key];
  const pw = w * TS, wallH = h * TS + 10, roofH = 62, m = 22;
  const [c, g] = mkCanvas(pw + m * 2, wallH + roofH + 10);
  const by = c.height - 4;
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(m - 4, by - 10, pw + 8, 12);
  // 墙
  const wy = by - wallH;
  g.fillStyle = '#efe3c6'; g.fillRect(m, wy, pw, wallH);
  g.fillStyle = '#8b6b4a'; g.fillRect(m, by - 12, pw, 12);
  // 柱子
  g.fillStyle = '#b3302a';
  for (let k = 0; k <= w; k += (w > 4 ? 2 : 1.5)) { const px = m + Math.min(k * TS, pw - 8); g.fillRect(px, wy, 8, wallH - 10); }
  g.fillRect(m + pw - 8, wy, 8, wallH - 10);
  // 门
  const dx = m + pw / 2 - 16;
  g.fillStyle = '#7a2b20'; g.fillRect(dx, by - 52, 32, 42);
  g.strokeStyle = '#e1b64a'; g.lineWidth = 2; g.strokeRect(dx + 2, by - 50, 28, 40);
  g.beginPath(); g.moveTo(dx + 16, by - 50); g.lineTo(dx + 16, by - 10); g.stroke();
  // 窗
  g.strokeStyle = '#6b4a2e'; g.lineWidth = 2;
  [[m + 18, wy + 18], [m + pw - 48, wy + 18]].forEach(([x, y]) => {
    g.fillStyle = '#f7efd8'; g.fillRect(x, y, 30, 24); g.strokeRect(x, y, 30, 24);
    for (let k = 1; k < 3; k++) { g.beginPath(); g.moveTo(x + k * 10, y); g.lineTo(x + k * 10, y + 24); g.stroke(); g.beginPath(); g.moveTo(x, y + k * 8); g.lineTo(x + 30, y + k * 8); g.stroke(); }
  });
  // 屋顶（飞檐）
  const roofC = ['#4a5a6e', '#3d4e60', '#5a4e6a'][v % 3];
  const ry = wy + 6;
  g.fillStyle = roofC;
  g.beginPath();
  g.moveTo(m - 22, ry - 20);
  g.quadraticCurveTo(m - 4, ry - 4, m + 10, ry - 10);
  g.lineTo(m + pw - 10, ry - 10);
  g.quadraticCurveTo(m + pw + 4, ry - 4, m + pw + 22, ry - 20);
  g.quadraticCurveTo(m + pw, ry - 26, m + pw - 18, ry - roofH + 10);
  g.lineTo(m + 18, ry - roofH + 10);
  g.quadraticCurveTo(m, ry - 26, m - 22, ry - 20);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 2;
  for (let k = 0; k < pw + 20; k += 9) { g.beginPath(); g.moveTo(m - 6 + k, ry - 12); g.lineTo(m + 12 + k * 0.92, ry - roofH + 12); g.stroke(); }
  g.fillStyle = '#2b3542'; g.fillRect(m + 10, ry - roofH + 4, pw - 20, 9);
  g.beginPath(); g.arc(m + 12, ry - roofH + 2, 7, 0, 7); g.arc(m + pw - 12, ry - roofH + 2, 7, 0, 7); g.fill();
  g.fillStyle = '#d8a93a'; g.fillRect(m + pw / 2 - 5, ry - roofH - 4, 10, 10);
  // 牌匾
  if (v === 0 || v === 3) {
    g.fillStyle = '#2a1a10'; g.fillRect(m + pw / 2 - 30, wy + 2, 60, 18);
    g.fillStyle = '#f2c84b'; g.font = font(13, true); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(v === 0 ? '客 栈' : '杂 货', m + pw / 2, wy + 11);
  }
  const res = { cv: c, ox: m, oy: c.height - 4 };
  houseCvs[key] = res; return res;
}

function drawObj(o) {
  if (o.type === 'tree') { const c = treeCvs[o.v]; ctx.drawImage(c, o.x - 55, o.y - 128); }
  else if (o.type === 'rock') { ctx.drawImage(rockCvs[o.v], o.x - 30, o.y - 40); }
  else if (o.type === 'house') { const hc = houseCanvas(o.w, o.h, o.v); ctx.drawImage(hc.cv, o.x - hc.ox, o.y - hc.oy); }
  else if (o.type === 'fence') {
    ctx.fillStyle = '#7a5532'; ctx.strokeStyle = '#4e3219'; ctx.lineWidth = 1;
    if (o.dir === 'h') { ctx.fillRect(o.x, o.y - 18, 32, 4); ctx.fillRect(o.x, o.y - 9, 32, 4); for (let k = 0; k < 2; k++) { ctx.fillRect(o.x + 4 + k * 16, o.y - 24, 5, 24); } }
    else { ctx.fillRect(o.x + 13, o.y - 50, 6, 50); ctx.fillRect(o.x + 11, o.y - 26, 10, 26); }
  } else if (o.type === 'well') {
    shadow(o.x, o.y, 22, 8);
    ctx.fillStyle = '#8f8f8f'; ctx.beginPath(); ctx.ellipse(o.x, o.y - 10, 20, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#9d9d9d'; ctx.fillRect(o.x - 20, o.y - 22, 40, 12);
    ctx.fillStyle = '#2d4f6e'; ctx.beginPath(); ctx.ellipse(o.x, o.y - 22, 16, 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6b4526'; ctx.fillRect(o.x - 20, o.y - 56, 4, 34); ctx.fillRect(o.x + 16, o.y - 56, 4, 34);
    ctx.fillStyle = '#7a2b20'; ctx.beginPath(); ctx.moveTo(o.x - 28, o.y - 52); ctx.lineTo(o.x, o.y - 66); ctx.lineTo(o.x + 28, o.y - 52); ctx.closePath(); ctx.fill();
  } else if (o.type === 'pagoda') {
    const x = o.x + 48, y = o.y;
    shadow(x, y - 4, 52, 14);
    for (let k = 0; k < 5; k++) {
      const ww = 80 - k * 12, yy = y - 12 - k * 34;
      ctx.fillStyle = '#efe3c6'; ctx.fillRect(x - ww / 2 + 8, yy - 26, ww - 16, 26);
      ctx.fillStyle = '#b3302a'; ctx.fillRect(x - ww / 2 + 8, yy - 26, 6, 26); ctx.fillRect(x + ww / 2 - 14, yy - 26, 6, 26);
      ctx.fillStyle = '#7a2b20'; ctx.fillRect(x - 6, yy - 20, 12, 20);
      ctx.fillStyle = '#3d4e60';
      ctx.beginPath(); ctx.moveTo(x - ww / 2 - 10, yy - 22); ctx.quadraticCurveTo(x - ww / 2, yy - 30, x - ww / 2 + 10, yy - 34);
      ctx.lineTo(x + ww / 2 - 10, yy - 34); ctx.quadraticCurveTo(x + ww / 2, yy - 30, x + ww / 2 + 10, yy - 22); ctx.lineTo(x, yy - 42); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#d8a93a'; ctx.fillRect(x - 2, y - 220, 4, 36); ctx.beginPath(); ctx.arc(x, y - 222, 5, 0, 7); ctx.fill();
  }
}

// ---------------- 角色数据 ----------------
function heroStats(lv) {
  return { maxHp: 120 + 28 * (lv - 1), maxMp: 60 + 12 * (lv - 1), atk: 22 + 5 * (lv - 1), def: 8 + 3 * (lv - 1), spd: 12 + (lv - 1), mag: 20 + 5 * (lv - 1) };
}
function petStats(lv) {
  return { maxHp: 95 + 22 * (lv - 1), maxMp: 30 + 6 * (lv - 1), atk: 18 + 4 * (lv - 1), def: 6 + 2 * (lv - 1), spd: 14 + (lv - 1), mag: 10 + 2 * (lv - 1) };
}
const expNeed = lv => Math.round(40 * lv * lv + 30 * lv);
const MON = {
  tree: { name: '树妖', img: 'tree', hp: 70, atk: 14, def: 5, spd: 8, mag: 17, exp: 18, gold: 10, h: 130, skill: { name: '缠藤术', type: 'mag', pow: 1.25, fx: 'vine' } },
  boar: { name: '野猪精', img: 'boar', hp: 95, atk: 19, def: 7, spd: 10, mag: 8, exp: 24, gold: 14, h: 115, skill: { name: '野蛮冲撞', type: 'phys', pow: 1.5, fx: 'dash' } },
  fox: { name: '狐狸精', img: 'fox', hp: 85, atk: 15, def: 6, spd: 16, mag: 24, exp: 32, gold: 20, h: 120, skill: { name: '狐火', type: 'mag', pow: 1.45, fx: 'bluefire' } },
};
const SKILLS = [
  { id: 'jian', name: '剑气斩', mp: 8, desc: '单体·高伤害', target: 'enemy' },
  { id: 'fire', name: '烈火诀', mp: 18, desc: '群体·火焰', target: 'all' },
  { id: 'heal', name: '回春术', mp: 12, desc: '治疗我方一人', target: 'ally' },
];

const P = { // 玩家存档数据
  name: '逍遥生', lv: 1, exp: 0, gold: 50, potions: 3, hp: 0, mp: 0, petHp: 0, petMp: 0,
};
function resetPlayer() {
  Object.assign(P, { lv: 1, exp: 0, gold: 50, potions: 3 });
  const s = heroStats(1), ps = petStats(1);
  P.hp = s.maxHp; P.mp = s.maxMp; P.petHp = ps.maxHp; P.petMp = ps.maxMp;
}
function saveGame(quiet) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, P, x: player.x, y: player.y }));
    if (!quiet) toast('已存档');
  } catch (e) { if (!quiet) toast('存档失败（浏览器禁止了本地存储）'); }
}
function loadGame() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!d || d.v !== 1) return false;
    Object.assign(P, d.P);
    player.x = d.x; player.y = d.y;
    if (solidAtPx(player.x, player.y)) { player.x = START.x; player.y = START.y; }
    return true;
  } catch (e) { return false; }
}
const hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };

// ---------------- 寻路（A*） ----------------
function findPath(sx, sy, tx, ty) {
  if (!inMap(tx, ty)) return null;
  if (isSolid(tx, ty)) {
    let best = null, bd = 1e9;
    for (let r = 1; r <= 4 && !best; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const nx = tx + dx, ny = ty + dy;
      if (!isSolid(nx, ny) && reach[idx(nx, ny)]) { const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [nx, ny]; } }
    }
    if (!best) return null; tx = best[0]; ty = best[1];
  }
  const N = MW * MH, gS = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const heap = [];
  const push = (i, f) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  const hfn = (x, y) => { const dx = Math.abs(x - tx), dy = Math.abs(y - ty); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  const s = idx(sx, sy), t = idx(tx, ty);
  gS[s] = 0; push(s, hfn(sx, sy));
  let found = false, iter = 0;
  while (heap.length && iter++ < 20000) {
    const [, cur] = pop();
    if (cur === t) { found = true; break; }
    if (closed[cur]) continue; closed[cur] = 1;
    const cx = cur % MW, cy = (cur / MW) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (isSolid(nx, ny)) continue;
      if (dx && dy && (isSolid(cx + dx, cy) || isSolid(cx, cy + dy))) continue;
      const ni = idx(nx, ny), ng = gS[cur] + (dx && dy ? 1.414 : 1);
      if (ng < gS[ni]) { gS[ni] = ng; from[ni] = cur; push(ni, ng + hfn(nx, ny)); }
    }
  }
  if (!found) return null;
  const pts = []; let c = t;
  while (c !== -1 && c !== s) { pts.push({ x: (c % MW) * TS + 16, y: ((c / MW) | 0) * TS + 16 }); c = from[c]; }
  pts.reverse();
  return pts;
}
function lineClear(a, b) {
  const d = dist(a, b), n = Math.ceil(d / 6);
  for (let i = 0; i <= n; i++) {
    const x = a.x + (b.x - a.x) * i / n, y = a.y + (b.y - a.y) * i / n;
    if (solidAtPx(x - 9, y - 9) || solidAtPx(x + 9, y - 9) || solidAtPx(x - 9, y + 9) || solidAtPx(x + 9, y + 9)) return false;
  }
  return true;
}
function smoothPath(start, pts) {
  if (!pts || pts.length < 2) return pts;
  const out = []; let cur = start, i = 0;
  while (i < pts.length) {
    let j = pts.length - 1;
    while (j > i && !lineClear(cur, pts[j])) j--;
    out.push(pts[j]); cur = pts[j]; i = j + 1;
  }
  return out;
}

// ---------------- 地图状态 ----------------
const player = { x: START.x, y: START.y, path: [], face: 1, walkT: 0, moving: false };
const pet = { x: START.x - 40, y: START.y + 10, face: 1, walkT: 0 };
const cam = { x: 0, y: 0 };
let monsters = [], grace = 0, clickFx = null, pendingTalk = false, curZone = '', zoneBanner = 0, respawnQ = [];
let scene = 'title', dialog = null, overlayA = 0, helpOpen = false;
const toasts = [];
function toast(msg) { toasts.push({ msg, t: 2.2 }); }

function randomSpawn(zone) {
  for (let k = 0; k < 400; k++) {
    const x = ri(2, MW - 3), y = ri(2, MH - 3);
    if (zoneAt(x, y) !== zone || isSolid(x, y) || !reach[idx(x, y)]) continue;
    const px = x * TS + 16, py = y * TS + 16;
    if (Math.hypot(px - player.x, py - player.y) < 300) continue;
    if (tiles[idx(x, y)] === 3) continue;
    return { x: px, y: py };
  }
  return null;
}
function spawnMonster(zone) {
  const p = randomSpawn(zone); if (!p) return;
  const Z = ZONES[zone];
  const kind = pick(Z.pool);
  const lv = ri(Z.lv[0], Z.lv[1]);
  monsters.push({ kind, lv, zone, x: p.x, y: p.y, hx: p.x, hy: p.y, tx: p.x, ty: p.y, timer: rnd(0.5, 3), face: 1, walkT: rnd(0, 6) });
}
function initMonsters() {
  monsters = []; respawnQ = [];
  for (let i = 0; i < 8; i++) spawnMonster('wild');
  for (let i = 0; i < 7; i++) spawnMonster('mountain');
}

function onMapClick(wx, wy) {
  // 点击 NPC
  pendingTalk = false;
  if (Math.abs(wx - NPC.x) < 30 && wy > NPC.y - 90 && wy < NPC.y + 10) {
    if (dist(player, NPC) < 70) { openNpc(); return; }
    pendingTalk = true; wx = NPC.x; wy = NPC.y + 34;
  }
  const sx = Math.floor(player.x / TS), sy = Math.floor(player.y / TS);
  const path = findPath(sx, sy, Math.floor(wx / TS), Math.floor(wy / TS));
  if (!path) { clickFx = { x: wx, y: wy, t: 0.6, bad: true }; return; }
  // 终点使用精确点击位置（若可行走）
  if (path.length && !solidAtPx(wx, wy) && Math.floor(wx / TS) === Math.floor(path[path.length - 1].x / TS) && Math.floor(wy / TS) === Math.floor(path[path.length - 1].y / TS)) path[path.length - 1] = { x: wx, y: wy };
  player.path = smoothPath({ x: player.x, y: player.y }, path) || [];
  const end = player.path[player.path.length - 1] || { x: wx, y: wy };
  clickFx = { x: end.x, y: end.y, t: 0.6 };
  sfx('click');
}

function updateMap(dt) {
  // 玩家移动
  const SPD = 210;
  player.moving = false;
  if (player.path.length) {
    const tg = player.path[0];
    const dx = tg.x - player.x, dy = tg.y - player.y, d = Math.hypot(dx, dy);
    const step = SPD * dt;
    if (d <= step) { player.x = tg.x; player.y = tg.y; player.path.shift(); }
    else { player.x += dx / d * step; player.y += dy / d * step; }
    if (Math.abs(dx) > 2) player.face = dx > 0 ? 1 : -1;
    player.moving = true; player.walkT += dt;
  } else if (pendingTalk && dist(player, NPC) < 80) { pendingTalk = false; openNpc(); }
  // 宠物跟随
  const pd = dist(pet, player);
  if (pd > 55) {
    const sp = Math.min(260, pd * 3.2) * dt;
    pet.x += (player.x - pet.x) / pd * sp; pet.y += (player.y - pet.y) / pd * sp;
    pet.face = player.x > pet.x ? 1 : -1; pet.walkT += dt;
  }
  // 区域
  const z = zoneAt(Math.floor(player.x / TS), Math.floor(player.y / TS));
  if (z !== curZone) { curZone = z; zoneBanner = 2.5; }
  if (zoneBanner > 0) zoneBanner -= dt;
  if (grace > 0) grace -= dt;
  // 怪物
  for (const m of monsters) {
    const dP = dist(m, player);
    const pz = zoneAt(Math.floor(player.x / TS), Math.floor(player.y / TS));
    let tx = m.tx, ty = m.ty, sp = 45;
    if (dP < 170 && grace <= 0 && pz !== 'village') { tx = player.x; ty = player.y; sp = 88; }
    else {
      m.timer -= dt;
      if (m.timer <= 0) {
        m.timer = rnd(1.5, 4);
        const nx = m.hx + rnd(-90, 90), ny = m.hy + rnd(-90, 90);
        if (!solidAtPx(nx, ny)) { m.tx = nx; m.ty = ny; }
      }
      tx = m.tx; ty = m.ty;
    }
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
    if (d > 3) {
      const nx = m.x + dx / d * sp * dt, ny = m.y + dy / d * sp * dt;
      const ok = (x, y) => !solidAtPx(x, y) && zoneAt(Math.floor(x / TS), Math.floor(y / TS)) !== 'village';
      if (ok(nx, ny)) { m.x = nx; m.y = ny; } else if (ok(nx, m.y)) m.x = nx; else if (ok(m.x, ny)) m.y = ny; else m.timer = 0;
      if (Math.abs(dx) > 1) m.face = dx > 0 ? 1 : -1;
      m.walkT += dt;
    }
    if (dP < 34 && grace <= 0) { startBattle(m); return; }
  }
  // 刷新
  for (let i = respawnQ.length - 1; i >= 0; i--) { respawnQ[i].t -= dt; if (respawnQ[i].t <= 0) { spawnMonster(respawnQ[i].zone); respawnQ.splice(i, 1); } }
  // 镜头
  const tcx = clamp(player.x - W / 2, 0, MW * TS - W), tcy = clamp(player.y - H / 2, 0, MH * TS - H);
  cam.x += (tcx - cam.x) * Math.min(1, dt * 6); cam.y += (tcy - cam.y) * Math.min(1, dt * 6);
  if (clickFx) { clickFx.t -= dt; if (clickFx.t <= 0) clickFx = null; }
}

let timeAcc = 0;
function drawMap() {
  const cx = Math.round(cam.x), cy = Math.round(cam.y);
  ctx.drawImage(groundCv, cx, cy, W, H, 0, 0, W, H);
  ctx.save(); ctx.translate(-cx, cy * -1);
  // 水面波光
  const x0 = Math.floor(cx / TS), y0 = Math.floor(cy / TS);
  for (let y = y0; y <= y0 + H / TS + 1; y++) for (let x = x0; x <= x0 + W / TS + 1; x++) {
    if (!inMap(x, y) || tiles[idx(x, y)] !== 2) continue;
    const a = 0.12 + 0.12 * Math.sin(timeAcc * 2 + x * 1.3 + y * 0.7);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x * TS + 6 + Math.sin(timeAcc + y) * 4, y * TS + 14, 12, 2);
  }
  // 点击标记
  if (clickFx) {
    const p = 1 - clickFx.t / 0.6;
    ctx.strokeStyle = clickFx.bad ? 'rgba(255,80,80,' + (1 - p) + ')' : 'rgba(255,230,120,' + (1 - p) + ')';
    ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(clickFx.x, clickFx.y, 6 + p * 18, (6 + p * 18) * 0.5, 0, 0, 7); ctx.stroke();
  }
  // 深度排序绘制
  const list = [];
  const vis = (x, y, m) => x > cx - m && x < cx + W + m && y > cy - 40 && y < cy + H + 260;
  for (const o of objs) if (vis(o.x, o.base, 260)) list.push({ y: o.base, d: () => drawObj(o) });
  for (const m of monsters) if (vis(m.x, m.y, 80)) list.push({ y: m.y, d: () => drawMapMonster(m) });
  list.push({ y: NPC.y, d: drawMapNpc });
  list.push({ y: pet.y, d: () => { shadow(pet.x, pet.y, 18); drawSprite('pet', pet.x, pet.y - Math.abs(Math.sin(pet.walkT * 9)) * 4, 46, pet.face < 0); } });
  list.push({ y: player.y, d: drawMapPlayer });
  list.sort((a, b) => a.y - b.y);
  list.forEach(e => e.d());
  ctx.restore();
}
function nameTag(text, x, y, color) {
  ctx.font = font(14, true); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.strokeText(text, x, y);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
}
function drawMapPlayer() {
  const bob = player.moving ? Math.abs(Math.sin(player.walkT * 10)) * 4 : Math.sin(timeAcc * 2) * 1;
  shadow(player.x, player.y, 20);
  drawSprite('hero', player.x, player.y - bob, 78, player.face > 0);
  nameTag(P.name, player.x, player.y - 82, '#7cff8a');
}
function drawMapNpc() {
  shadow(NPC.x, NPC.y, 20);
  drawSprite('npc', NPC.x, NPC.y, 74, false);
  nameTag(NPC.name, NPC.x, NPC.y - 78, '#ffd75a');
  // 头顶提示
  const b = Math.sin(timeAcc * 4) * 3;
  ctx.fillStyle = '#ffe680'; ctx.font = font(20, true); ctx.textAlign = 'center';
  ctx.fillText('！', NPC.x, NPC.y - 100 + b);
}
function drawMapMonster(m) {
  const M = MON[m.kind];
  const bob = Math.abs(Math.sin(m.walkT * 7)) * 3;
  shadow(m.x, m.y, 18);
  drawSprite(M.img, m.x, m.y - bob, M.h * 0.45, m.face > 0);
  nameTag(M.name + ' Lv' + m.lv, m.x, m.y - M.h * 0.45 - 4, m.lv > P.lv + 1 ? '#ff7a7a' : '#ffffff');
}

// ---------------- UI 组件 ----------------
let buttons = [];
let mouse = { x: -1, y: -1 };
function panel(x, y, w, h, alpha) {
  ctx.save();
  ctx.fillStyle = `rgba(40,24,14,${alpha == null ? 0.82 : alpha})`;
  ctx.strokeStyle = '#d9a94a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 10) : ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,220,140,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 7) : ctx.rect(x + 4, y + 4, w - 8, h - 8); ctx.stroke();
  ctx.restore();
}
function button(x, y, w, h, label, cb, opt) {
  opt = opt || {};
  const hover = mouse.x >= x && mouse.x <= x + w && mouse.y >= y && mouse.y <= y + h && !opt.disabled;
  ctx.save();
  const grd = ctx.createLinearGradient(0, y, 0, y + h);
  if (opt.disabled) { grd.addColorStop(0, '#6b6259'); grd.addColorStop(1, '#4b443d'); }
  else if (opt.active) { grd.addColorStop(0, '#f4c35a'); grd.addColorStop(1, '#c4822a'); }
  else if (hover) { grd.addColorStop(0, '#d0503c'); grd.addColorStop(1, '#8e2618'); }
  else { grd.addColorStop(0, '#a83a28'); grd.addColorStop(1, '#6e1d12'); }
  ctx.fillStyle = grd; ctx.strokeStyle = '#f1c86a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 8) : ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
  ctx.fillStyle = opt.disabled ? '#b8b0a6' : '#fff6dc';
  ctx.font = font(opt.size || 18, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  if (opt.sub) { ctx.font = font(12); ctx.fillStyle = '#ffe2a8'; ctx.fillText(opt.sub, x + w / 2, y + h - 10); }
  ctx.restore();
  if (!opt.disabled) buttons.push({ x, y, w, h, cb, label });
}
function bar(x, y, w, h, v, max, c1, c2, text) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, y, w, h);
  const p = clamp(v / max, 0, 1);
  const grd = ctx.createLinearGradient(0, y, 0, y + h); grd.addColorStop(0, c1); grd.addColorStop(1, c2);
  ctx.fillStyle = grd; ctx.fillRect(x + 1, y + 1, (w - 2) * p, h - 2);
  ctx.strokeStyle = 'rgba(255,230,170,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (text) { ctx.fillStyle = '#fff'; ctx.font = font(Math.max(10, h - 3), true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + w / 2, y + h / 2 + 1); }
}
function text(s, x, y, sz, color, align, bold, stroke) {
  ctx.font = font(sz, bold); ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = color || '#fff'; ctx.fillText(s, x, y);
}
function wrapText(s, x, y, maxW, lh, sz, color) {
  ctx.font = font(sz); let line = '', yy = y;
  for (const ch of s) {
    if (ch === '\n') { text(line, x, yy, sz, color); line = ''; yy += lh; continue; }
    if (ctx.measureText(line + ch).width > maxW) { text(line, x, yy, sz, color); line = ch; yy += lh; }
    else line += ch;
  }
  if (line) text(line, x, yy, sz, color);
}
function portrait(key, cx, cy, r) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fillStyle = '#f3e2b8'; ctx.fill(); ctx.clip();
  const im = getSprite(key);
  // 头像裁切区域（相对图片比例）
  const crop = { hero: [0.22, 0.0, 0.58, 0.54], npc: [0.2, 0.0, 0.62, 0.56] }[key] || [0, 0, 1, 0.6];
  const sx = crop[0] * im.width, sy = crop[1] * im.height, sw = crop[2] * im.width, sh = crop[3] * im.height;
  const sc = (r * 2.1) / sw;
  ctx.drawImage(im, sx, sy, sw, sh, cx - sw * sc / 2, cy - r * 1.05, sw * sc, sh * sc);
  ctx.restore();
  ctx.strokeStyle = '#e8b54d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
}

// ---------------- 地图 HUD ----------------
function drawHUD() {
  const s = heroStats(P.lv), ps = petStats(P.lv);
  panel(10, 10, 330, 150);
  portrait('hero', 62, 66, 40);
  text(P.name, 112, 30, 18, '#ffe9a8', 'left', true);
  text('等级 ' + P.lv, 250, 30, 16, '#fff', 'left', true);
  text('气血', 112, 56, 13, '#ffb0a0'); bar(146, 48, 180, 16, P.hp, s.maxHp, '#ff6a5a', '#b3241a', P.hp + '/' + s.maxHp);
  text('魔法', 112, 78, 13, '#a8c8ff'); bar(146, 70, 180, 16, P.mp, s.maxMp, '#6aa8ff', '#1f4fb3', P.mp + '/' + s.maxMp);
  text('经验', 112, 100, 13, '#ffe7a0'); bar(146, 92, 180, 16, P.exp, expNeed(P.lv), '#ffe066', '#c08a12', P.exp + '/' + expNeed(P.lv));
  text('金钱 ' + P.gold + ' 两', 26, 132, 15, '#ffd75a', 'left', true);
  text('金创药 ×' + P.potions, 150, 132, 15, '#bff5a8', 'left', true);
  text('小白虎 ' + P.petHp + '/' + ps.maxHp, 250, 132, 13, '#d6ecff', 'left');
  // 小地图
  const mx = W - 210, my = 10, mw = 200, mh = 150;
  panel(mx - 4, my, mw + 8, mh + 30);
  const sc = mw / (MW * TS);
  ctx.drawImage(groundCv, 0, 0, MW * TS, MH * TS, mx, my + 26, mw, mh);
  text(ZONES[curZone || 'village'].name, mx + mw / 2, my + 14, 15, '#ffe9a8', 'center', true);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.strokeRect(mx + cam.x * sc, my + 26 + cam.y * sc, W * sc, H * sc);
  for (const m of monsters) { ctx.fillStyle = '#ff5050'; ctx.fillRect(mx + m.x * sc - 1.5, my + 26 + m.y * sc - 1.5, 3, 3); }
  ctx.fillStyle = '#ffd75a'; ctx.beginPath(); ctx.arc(mx + NPC.x * sc, my + 26 + NPC.y * sc, 3, 0, 7); ctx.fill();
  ctx.fillStyle = '#5aff7a'; ctx.beginPath(); ctx.arc(mx + player.x * sc, my + 26 + player.y * sc, 4, 0, 7); ctx.fill();
  // 按钮
  button(W - 210, 196, 64, 34, '存档', () => saveGame(), { size: 15 });
  button(W - 140, 196, 64, 34, '帮助', () => { helpOpen = true; }, { size: 15 });
  button(W - 70, 196, 64, 34, muted ? '静音' : '音效', () => { muted = !muted; }, { size: 15 });
  // 区域横幅
  if (zoneBanner > 0) {
    const a = clamp(zoneBanner, 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    const grd = ctx.createLinearGradient(W / 2 - 220, 0, W / 2 + 220, 0);
    grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.5, 'rgba(30,15,5,0.75)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd; ctx.fillRect(W / 2 - 220, 92, 440, 56);
    text(ZONES[curZone].name, W / 2, 120, 30, '#ffe39a', 'center', true, true);
    ctx.restore();
  }
  // 底部提示
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, H - 30, W, 30);
  text('点击地面移动 · 碰到野外怪物进入战斗 · 点击村中的孙大夫可疗伤、买药 · 进度自动保存', W / 2, H - 15, 14, '#f5e6c4', 'center');
}

function drawToasts(dt) {
  for (let i = toasts.length - 1; i >= 0; i--) { toasts[i].t -= dt; if (toasts[i].t <= 0) toasts.splice(i, 1); }
  toasts.forEach((t, i) => {
    ctx.save(); ctx.globalAlpha = clamp(t.t, 0, 1);
    const w = Math.max(200, t.msg.length * 18 + 40);
    panel(W / 2 - w / 2, 200 + i * 46, w, 38, 0.85);
    text(t.msg, W / 2, 219 + i * 46, 17, '#fff2c8', 'center', true);
    ctx.restore();
  });
}

// ---------------- NPC 对话 ----------------
function openNpc() {
  player.path = [];
  dialog = { msg: '老夫孙大夫，在桃源村行医多年。少侠若是受了伤，尽管来找我。外面的树妖、野猪精最近闹得凶，可要小心啊！' };
  sfx('click');
}
function drawDialog() {
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
  const x = 190, y = 410, w = 900, h = 250;
  panel(x, y, w, h, 0.92);
  portrait('npc', x + 90, y + 100, 66);
  text(NPC.name, x + 90, y + 196, 20, '#ffd75a', 'center', true);
  wrapText(dialog.msg, x + 190, y + 40, 670, 30, 19, '#fff4dc');
  const s = heroStats(P.lv), ps = petStats(P.lv);
  const bx = x + 190, by = y + 170;
  button(bx, by, 190, 48, '治疗（免费）', () => {
    P.hp = s.maxHp; P.mp = s.maxMp; P.petHp = ps.maxHp; P.petMp = ps.maxMp; sfx('heal');
    dialog.msg = '好了好了，气血和魔法都已恢复，连你的小白虎也精神抖擞了。'; saveGame(true);
  });
  button(bx + 210, by, 230, 48, '购买金创药（20两）', () => {
    if (P.gold < 20) { dialog.msg = '少侠，你的银两不够啊……去野外打些妖怪再来吧。'; return; }
    P.gold -= 20; P.potions++; sfx('coin');
    dialog.msg = '这瓶金创药你收好，战斗中可恢复 150 点气血。（现有 ' + P.potions + ' 瓶）'; saveGame(true);
  });
  button(bx + 460, by, 150, 48, '告辞', () => { dialog = null; });
}
function drawHelp() {
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
  panel(240, 110, 800, 500, 0.94);
  text('游戏说明', W / 2, 150, 28, '#ffe39a', 'center', true);
  const lines = [
    '· 点击地面：角色自动寻路走过去，镜头跟随。',
    '· 桃源村内是安全区。出了村，树妖、野猪精、狐狸精会追你，碰到即开战。',
    '· 河东的「落霞山」怪物更强（等级 3~5），奖励也更多，建议 3 级以后再去。',
    '· 战斗为回合制：选择 攻击 / 法术 / 道具 / 防御 / 逃跑，然后点选目标。',
    '· 法术：剑气斩（单体高伤）、烈火诀（群体）、回春术（治疗）。消耗魔法。',
    '· 小白虎是你的召唤兽，会自动帮你战斗。',
    '· 胜利获得经验和金钱，升级后各项属性提升并回满状态。',
    '· 战败会被送回桃源村并损失少量金钱。',
    '· 村中孙大夫可免费治疗，也可花 20 两买金创药。',
    '· 进度自动保存在本浏览器中（也可点「存档」手动保存）。',
  ];
  lines.forEach((l, i) => text(l, 290, 200 + i * 34, 18, '#fff4dc'));
  button(W / 2 - 160, 548, 150, 44, '知道了', () => { helpOpen = false; });
  button(W / 2 + 10, 548, 150, 44, '重新开始', () => {
    if (!confirm('确定要删除存档、重新开始吗？')) return;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    newGame(); helpOpen = false;
  });
}

// ---------------- 标题 ----------------
function drawTitle() {
  if (IMG.bbg) { ctx.drawImage(IMG.bbg, 0, 0, W, H); } else { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f3d9b5'); g.addColorStop(1, '#7fb85a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = 'rgba(20,10,0,0.35)'; ctx.fillRect(0, 0, W, H);
  const b = Math.sin(timeAcc * 1.5) * 4;
  text('梦幻小西游', W / 2, 190 + b, 86, '#ffe39a', 'center', true, true);
  text('—— 桃源村奇遇 ——', W / 2, 270, 26, '#fff4dc', 'center', true, true);
  drawSprite('hero', W / 2 - 300, 560, 260, true);
  drawSprite('pet', W / 2 + 300, 560, 160, true);
  const has = hasSave();
  if (has) button(W / 2 - 110, 360, 220, 58, '继续游戏', () => startGame(true), { size: 22 });
  button(W / 2 - 110, has ? 436 : 380, 220, 58, '新的旅程', () => { if (has && !confirm('开始新游戏会覆盖原有存档，确定吗？')) return; startGame(false); }, { size: 22 });
  text('单机版 · 点击开始', W / 2, H - 30, 15, '#fff4dc', 'center', false, true);
}
function newGame() {
  resetPlayer(); player.x = START.x; player.y = START.y; player.path = [];
  pet.x = player.x - 40; pet.y = player.y + 10; initMonsters(); saveGame(true);
}
function startGame(cont) {
  sfx('click');
  if (cont && loadGame()) { pet.x = player.x - 40; pet.y = player.y + 10; initMonsters(); }
  else newGame();
  cam.x = clamp(player.x - W / 2, 0, MW * TS - W); cam.y = clamp(player.y - H / 2, 0, MH * TS - H);
  scene = 'map'; curZone = ''; toast(cont ? '欢迎回来，' + P.name + '！' : '少侠，欢迎来到桃源村！');
}

// ---------------- 战斗 ----------------
let B = null;
const popups = [], parts = [];
function popup(x, y, s, color, size) { popups.push({ x, y, s, color, size: size || 30, t: 0 }); }
function burst(x, y, n, color, opt) {
  opt = opt || {};
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), sp = rnd(opt.min || 60, opt.max || 260);
    parts.push({ x: x + rnd(-10, 10), y: y + rnd(-10, 10), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp + (opt.up || 0), life: rnd(0.4, opt.life || 0.9), t: 0, color: typeof color === 'function' ? color() : color, size: rnd(opt.smin || 3, opt.smax || 7), g: opt.g == null ? 200 : opt.g });
  }
}
function makeUnit(o) {
  return Object.assign({ ox: 0, oy: 0, flash: 0, shake: 0, alpha: 1, defending: false, alive: true, action: null, rot: 0 }, o);
}
const EPOS = [[330, 430], [190, 330], [210, 560]];
function startBattle(mon) {
  if (scene !== 'map') return;
  scene = 'trans'; player.path = []; pendingTalk = false; sfx('enc');
  const Z = ZONES[mon.zone];
  const maxN = P.lv >= 2 ? 3 : 2;
  const n = ri(1, maxN);
  const enemies = [];
  for (let i = 0; i < n; i++) {
    const kind = i === 0 ? mon.kind : pick(Z.pool);
    const lv = i === 0 ? mon.lv : ri(Z.lv[0], Z.lv[1]);
    const M = MON[kind], f = 1 + 0.2 * (lv - 1);
    const hp = Math.round(M.hp * f);
    enemies.push(makeUnit({ side: 'e', kind, name: M.name, lv, img: M.img, h: M.h, hp, maxHp: hp, mp: 99, maxMp: 99,
      atk: Math.round(M.atk * f), def: Math.round(M.def * f), spd: Math.round(M.spd * f), mag: Math.round(M.mag * f),
      exp: Math.round(M.exp * f), gold: Math.round(M.gold * f), skill: M.skill, x: EPOS[i][0], y: EPOS[i][1], flip: true }));
  }
  const s = heroStats(P.lv), ps = petStats(P.lv);
  const hero = makeUnit({ side: 'p', name: P.name, img: 'hero', h: 175, hp: P.hp, mp: P.mp, ...s, x: 900, y: 470, flip: false, isHero: true });
  const pt = makeUnit({ side: 'p', name: '小白虎', img: 'pet', h: 110, hp: P.petHp, mp: P.petMp, ...ps, x: 1000, y: 600, flip: true, isPet: true });
  if (pt.hp <= 0) { pt.hp = 0; pt.alive = false; pt.alpha = 0.5; }
  B = { mon, enemies, party: [hero, pt], hero, pet: pt, phase: 'intro', round: 0, log: [], pending: null, auto: false, result: null, prompt: '' };
  (async () => {
    await tween(450, p => { overlayA = p; });
    scene = 'battle';
    await tween(450, p => { overlayA = 1 - p; });
    overlayA = 0;
    addLog('遭遇了 ' + enemies.map(e => e.name).join('、') + '！');
    newRound();
  })();
}
function addLog(s) { B.log.push(s); if (B.log.length > 4) B.log.shift(); }
const aliveE = () => B.enemies.filter(e => e.alive);
const aliveP = () => B.party.filter(e => e.alive);
function newRound() {
  B.round++;
  B.party.concat(B.enemies).forEach(u => { u.defending = false; u.action = null; });
  B.phase = 'command'; B.pending = null; B.prompt = '第 ' + B.round + ' 回合 · 请下达指令';
  if (B.auto) { autoHero(); runRound(); }
}
function autoHero() {
  const h = B.hero, en = aliveE();
  if (h.hp < h.maxHp * 0.35 && P.potions > 0) h.action = { type: 'item', target: h };
  else if (en.length >= 2 && h.mp >= 18) h.action = { type: 'skill', skill: SKILLS[1] };
  else if (h.mp >= 8 && Math.random() < 0.5) h.action = { type: 'skill', skill: SKILLS[0], target: en.sort((a, b) => a.hp - b.hp)[0] };
  else h.action = { type: 'attack', target: en.sort((a, b) => a.hp - b.hp)[0] };
}
function chooseCmd(cmd) {
  if (!B || B.phase !== 'command' && B.phase !== 'target' && B.phase !== 'skill' && B.phase !== 'item') return;
  sfx('click');
  const h = B.hero;
  if (cmd === 'attack') { B.pending = { type: 'attack' }; B.phase = 'target'; B.prompt = '请选择攻击目标'; }
  else if (cmd === 'skill') { B.phase = 'skill'; B.prompt = '请选择法术'; }
  else if (cmd === 'item') { B.phase = 'item'; B.prompt = '请选择道具'; }
  else if (cmd === 'defend') { h.action = { type: 'defend' }; h.defending = true; runRound(); }
  else if (cmd === 'flee') { tryFlee(); }
  else if (cmd === 'auto') { B.auto = true; autoHero(); runRound(); }
}
function chooseSkill(sk) {
  sfx('click');
  if (sk.target === 'all') { B.hero.action = { type: 'skill', skill: sk }; runRound(); return; }
  B.pending = { type: 'skill', skill: sk }; B.phase = 'target';
  B.prompt = sk.target === 'ally' ? '请选择治疗对象' : '请选择法术目标';
}
function chooseTarget(u) {
  if (!B.pending) return;
  const wantAlly = (B.pending.type === 'item') || (B.pending.type === 'skill' && B.pending.skill.target === 'ally');
  if (wantAlly !== (u.side === 'p') || !u.alive) return;
  B.hero.action = Object.assign({}, B.pending, { target: u });
  runRound();
}
async function tryFlee() {
  B.phase = 'anim'; B.prompt = '';
  const avg = aliveE().reduce((s, e) => s + e.spd, 0) / aliveE().length;
  const ch = clamp(0.6 + (B.hero.spd - avg) * 0.03, 0.3, 0.95);
  addLog(P.name + ' 试图逃跑……');
  await tween(400, p => { B.hero.ox = p * 60; });
  if (Math.random() < ch) {
    addLog('逃跑成功！');
    await tween(300, p => { B.hero.ox = 60 + p * 300; B.hero.alpha = 1 - p; });
    endBattle('flee'); return;
  }
  await tween(250, p => { B.hero.ox = 60 * (1 - p); });
  popup(B.hero.x, B.hero.y - B.hero.h, '逃跑失败', '#ffb0a0', 24);
  addLog('逃跑失败！');
  B.hero.action = { type: 'none' };
  runRound();
}

async function runRound() {
  B.phase = 'anim'; B.prompt = '';
  // 宠物 AI
  const pt = B.pet;
  if (pt.alive) {
    const en = aliveE();
    if (pt.mp >= 10 && Math.random() < 0.3) pt.action = { type: 'petskill', target: pick(en) };
    else pt.action = { type: 'attack', target: en.sort((a, b) => a.hp - b.hp)[0] };
  }
  // 敌人 AI
  for (const e of aliveE()) {
    const tg = (B.pet.alive && Math.random() < 0.35) ? B.pet : B.hero;
    e.action = Math.random() < 0.3 ? { type: 'eskill', target: tg } : { type: 'attack', target: tg };
  }
  const order = B.party.concat(B.enemies).filter(u => u.alive).map(u => ({ u, k: u.spd * rnd(0.85, 1.15) + (u.action && u.action.type === 'defend' ? 999 : 0) })).sort((a, b) => b.k - a.k).map(o => o.u);
  for (const u of order) {
    if (!u.alive || !u.action) continue;
    await perform(u);
    if (!aliveE().length) { await wait(300); return victory(); }
    if (!B.hero.alive) { await wait(400); return defeat(); }
    await wait(120);
  }
  await wait(200);
  newRound();
}
function calcDmg(att, def, pow, type) {
  let base = type === 'mag' ? att.mag * pow - def.def * 0.3 : att.atk * pow - def.def * 0.6;
  base *= rnd(0.9, 1.1);
  let crit = Math.random() < 0.1;
  if (crit) base *= 1.6;
  if (def.defending) base *= 0.5;
  return { dmg: Math.max(1, Math.round(base)), crit };
}
function hurt(u, dmg, crit) {
  u.hp = Math.max(0, u.hp - dmg);
  u.flash = 0.25; u.shake = 0.3;
  popup(u.x + rnd(-10, 10), u.y - u.h * 0.6, (crit ? '暴击 ' : '') + '-' + dmg, crit ? '#ffcf3a' : '#ff5a4a', crit ? 38 : 30);
  burst(u.x, u.y - u.h * 0.45, crit ? 18 : 10, crit ? '#ffd75a' : '#fff1c0', { g: 300 });
  sfx(crit ? 'crit' : 'hit');
  if (u.hp <= 0) {
    u.alive = false;
    addLog(u.name + ' 倒下了！');
    if (u.side === 'e') tween(500, p => { u.alpha = 1 - p; u.oy = -p * 20; });
    else tween(400, p => { u.alpha = 1 - p * 0.5; u.rot = p * (u.isPet ? 1.2 : -1.2); });
  }
}
function heal(u, amt) {
  const before = u.hp; u.hp = Math.min(u.maxHp, u.hp + amt);
  popup(u.x, u.y - u.h * 0.6, '+' + (u.hp - before), '#6dff8a', 30);
  burst(u.x, u.y - u.h * 0.4, 22, () => pick(['#8dff9a', '#d8ffb0', '#ffffff']), { up: -120, g: -80, min: 20, max: 90, life: 1.2 });
  sfx('heal');
}
function retarget(u, side) {
  if (u && u.alive) return u;
  const pool = side === 'e' ? aliveE() : aliveP();
  return pool.length ? pick(pool) : null;
}
async function dashTo(u, t) {
  const dir = u.side === 'p' ? 1 : -1;
  const tx = t.x + dir * (t.side === 'e' ? 110 : 90) - u.x, ty = t.y + 10 - u.y;
  await tween(240, p => { u.ox = tx * p; u.oy = ty * p; }, easeOut);
}
async function dashBack(u) {
  const sx = u.ox, sy = u.oy;
  await tween(240, p => { u.ox = sx * (1 - p); u.oy = sy * (1 - p); });
}
async function perform(u) {
  const a = u.action;
  if (a.type === 'none') return;
  if (a.type === 'defend') { popup(u.x, u.y - u.h, '防御', '#9ad0ff', 26); addLog(u.name + ' 进入防御姿态'); await wait(350); return; }
  if (a.type === 'attack') {
    const t = retarget(a.target, u.side === 'p' ? 'e' : 'p'); if (!t) return;
    await dashTo(u, t);
    if (Math.random() < 0.05) { popup(t.x, t.y - t.h * 0.6, '闪避', '#ffffff', 26); addLog(t.name + ' 闪开了 ' + u.name + ' 的攻击'); }
    else { const r = calcDmg(u, t, 1, 'phys'); slashFx(t, '#ffffff'); hurt(t, r.dmg, r.crit); addLog(u.name + ' 攻击 ' + t.name + '，造成 ' + r.dmg + ' 点伤害'); }
    await wait(180); await dashBack(u); return;
  }
  if (a.type === 'item') {
    if (P.potions <= 0) { addLog('金创药用完了！'); return; }
    const t = a.target && a.target.alive ? a.target : u;
    P.potions--;
    await tween(200, p => { u.oy = -12 * Math.sin(p * Math.PI); });
    heal(t, 150); addLog(u.name + ' 使用金创药，' + t.name + ' 恢复气血'); await wait(400); return;
  }
  if (a.type === 'skill') {
    const sk = a.skill;
    if (u.mp < sk.mp) { addLog('魔法不足，' + sk.name + ' 施放失败'); popup(u.x, u.y - u.h, '魔法不足', '#9ad0ff', 24); await wait(400); return; }
    u.mp -= sk.mp;
    popup(u.x, u.y - u.h - 10, sk.name, '#ffe39a', 30);
    await castFx(u);
    if (sk.id === 'jian') {
      const t = retarget(a.target, 'e'); if (!t) return;
      await swordWave(u, t);
      const r = calcDmg({ mag: u.mag + u.atk * 0.5 }, t, 1.5, 'mag'); hurt(t, r.dmg, r.crit);
      addLog(u.name + ' 施展剑气斩，' + t.name + ' 受到 ' + r.dmg + ' 点伤害');
    } else if (sk.id === 'fire') {
      const ts = aliveE();
      ts.forEach(t => fireFx(t, ['#ff6a1a', '#ffb02e', '#ffe066']));
      sfx('fire'); await wait(450);
      ts.forEach(t => { const r = calcDmg(u, t, 1.05, 'mag'); hurt(t, r.dmg, r.crit); });
      addLog(u.name + ' 施展烈火诀，烈焰席卷全体敌人！');
    } else if (sk.id === 'heal') {
      const t = a.target && a.target.alive ? a.target : u;
      heal(t, Math.round(u.mag * 2.2 + 30)); addLog(u.name + ' 施展回春术，' + t.name + ' 恢复气血');
    }
    await wait(450); return;
  }
  if (a.type === 'petskill') {
    const t = retarget(a.target, 'e'); if (!t) return;
    u.mp -= 10; popup(u.x, u.y - u.h - 10, '虎啸', '#ffe39a', 28);
    await dashTo(u, t);
    clawFx(t);
    const r = calcDmg(u, t, 1.5, 'phys'); hurt(t, r.dmg, r.crit); addLog('小白虎使出虎啸，' + t.name + ' 受到 ' + r.dmg + ' 点伤害');
    await wait(180); await dashBack(u); return;
  }
  if (a.type === 'eskill') {
    const t = retarget(a.target, 'p'); if (!t) return;
    const sk = u.skill;
    popup(u.x, u.y - u.h - 10, sk.name, '#ffb0ff', 28);
    if (sk.fx === 'dash') {
      await wait(200); await tween(200, p => { u.ox = (t.x - 110 - u.x) * p; u.oy = (t.y + 10 - u.y) * p; }, easeOut);
      const r = calcDmg(u, t, sk.pow, 'phys'); hurt(t, r.dmg, r.crit); addLog(u.name + ' 使出' + sk.name + '，' + t.name + ' 受到 ' + r.dmg + ' 点伤害');
      await wait(150); await dashBack(u);
    } else {
      await castFx(u);
      if (sk.fx === 'vine') vineFx(t); else fireFx(t, ['#3a8bff', '#7ad0ff', '#e0f6ff']);
      sfx('magic'); await wait(400);
      const r = calcDmg(u, t, sk.pow, 'mag'); hurt(t, r.dmg, r.crit); addLog(u.name + ' 施展' + sk.name + '，' + t.name + ' 受到 ' + r.dmg + ' 点伤害');
      await wait(300);
    }
  }
}
// 特效
async function castFx(u) {
  sfx('magic');
  for (let i = 0; i < 3; i++) burst(u.x, u.y - 10, 8, u.side === 'p' ? '#ffe39a' : '#d6a0ff', { up: -200, g: -100, min: 30, max: 80, life: 0.7 });
  await tween(350, p => { u.oy = -10 * Math.sin(p * Math.PI); });
}
function slashFx(t, color) {
  parts.push({ slash: true, x: t.x, y: t.y - t.h * 0.5, t: 0, life: 0.25, color, ang: rnd(-0.9, -0.5) });
}
async function swordWave(u, t) {
  const sx = u.x - 40, sy = u.y - u.h * 0.5, ex = t.x, ey = t.y - t.h * 0.5;
  const wv = { wave: true, x: sx, y: sy, t: 0, life: 9, color: '#9ae6ff' };
  parts.push(wv);
  await tween(300, p => { wv.x = sx + (ex - sx) * p; wv.y = sy + (ey - sy) * p; }, linear);
  wv.life = 0;
  slashFx(t, '#9ae6ff'); slashFx(t, '#ffffff');
}
function fireFx(t, cols) {
  for (let k = 0; k < 4; k++) setTimeout(() => burst(t.x, t.y - 20, 12, () => pick(cols), { up: -260, g: -200, min: 20, max: 110, life: 0.8, smin: 5, smax: 12 }), k * 90);
}
function vineFx(t) { for (let k = 0; k < 3; k++) setTimeout(() => burst(t.x, t.y, 14, () => pick(['#3f8a35', '#7ac84a', '#2d5a1e']), { up: -220, g: 50, min: 40, max: 140, life: 0.8 }), k * 100); }
function clawFx(t) { for (let k = 0; k < 3; k++) parts.push({ slash: true, x: t.x - 20 + k * 18, y: t.y - t.h * 0.5, t: 0, life: 0.3, color: '#bfe4ff', ang: -1.1 }); }

async function victory() {
  sfx('win');
  const exp = B.enemies.reduce((s, e) => s + Math.round(e.exp * clamp(1 + (e.lv - P.lv) * 0.15, 0.4, 2)), 0);
  const gold = B.enemies.reduce((s, e) => s + e.gold + ri(0, 5), 0);
  const lines = ['获得经验 ' + exp + '　　获得金钱 ' + gold + ' 两'];
  syncFromBattle();
  P.exp += exp; P.gold += gold;
  if (Math.random() < 0.3) { P.potions++; lines.push('战利品：金创药 ×1'); }
  let up = false;
  while (P.exp >= expNeed(P.lv)) { P.exp -= expNeed(P.lv); P.lv++; up = true; }
  if (up) {
    const s = heroStats(P.lv), ps = petStats(P.lv);
    P.hp = s.maxHp; P.mp = s.maxMp; P.petHp = ps.maxHp; P.petMp = ps.maxMp;
    lines.push('恭喜！' + P.name + ' 升到了 ' + P.lv + ' 级！气血、魔法、攻击、防御全面提升！');
    setTimeout(() => sfx('level'), 500);
    for (let k = 0; k < 5; k++) setTimeout(() => B && burst(B.hero.x, B.hero.y - 60, 20, () => pick(['#ffe066', '#fff', '#ffb02e']), { up: -150, g: 60 }), k * 150);
  }
  B.result = { win: true, title: '战斗胜利', lines };
  B.phase = 'result';
}
async function defeat() {
  sfx('lose');
  const lost = Math.floor(P.gold * 0.1);
  B.result = { win: false, title: '战斗失败', lines: ['胜败乃兵家常事，少侠请重新来过。', '你被送回了桃源村，气血已恢复。' + (lost ? '（损失金钱 ' + lost + ' 两）' : '')] };
  B.lost = lost;
  B.phase = 'result';
}
function syncFromBattle() {
  P.hp = Math.max(1, B.hero.hp); P.mp = B.hero.mp;
  P.petHp = B.pet.alive ? B.pet.hp : Math.round(B.pet.maxHp * 0.2); P.petMp = B.pet.mp;
}
async function endBattle(kind) {
  if (kind === 'win') {
    const m = B.mon; monsters = monsters.filter(x => x !== m); respawnQ.push({ zone: m.zone, t: 15 });
    grace = 2;
  } else if (kind === 'lose') {
    const s = heroStats(P.lv), ps = petStats(P.lv);
    P.hp = s.maxHp; P.mp = s.maxMp; P.petHp = ps.maxHp; P.petMp = ps.maxMp; P.gold -= B.lost || 0;
    player.x = START.x; player.y = START.y; pet.x = player.x - 40; pet.y = player.y + 10;
    grace = 3;
  } else if (kind === 'flee') {
    syncFromBattle(); grace = 3;
    const m = B.mon; const d = dist(m, player) || 1;
    for (let k = 0; k < 8; k++) { const nx = m.x + (m.x - player.x) / d * 20, ny = m.y + (m.y - player.y) / d * 20; if (!solidAtPx(nx, ny)) { m.x = nx; m.y = ny; } }
  }
  B.phase = 'leaving';
  await tween(350, p => { overlayA = p; });
  scene = 'map'; B = null; popups.length = 0; parts.length = 0;
  cam.x = clamp(player.x - W / 2, 0, MW * TS - W); cam.y = clamp(player.y - H / 2, 0, MH * TS - H);
  saveGame(true);
  await tween(350, p => { overlayA = 1 - p; });
  overlayA = 0;
}

function unitAt(x, y) {
  const all = B.enemies.concat(B.party).filter(u => u.alive);
  for (const u of all) { const w = u.h * 0.7; if (x > u.x - w / 2 && x < u.x + w / 2 && y > u.y - u.h && y < u.y + 10) return u; }
  return null;
}
function drawBattle(dt) {
  if (IMG.bbg) { ctx.drawImage(IMG.bbg, 0, 0, W, H); }
  else { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f6dcc0'); g.addColorStop(0.45, '#bcd6a0'); g.addColorStop(1, '#7da85a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, W, H);
  // 地面阵法圈
  ctx.save(); ctx.strokeStyle = 'rgba(255,240,180,0.35)'; ctx.lineWidth = 2;
  [[290, 450], [960, 540]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 220, 70, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y, 160, 50, 0, 0, 7); ctx.stroke(); });
  ctx.restore();
  const hovered = (B.phase === 'target') ? unitAt(mouse.x, mouse.y) : null;
  const units = B.enemies.concat(B.party).slice().sort((a, b) => (a.y + a.oy) - (b.y + b.oy));
  for (const u of units) {
    u.flash = Math.max(0, u.flash - dt); u.shake = Math.max(0, u.shake - dt);
    const sx = u.shake > 0 ? Math.sin(u.shake * 80) * 6 : 0;
    const x = u.x + u.ox + sx, y = u.y + u.oy;
    if (u.alpha <= 0.01) continue;
    ctx.save(); ctx.globalAlpha = u.alpha;
    shadow(x, y, u.h * 0.28);
    if (hovered === u) { ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, u.h * 0.32, u.h * 0.1, 0, 0, 7); ctx.stroke(); }
    ctx.restore();
    const breath = u.alive ? Math.sin(timeAcc * 3 + u.x) * 2 : 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(u.rot); ctx.translate(-x, -y);
    drawSprite(u.img, x, y + breath * 0.3, u.h + breath, u.flip, u.alpha, u.flash > 0 ? 2.2 : (u.alive ? null : 0.6));
    ctx.restore();
    if (u.defending && u.alive) { ctx.strokeStyle = 'rgba(120,190,255,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - u.h * 0.5, u.h * 0.45, 0, 7); ctx.stroke(); }
    if (u.alive) {
      if (u.side === 'e') { bar(x - 45, y - u.h - 18, 90, 9, u.hp, u.maxHp, '#ff6a5a', '#b3241a'); nameTag(u.name + ' Lv' + u.lv, x, y - u.h - 22, '#ffffff'); }
      else { nameTag(u.name, x, y + 26, '#7cff8a'); bar(x - 40, y + 28, 80, 7, u.hp, u.maxHp, '#ff6a5a', '#b3241a'); }
    }
    if (hovered === u) {
      const b = Math.sin(timeAcc * 8) * 4;
      ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.moveTo(x, y - u.h - 30 + b); ctx.lineTo(x - 10, y - u.h - 46 + b); ctx.lineTo(x + 10, y - u.h - 46 + b); ctx.closePath(); ctx.fill();
    }
  }
  // 粒子
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.t += dt;
    if (p.t >= p.life) { parts.splice(i, 1); continue; }
    const k = 1 - p.t / p.life;
    if (p.slash) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang); ctx.globalAlpha = k;
      ctx.strokeStyle = p.color; ctx.lineWidth = 6 * k + 1; ctx.shadowColor = p.color; ctx.shadowBlur = 12;
      const len = 90 * (1 - k * 0.5); ctx.beginPath(); ctx.moveTo(-len, 0); ctx.quadraticCurveTo(0, -18, len, 0); ctx.stroke(); ctx.restore();
    } else if (p.wave) {
      ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = p.color; ctx.shadowColor = '#bff'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 34, 10, -0.2, 0, 7); ctx.fill(); ctx.restore();
      burst(p.x, p.y, 1, '#dff', { min: 10, max: 40, life: 0.3, g: 0 });
    } else {
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.globalAlpha = k; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.5), 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    }
  }
  // 伤害数字
  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i]; p.t += dt; if (p.t > 1.1) { popups.splice(i, 1); continue; }
    const rise = easeOut(Math.min(1, p.t / 0.5)) * 40;
    const sc = p.t < 0.12 ? 1 + (0.12 - p.t) * 5 : 1;
    ctx.save(); ctx.globalAlpha = p.t > 0.8 ? (1.1 - p.t) / 0.3 : 1;
    ctx.translate(p.x, p.y - rise); ctx.scale(sc, sc);
    text(p.s, 0, 0, p.size, p.color, 'center', true, true); ctx.restore();
  }
  drawBattleUI();
}
function drawBattleUI() {
  const h = B.hero, pt = B.pet;
  // 我方状态
  panel(W - 300, 10, 290, 112);
  text(h.name + '  Lv' + P.lv, W - 285, 30, 16, '#ffe9a8', 'left', true);
  bar(W - 285, 44, 260, 15, h.hp, h.maxHp, '#ff6a5a', '#b3241a', '气血 ' + h.hp + '/' + h.maxHp);
  bar(W - 285, 62, 260, 15, h.mp, h.maxMp, '#6aa8ff', '#1f4fb3', '魔法 ' + h.mp + '/' + h.maxMp);
  text('小白虎', W - 285, 92, 14, '#d6ecff', 'left', true);
  bar(W - 225, 85, 200, 14, pt.hp, pt.maxHp, '#ff6a5a', '#b3241a', pt.alive ? pt.hp + '/' + pt.maxHp : '已倒下');
  text('金创药 ×' + P.potions, W - 285, 110, 13, '#bff5a8');
  // 回合提示
  if (B.prompt) { panel(W / 2 - 200, 14, 400, 44, 0.75); text(B.prompt, W / 2, 37, 19, '#ffe9a8', 'center', true); }
  // 战斗记录
  panel(10, H - 118, 560, 108, 0.7);
  B.log.forEach((l, i) => text(l, 26, H - 98 + i * 24, 15, i === B.log.length - 1 ? '#fff4dc' : '#cdb99a'));
  // 指令
  const cx = W - 140;
  const ph = B.phase;
  if (ph === 'command' || ph === 'target' || ph === 'skill' || ph === 'item') {
    const cmds = [['攻击', 'attack'], ['法术', 'skill'], ['道具', 'item'], ['防御', 'defend'], ['逃跑', 'flee'], ['自动', 'auto']];
    cmds.forEach(([l, c], i) => button(cx, 150 + i * 56, 120, 46, l, () => chooseCmd(c), { active: (ph === 'skill' && c === 'skill') || (ph === 'item' && c === 'item') || (ph === 'target' && B.pending && ((B.pending.type === 'attack' && c === 'attack') || (B.pending.type === 'skill' && c === 'skill') || (B.pending.type === 'item' && c === 'item'))) }));
    if (ph === 'skill') {
      panel(cx - 250, 190, 240, 3 * 62 + 20, 0.9);
      SKILLS.forEach((sk, i) => button(cx - 238, 202 + i * 62, 216, 52, sk.name + '（' + sk.mp + '魔法）', () => chooseSkill(sk), { size: 17, disabled: h.mp < sk.mp, sub: '' }));
      SKILLS.forEach((sk, i) => text(sk.desc, cx - 130, 202 + i * 62 + 44, 11, '#ffe2a8', 'center'));
    }
    if (ph === 'item') {
      panel(cx - 250, 246, 240, 84, 0.9);
      button(cx - 238, 258, 216, 60, '金创药 ×' + P.potions, () => { sfx('click'); B.pending = { type: 'item' }; B.phase = 'target'; B.prompt = '请选择使用对象'; }, { size: 18, disabled: P.potions <= 0 });
    }
  } else if (B.auto && ph === 'anim') {
    button(cx, 150, 120, 46, '取消自动', () => { B.auto = false; }, { size: 16 });
  }
  if (ph === 'result') {
    const r = B.result;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
    panel(W / 2 - 330, 220, 660, 280, 0.94);
    text(r.title, W / 2, 270, 40, r.win ? '#ffe066' : '#ff8a7a', 'center', true, true);
    r.lines.forEach((l, i) => text(l, W / 2, 330 + i * 36, 19, '#fff4dc', 'center', true));
    button(W / 2 - 80, 430, 160, 50, '确定', () => { sfx('click'); endBattle(r.win ? 'win' : 'lose'); }, { size: 20 });
  }
}

// ---------------- 主循环与输入 ----------------
function toCanvas(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
cv.addEventListener('pointermove', e => { const p = toCanvas(e); mouse.x = p.x; mouse.y = p.y; });
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  const p = toCanvas(e); mouse.x = p.x; mouse.y = p.y;
  for (let i = buttons.length - 1; i >= 0; i--) {
    const b = buttons[i];
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { b.cb(); return; }
  }
  if (scene === 'map' && !dialog && !helpOpen) onMapClick(p.x + cam.x, p.y + cam.y);
  else if (scene === 'battle' && B && B.phase === 'target') { const u = unitAt(p.x, p.y); if (u) chooseTarget(u); }
  else if (scene === 'battle' && B && (B.phase === 'skill' || B.phase === 'item')) { B.phase = 'command'; B.prompt = '第 ' + B.round + ' 回合 · 请下达指令'; }
});
cv.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') { dialog = null; helpOpen = false; if (B && (B.phase === 'target' || B.phase === 'skill' || B.phase === 'item')) { B.phase = 'command'; B.pending = null; } }
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; timeAcc += dt;
  buttons = [];
  updateTweens(dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (scene === 'title') drawTitle();
  else if (scene === 'map' || scene === 'trans') {
    if (scene === 'map' && !dialog && !helpOpen) updateMap(dt);
    drawMap(); drawHUD();
    if (dialog) drawDialog();
    if (helpOpen) drawHelp();
  } else if (scene === 'battle' && B) drawBattle(dt);
  drawToasts(dt);
  if (overlayA > 0) {
    ctx.fillStyle = `rgba(10,5,0,${overlayA})`; ctx.fillRect(0, 0, W, H);
    if (scene === 'trans') { ctx.save(); ctx.globalAlpha = overlayA; text('遭遇妖怪！', W / 2, H / 2, 48, '#ffe066', 'center', true, true); ctx.restore(); }
  }
  requestAnimationFrame(frame);
}

// 供自动化测试读取状态
window.__game = {
  get scene() { return scene; }, get player() { return player; }, get P() { return P; }, get B() { return B; },
  get monsters() { return monsters; }, get cam() { return cam; }, NPC, startGame, chooseCmd, chooseTarget, findPath,
  get dialog() { return dialog; },
};

function boot() {
  genMap(); computeReach(); renderGround(); renderTrees(); resetPlayer();
  requestAnimationFrame(t => { last = t; frame(t); });
}
ctx.fillStyle = '#1b1410'; ctx.fillRect(0, 0, W, H);
text('加载中……', W / 2, H / 2, 28, '#ffe9a8', 'center', true);
loadImages(boot);
})();
