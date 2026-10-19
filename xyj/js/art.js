/* 程序绘制的美术资源：角色、怪物、战斗背景（无需外部图片） */
'use strict';
window.ART = (function () {
  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
  const OL = '#2a1e1a';
  function fs(g, fill, stroke, lw) { if (fill) { g.fillStyle = fill; g.fill(); } if (stroke !== false) { g.strokeStyle = stroke || OL; g.lineWidth = lw || 3; g.stroke(); } }
  function ell(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); }
  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); }
  function poly(g, pts, close) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); if (close !== false) g.closePath(); }
  function grad(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => gr.addColorStop(i / (stops.length - 1), s)); return gr; }
  function animeEye(g, x, y, rx, ry, iris) {
    ell(g, x, y, rx, ry); fs(g, '#ffffff', OL, 2);
    ell(g, x - rx * 0.1, y + ry * 0.1, rx * 0.8, ry * 0.85); fs(g, iris, false);
    ell(g, x - rx * 0.1, y + ry * 0.2, rx * 0.45, ry * 0.5); fs(g, '#111', false);
    circ(g, x - rx * 0.35, y - ry * 0.3, rx * 0.3); fs(g, '#fff', false);
    circ(g, x + rx * 0.25, y + ry * 0.35, rx * 0.15); fs(g, '#fff', false);
  }

  // ---------- 主角：逍遥生（面朝左） ----------
  function hero() {
    const [c, g] = mk(200, 250); g.lineJoin = 'round'; g.lineCap = 'round';
    // 剑（身后）
    g.save(); g.translate(150, 178); g.rotate(0.75);
    g.fillStyle = grad(g, 0, 0, 8, 0, ['#e8f2ff', '#9fb2c8']); g.beginPath(); g.moveTo(-4, 0); g.lineTo(4, 0); g.lineTo(3, 70); g.lineTo(0, 78); g.lineTo(-3, 70); g.closePath(); fs(g, null, OL, 2); g.fill(); g.stroke();
    g.fillStyle = '#d9a93a'; g.fillRect(-12, -6, 24, 7); g.strokeRect(-12, -6, 24, 7);
    g.fillStyle = '#5a2a1a'; g.fillRect(-3, -28, 6, 22); g.strokeRect(-3, -28, 6, 22);
    g.restore();
    // 靴与裤
    ell(g, 82, 236, 16, 9); fs(g, '#2b2b36');
    ell(g, 116, 236, 16, 9); fs(g, '#2b2b36');
    poly(g, [[74, 200], [126, 200], [124, 230], [76, 230]]); fs(g, '#2d4f9e');
    // 长袍
    g.beginPath(); g.moveTo(72, 122); g.lineTo(128, 122);
    g.quadraticCurveTo(150, 170, 160, 214); g.quadraticCurveTo(100, 226, 40, 214);
    g.quadraticCurveTo(50, 170, 72, 122); g.closePath();
    fs(g, grad(g, 0, 120, 0, 220, ['#ffffff', '#e6ecf6']));
    // 下摆蓝边与云纹
    g.beginPath(); g.moveTo(44, 204); g.quadraticCurveTo(100, 216, 156, 204); g.lineTo(160, 214); g.quadraticCurveTo(100, 226, 40, 214); g.closePath(); fs(g, '#2f63c4', OL, 2);
    g.strokeStyle = '#7fb0ff'; g.lineWidth = 2;
    [60, 90, 120, 145].forEach(x => { g.beginPath(); g.arc(x, 198, 5, Math.PI, 0); g.stroke(); });
    // 前襟
    poly(g, [[86, 124], [100, 160], [114, 124]], false); g.strokeStyle = '#2f63c4'; g.lineWidth = 6; g.stroke();
    poly(g, [[100, 160], [100, 205]], false); g.strokeStyle = '#2f63c4'; g.lineWidth = 3; g.stroke();
    // 腰带
    g.beginPath(); g.moveTo(66, 150); g.quadraticCurveTo(100, 158, 134, 150); g.lineTo(136, 164); g.quadraticCurveTo(100, 172, 64, 164); g.closePath(); fs(g, '#2f55a8', OL, 2);
    poly(g, [[96, 164], [90, 196], [100, 190], [106, 198], [104, 164]]); fs(g, '#3c6fd0', OL, 2);
    circ(g, 100, 160, 5); fs(g, '#e6b84a', OL, 1.5);
    // 袖子
    g.beginPath(); g.moveTo(74, 124); g.quadraticCurveTo(44, 140, 26, 186); g.quadraticCurveTo(48, 196, 70, 184); g.quadraticCurveTo(76, 160, 84, 140); g.closePath();
    fs(g, grad(g, 20, 0, 90, 0, ['#e8eef8', '#ffffff']));
    g.beginPath(); g.moveTo(26, 186); g.quadraticCurveTo(48, 196, 70, 184); g.lineTo(68, 178); g.quadraticCurveTo(48, 188, 30, 180); g.closePath(); fs(g, '#2f63c4', OL, 2);
    g.beginPath(); g.moveTo(126, 124); g.quadraticCurveTo(158, 140, 168, 180); g.quadraticCurveTo(150, 190, 134, 182); g.quadraticCurveTo(126, 158, 118, 140); g.closePath();
    fs(g, grad(g, 110, 0, 170, 0, ['#ffffff', '#e2e9f5']));
    g.beginPath(); g.moveTo(168, 180); g.quadraticCurveTo(150, 190, 134, 182); g.lineTo(136, 176); g.quadraticCurveTo(152, 184, 165, 174); g.closePath(); fs(g, '#2f63c4', OL, 2);
    circ(g, 150, 182, 8); fs(g, '#f6d3b4');
    // 头
    // 后发
    g.beginPath(); g.moveTo(58, 70); g.quadraticCurveTo(60, 26, 104, 24); g.quadraticCurveTo(150, 26, 146, 80); g.quadraticCurveTo(150, 112, 132, 120); g.lineTo(70, 116); g.quadraticCurveTo(54, 100, 58, 70); g.closePath(); fs(g, '#1d1b26');
    // 脸
    g.beginPath(); g.moveTo(62, 74); g.quadraticCurveTo(60, 116, 94, 122); g.quadraticCurveTo(128, 118, 132, 80); g.quadraticCurveTo(100, 60, 62, 74); g.closePath(); fs(g, '#fbe0c6');
    // 耳
    ell(g, 134, 90, 7, 10); fs(g, '#f6d3b4', OL, 2);
    // 刘海
    g.beginPath(); g.moveTo(56, 80); g.quadraticCurveTo(62, 36, 104, 32); g.quadraticCurveTo(142, 34, 146, 76);
    g.lineTo(130, 70); g.lineTo(122, 84); g.lineTo(112, 64); g.lineTo(98, 82); g.lineTo(88, 62); g.lineTo(74, 84); g.lineTo(70, 66); g.closePath(); fs(g, '#23202e');
    g.strokeStyle = 'rgba(140,150,200,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(84, 44); g.quadraticCurveTo(100, 38, 118, 44); g.stroke();
    // 发髻与发带
    circ(g, 106, 22, 14); fs(g, '#23202e');
    g.fillStyle = '#2f63c4'; g.fillRect(94, 30, 24, 6); g.strokeStyle = OL; g.lineWidth = 2; g.strokeRect(94, 30, 24, 6);
    g.beginPath(); g.moveTo(118, 33); g.quadraticCurveTo(140, 30, 150, 50); g.quadraticCurveTo(138, 42, 120, 38); g.closePath(); fs(g, '#3c6fd0', OL, 2);
    g.beginPath(); g.moveTo(118, 34); g.quadraticCurveTo(146, 46, 142, 70); g.quadraticCurveTo(134, 52, 118, 40); g.closePath(); fs(g, '#2f63c4', OL, 2);
    // 五官（朝左）
    animeEye(g, 80, 92, 9, 12, '#5a3b26');
    animeEye(g, 108, 92, 9, 12, '#5a3b26');
    g.strokeStyle = OL; g.lineWidth = 3; g.beginPath(); g.moveTo(70, 76); g.lineTo(88, 74); g.moveTo(100, 74); g.lineTo(118, 77); g.stroke();
    ell(g, 72, 106, 7, 3.5); fs(g, 'rgba(255,130,130,0.45)', false);
    ell(g, 114, 106, 7, 3.5); fs(g, 'rgba(255,130,130,0.45)', false);
    g.strokeStyle = '#8a4a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(88, 110); g.quadraticCurveTo(93, 113, 98, 110); g.stroke();
    // 前手
    circ(g, 46, 190, 8); fs(g, '#f6d3b4');
    return c;
  }

  // ---------- 召唤兽：小白虎（面朝右） ----------
  function pet() {
    const [c, g] = mk(220, 200); g.lineJoin = 'round'; g.lineCap = 'round';
    // 尾巴
    g.beginPath(); g.moveTo(60, 140); g.quadraticCurveTo(14, 140, 22, 90); g.quadraticCurveTo(26, 72, 38, 70); g.quadraticCurveTo(36, 96, 40, 112); g.quadraticCurveTo(48, 126, 66, 124); g.closePath(); fs(g, '#ffffff');
    [[30, 100], [36, 124], [50, 134]].forEach(([x, y]) => { g.strokeStyle = '#3a6fd8'; g.lineWidth = 5; g.beginPath(); g.moveTo(x - 6, y - 4); g.lineTo(x + 6, y + 4); g.stroke(); });
    g.beginPath(); g.moveTo(26, 76); g.quadraticCurveTo(18, 54, 34, 40); g.quadraticCurveTo(32, 56, 44, 58); g.quadraticCurveTo(50, 70, 38, 78); g.closePath(); fs(g, '#7ec4ff', '#2f63c4', 2);
    // 身体
    ell(g, 96, 146, 56, 36); fs(g, grad(g, 0, 110, 0, 182, ['#ffffff', '#e4ecf8']));
    [[72, 124], [92, 120], [112, 124]].forEach(([x, y]) => { g.fillStyle = '#3a6fd8'; g.beginPath(); g.moveTo(x - 6, y - 2); g.quadraticCurveTo(x, y + 14, x - 2, y + 26); g.quadraticCurveTo(x + 6, y + 12, x + 6, y - 2); g.closePath(); g.fill(); });
    // 腿
    [[64, 176], [88, 182], [118, 182], [140, 174]].forEach(([x, y]) => { ell(g, x, y, 13, 11); fs(g, '#ffffff'); g.strokeStyle = '#c9d4e6'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 4, y + 4); g.lineTo(x - 4, y + 9); g.moveTo(x + 3, y + 4); g.lineTo(x + 3, y + 9); g.stroke(); });
    // 胸前云纹毛
    g.beginPath(); g.moveTo(118, 128); g.quadraticCurveTo(110, 156, 132, 160); g.quadraticCurveTo(154, 158, 150, 128); g.closePath(); fs(g, '#ffffff', OL, 2);
    g.strokeStyle = '#7ec4ff'; g.lineWidth = 2; g.beginPath(); g.arc(134, 146, 6, 0, Math.PI * 1.5); g.stroke();
    // 头
    // 耳
    poly(g, [[112, 62], [118, 26], [140, 52]]); fs(g, '#ffffff');
    poly(g, [[118, 56], [121, 36], [134, 52]]); fs(g, '#3a6fd8', false);
    poly(g, [[160, 52], [184, 28], [188, 66]]); fs(g, '#ffffff');
    poly(g, [[166, 52], [182, 36], [184, 60]]); fs(g, '#3a6fd8', false);
    ell(g, 150, 92, 50, 44); fs(g, grad(g, 0, 50, 0, 136, ['#ffffff', '#eef3fb']));
    // 腮毛
    poly(g, [[102, 100], [94, 112], [108, 112], [104, 124], [118, 120]], false); fs(g, '#ffffff', OL, 2);
    // 额纹
    g.fillStyle = '#3a6fd8';
    [[150, 52, 0], [136, 58, -0.4], [164, 58, 0.4]].forEach(([x, y, r]) => { g.save(); g.translate(x, y); g.rotate(r); g.beginPath(); g.moveTo(-4, 0); g.quadraticCurveTo(0, 16, 0, 22); g.quadraticCurveTo(4, 12, 4, 0); g.closePath(); g.fill(); g.restore(); });
    [[112, 84], [190, 84]].forEach(([x, y], i) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x + (i ? -14 : 14), y + 4); g.lineTo(x, y + 8); g.closePath(); g.fill(); });
    // 眼
    animeEye(g, 136, 94, 11, 13, '#2f7be0');
    animeEye(g, 170, 94, 11, 13, '#2f7be0');
    ell(g, 124, 114, 7, 4); fs(g, 'rgba(255,140,170,0.5)', false);
    ell(g, 182, 114, 7, 4); fs(g, 'rgba(255,140,170,0.5)', false);
    poly(g, [[148, 108], [158, 108], [153, 114]]); fs(g, '#ff8fa8', OL, 1.5);
    g.strokeStyle = OL; g.lineWidth = 2; g.beginPath(); g.moveTo(153, 114); g.quadraticCurveTo(148, 122, 142, 118); g.moveTo(153, 114); g.quadraticCurveTo(158, 122, 164, 118); g.stroke();
    ell(g, 153, 124, 4, 4); fs(g, '#ff7a9a', false);
    return c;
  }

  // ---------- NPC：孙大夫 ----------
  function npc() {
    const [c, g] = mk(180, 250); g.lineJoin = 'round'; g.lineCap = 'round';
    ell(g, 74, 238, 15, 8); fs(g, '#333');
    ell(g, 108, 238, 15, 8); fs(g, '#333');
    g.beginPath(); g.moveTo(62, 118); g.lineTo(118, 118); g.quadraticCurveTo(140, 180, 146, 232); g.quadraticCurveTo(90, 242, 34, 232); g.quadraticCurveTo(40, 180, 62, 118); g.closePath();
    fs(g, grad(g, 0, 118, 0, 236, ['#9c9ea6', '#76787f']));
    g.strokeStyle = '#d8d8dc'; g.lineWidth = 2; g.beginPath(); g.moveTo(44, 222); g.quadraticCurveTo(90, 232, 136, 222); g.stroke();
    g.beginPath(); g.moveTo(58, 160); g.quadraticCurveTo(90, 168, 122, 160); g.lineTo(124, 172); g.quadraticCurveTo(90, 180, 56, 172); g.closePath(); fs(g, '#55575e', OL, 2);
    poly(g, [[90, 174], [86, 204], [94, 204]]); fs(g, '#4a4c52', OL, 1.5);
    // 袖
    g.beginPath(); g.moveTo(64, 122); g.quadraticCurveTo(34, 150, 30, 190); g.quadraticCurveTo(50, 198, 66, 188); g.lineTo(76, 140); g.closePath(); fs(g, '#8d8f97');
    g.beginPath(); g.moveTo(116, 122); g.quadraticCurveTo(150, 150, 152, 186); g.quadraticCurveTo(134, 196, 118, 186); g.lineTo(106, 140); g.closePath(); fs(g, '#8d8f97');
    // 葫芦
    g.strokeStyle = '#b3302a'; g.lineWidth = 3; g.beginPath(); g.moveTo(40, 176); g.lineTo(36, 196); g.stroke();
    circ(g, 44, 170, 12); fs(g, '#c88a3e');
    circ(g, 44, 150, 8); fs(g, '#d39a4e');
    g.fillStyle = '#7a4a1a'; g.fillRect(41, 138, 6, 5);
    circ(g, 52, 176, 7); fs(g, '#f3d1b0');
    // 头
    g.beginPath(); g.moveTo(58, 78); g.quadraticCurveTo(58, 120, 90, 122); g.quadraticCurveTo(122, 120, 122, 78); g.quadraticCurveTo(90, 50, 58, 78); g.closePath(); fs(g, '#f6d6b6');
    g.beginPath(); g.moveTo(54, 80); g.quadraticCurveTo(56, 34, 90, 32); g.quadraticCurveTo(124, 34, 126, 80); g.quadraticCurveTo(112, 58, 90, 56); g.quadraticCurveTo(68, 58, 54, 80); g.closePath(); fs(g, '#f2f2f2');
    circ(g, 90, 24, 13); fs(g, '#f2f2f2');
    g.strokeStyle = '#8a8a8a'; g.lineWidth = 3; g.beginPath(); g.moveTo(70, 22); g.lineTo(112, 18); g.stroke();
    // 眉眼（眯眼笑）
    g.strokeStyle = OL; g.lineWidth = 3;
    g.beginPath(); g.arc(76, 86, 7, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    g.beginPath(); g.arc(104, 86, 7, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    ell(g, 74, 74, 10, 4, -0.2); fs(g, '#ffffff', OL, 1.5);
    ell(g, 106, 74, 10, 4, 0.2); fs(g, '#ffffff', OL, 1.5);
    ell(g, 68, 98, 6, 3); fs(g, 'rgba(255,120,120,0.45)', false);
    ell(g, 112, 98, 6, 3); fs(g, 'rgba(255,120,120,0.45)', false);
    // 胡子
    g.beginPath(); g.moveTo(70, 100); g.quadraticCurveTo(90, 96, 110, 100); g.quadraticCurveTo(112, 130, 90, 156); g.quadraticCurveTo(68, 130, 70, 100); g.closePath(); fs(g, '#ffffff');
    g.strokeStyle = '#cfcfcf'; g.lineWidth = 1.5; [80, 90, 100].forEach(x => { g.beginPath(); g.moveTo(x, 108); g.lineTo(90 + (x - 90) * 0.4, 146); g.stroke(); });
    g.beginPath(); g.moveTo(80, 102); g.quadraticCurveTo(90, 98, 100, 102); g.quadraticCurveTo(90, 110, 80, 102); fs(g, '#a8463a', OL, 1.5);
    return c;
  }

  // ---------- 树妖（面朝左） ----------
  function tree() {
    const [c, g] = mk(200, 240); g.lineJoin = 'round'; g.lineCap = 'round';
    // 根脚
    [[66, 228, -0.3], [100, 232, 0], [134, 228, 0.3]].forEach(([x, y, r]) => { ell(g, x, y, 18, 9, r); fs(g, '#5b3a1e'); });
    // 枝干手臂
    g.lineWidth = 12; g.strokeStyle = OL;
    const arm = (pts, col) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.strokeStyle = OL; g.lineWidth = 14; g.stroke(); g.strokeStyle = col; g.lineWidth = 9; g.stroke(); };
    arm([[132, 140], [164, 160], [176, 190]], '#7a5230');
    arm([[176, 190], [168, 204]], '#7a5230'); arm([[176, 190], [186, 202]], '#7a5230');
    arm([[68, 140], [36, 150], [20, 178]], '#86593a');
    arm([[20, 178], [10, 190]], '#86593a'); arm([[20, 178], [24, 196]], '#86593a'); arm([[20, 178], [6, 172]], '#86593a');
    // 躯干
    g.beginPath(); g.moveTo(64, 80); g.quadraticCurveTo(54, 160, 58, 226); g.lineTo(142, 226); g.quadraticCurveTo(148, 160, 136, 80); g.quadraticCurveTo(100, 60, 64, 80); g.closePath();
    fs(g, grad(g, 56, 0, 146, 0, ['#9a6a40', '#7a5230', '#5e3c20']));
    g.strokeStyle = 'rgba(40,20,10,0.55)'; g.lineWidth = 2.5;
    [[78, 150, 74, 210], [96, 170, 100, 220], [120, 140, 126, 210], [110, 186, 116, 200], [86, 128, 90, 146]].forEach(([a, b, x, y]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(a + 6, (b + y) / 2, x, y); g.stroke(); });
    // 树洞嘴
    g.beginPath(); g.moveTo(72, 138); g.quadraticCurveTo(96, 160, 122, 136); g.quadraticCurveTo(98, 150, 72, 138); fs(g, '#2a140a', OL, 2);
    poly(g, [[80, 142], [84, 150], [88, 145]]); fs(g, '#e8dcc0', false);
    poly(g, [[106, 146], [110, 152], [113, 143]]); fs(g, '#e8dcc0', false);
    // 发光眼
    g.save(); g.shadowColor = '#d4ff3a'; g.shadowBlur = 14;
    ell(g, 80, 110, 11, 8, 0.2); fs(g, '#e6ff6a', OL, 2);
    ell(g, 112, 108, 11, 8, -0.2); fs(g, '#e6ff6a', OL, 2);
    g.restore();
    circ(g, 77, 111, 4); fs(g, '#2a3a00', false); circ(g, 109, 109, 4); fs(g, '#2a3a00', false);
    g.strokeStyle = OL; g.lineWidth = 4; g.beginPath(); g.moveTo(66, 96); g.lineTo(90, 102); g.moveTo(126, 94); g.lineTo(102, 101); g.stroke();
    // 树冠
    g.lineWidth = 7; g.strokeStyle = '#6b4526';
    [[72, 70, 44, 24], [128, 70, 160, 22], [100, 66, 104, 14]].forEach(([a, b, x, y]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + x) / 2 + (x > a ? -10 : 10), (b + y) / 2, x, y); g.strokeStyle = OL; g.lineWidth = 10; g.stroke(); g.strokeStyle = '#7a5230'; g.lineWidth = 6; g.stroke(); });
    const leaf = (x, y, r, rot, col) => { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.moveTo(0, -r); g.quadraticCurveTo(r * 0.7, 0, 0, r); g.quadraticCurveTo(-r * 0.7, 0, 0, -r); g.closePath(); fs(g, col, OL, 2); g.strokeStyle = 'rgba(30,60,10,0.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -r * 0.8); g.lineTo(0, r * 0.8); g.stroke(); g.restore(); };
    [[60, 70, 18, -1], [80, 62, 20, -0.4], [104, 58, 20, 0.1], [126, 62, 20, 0.6], [144, 74, 18, 1.1], [70, 84, 16, -1.6], [134, 86, 16, 1.6], [92, 48, 16, -0.2], [118, 46, 16, 0.4], [40, 30, 14, -0.8], [160, 28, 14, 0.8], [104, 18, 13, 0]].forEach(([x, y, r, rot], i) => leaf(x, y, r, rot, i % 3 === 0 ? '#9cc63a' : i % 3 === 1 ? '#7aa82e' : '#b5d64a'));
    return c;
  }

  // ---------- 野猪精（面朝左） ----------
  function boar() {
    const [c, g] = mk(240, 200); g.lineJoin = 'round'; g.lineCap = 'round';
    // 后腿
    [[170, 170], [140, 176]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x - 12, y - 30); g.lineTo(x + 12, y - 30); g.lineTo(x + 10, y + 12); g.lineTo(x - 10, y + 12); g.closePath(); fs(g, '#4a2e1a'); ell(g, x, y + 14, 12, 6); fs(g, '#d8cbb0', OL, 2); });
    // 身体
    ell(g, 140, 120, 80, 52, -0.08); fs(g, grad(g, 0, 70, 0, 172, ['#7a5236', '#5a3a22', '#3e2614']));
    // 鬃毛
    g.beginPath(); g.moveTo(80, 76);
    for (let i = 0; i < 9; i++) { const x = 84 + i * 16, y = 70 - Math.sin(i / 8 * Math.PI) * 6; g.lineTo(x + 6, y - 22 - (i % 2) * 6); g.lineTo(x + 14, y + 4); }
    g.lineTo(220, 100); g.lineTo(80, 96); g.closePath(); fs(g, '#2e1c10');
    // 尾
    g.strokeStyle = OL; g.lineWidth = 4; g.beginPath(); g.moveTo(218, 110); g.quadraticCurveTo(234, 100, 228, 120); g.stroke();
    // 前腿
    [[86, 172], [112, 178]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x - 13, y - 34); g.lineTo(x + 13, y - 34); g.lineTo(x + 11, y + 10); g.lineTo(x - 11, y + 10); g.closePath(); fs(g, '#5a3a22'); ell(g, x, y + 12, 13, 6); fs(g, '#e6dcc4', OL, 2); });
    // 头
    g.beginPath(); g.moveTo(40, 96); g.quadraticCurveTo(46, 50, 92, 52); g.quadraticCurveTo(128, 58, 122, 112); g.quadraticCurveTo(110, 150, 70, 150); g.quadraticCurveTo(36, 140, 40, 96); g.closePath();
    fs(g, grad(g, 0, 50, 0, 150, ['#8a6040', '#5e3e26']));
    // 耳
    poly(g, [[92, 56], [110, 22], [118, 66]]); fs(g, '#5e3e26'); poly(g, [[98, 56], [109, 34], [113, 60]]); fs(g, '#c58a7a', false);
    poly(g, [[56, 60], [48, 28], [76, 52]]); fs(g, '#6a4630');
    // 头巾
    g.beginPath(); g.moveTo(42, 78); g.quadraticCurveTo(84, 54, 124, 78); g.lineTo(122, 94); g.quadraticCurveTo(84, 72, 44, 94); g.closePath(); fs(g, '#c0302a');
    g.strokeStyle = '#f2c84b'; g.lineWidth = 2; [60, 84, 106].forEach(x => { g.beginPath(); g.arc(x, 82, 4, 0, Math.PI * 1.6); g.stroke(); });
    g.beginPath(); g.moveTo(122, 82); g.quadraticCurveTo(150, 70, 170, 84); g.lineTo(162, 92); g.lineTo(172, 98); g.quadraticCurveTo(148, 96, 124, 92); g.closePath(); fs(g, '#a82620');
    g.beginPath(); g.moveTo(124, 90); g.quadraticCurveTo(150, 108, 160, 128); g.lineTo(150, 124); g.lineTo(152, 136); g.quadraticCurveTo(134, 116, 120, 96); g.closePath(); fs(g, '#c0302a');
    // 眼
    ell(g, 64, 104, 8, 7); fs(g, '#ffb02e', OL, 2); circ(g, 62, 105, 3.5); fs(g, '#111', false); circ(g, 60, 102, 1.8); fs(g, '#fff', false);
    ell(g, 94, 104, 8, 7); fs(g, '#ffb02e', OL, 2); circ(g, 92, 105, 3.5); fs(g, '#111', false); circ(g, 90, 102, 1.8); fs(g, '#fff', false);
    g.strokeStyle = OL; g.lineWidth = 4; g.beginPath(); g.moveTo(52, 92); g.lineTo(72, 98); g.moveTo(106, 92); g.lineTo(86, 98); g.stroke();
    // 嘴鼻
    ell(g, 56, 132, 22, 15); fs(g, '#b98670');
    ell(g, 49, 132, 4, 6); fs(g, '#3a1a10', false); ell(g, 63, 132, 4, 6); fs(g, '#3a1a10', false);
    g.beginPath(); g.moveTo(40, 146); g.quadraticCurveTo(60, 156, 84, 146); g.quadraticCurveTo(62, 162, 40, 146); fs(g, '#7a2018', OL, 2);
    // 獠牙
    g.beginPath(); g.moveTo(36, 140); g.quadraticCurveTo(22, 130, 22, 112); g.quadraticCurveTo(32, 124, 44, 136); g.closePath(); fs(g, '#fff6e0', OL, 2);
    g.beginPath(); g.moveTo(76, 142); g.quadraticCurveTo(90, 132, 88, 114); g.quadraticCurveTo(82, 128, 70, 138); g.closePath(); fs(g, '#fff6e0', OL, 2);
    return c;
  }

  // ---------- 狐狸精（面朝左） ----------
  function fox() {
    const [c, g] = mk(272, 230); g.lineJoin = 'round'; g.lineCap = 'round';
    const flame = (x, y, s, rot) => { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-s * 0.7, -s * 0.6, 0, -s * 1.6); g.quadraticCurveTo(s * 0.2, -s, s * 0.6, -s * 1.1); g.quadraticCurveTo(s * 0.8, -s * 0.3, 0, 0); g.closePath(); g.fillStyle = 'rgba(80,170,255,0.85)'; g.fill(); g.restore(); };
    // 尾巴（五条）
    const tails = [[150, 170, -1.2], [160, 160, -0.7], [164, 150, -0.2], [160, 140, 0.3], [150, 132, 0.8]];
    tails.forEach(([x, y, r], i) => {
      g.save(); g.translate(x, y); g.rotate(r);
      g.beginPath(); g.moveTo(-12, 0); g.quadraticCurveTo(-30, -60, 0, -96); g.quadraticCurveTo(30, -60, 12, 0); g.closePath();
      fs(g, grad(g, 0, 0, 0, -96, ['#7a46c0', '#9a66e0', '#d8c0ff']));
      g.restore();
      flame(x + Math.sin(r) * 90, y - Math.cos(r) * 90, 14, r);
    });
    // 身体
    ell(g, 100, 178, 44, 40); fs(g, grad(g, 0, 140, 0, 218, ['#9a66e0', '#7444b8']));
    // 胸毛
    g.beginPath(); g.moveTo(70, 150); g.quadraticCurveTo(78, 190, 96, 196); g.quadraticCurveTo(108, 176, 110, 150); g.closePath(); fs(g, '#ece0ff');
    // 前爪
    ell(g, 80, 214, 13, 9); fs(g, '#8a56d0'); ell(g, 110, 216, 13, 9); fs(g, '#8a56d0');
    // 金纹
    g.strokeStyle = '#f2c84b'; g.lineWidth = 3; g.beginPath(); g.arc(124, 178, 8, Math.PI * 0.2, Math.PI * 1.6); g.stroke();
    // 头
    poly(g, [[60, 96], [44, 34], [92, 80]]); fs(g, '#8a56d0'); poly(g, [[64, 88], [54, 50], [84, 80]]); fs(g, '#f2c0e0', false);
    poly(g, [[104, 80], [130, 26], [138, 96]]); fs(g, '#8a56d0'); poly(g, [[110, 82], [128, 44], [132, 90]]); fs(g, '#f2c0e0', false);
    g.beginPath(); g.moveTo(52, 110); g.quadraticCurveTo(54, 74, 96, 72); g.quadraticCurveTo(138, 76, 136, 112); g.quadraticCurveTo(130, 140, 100, 146); g.lineTo(60, 140); g.quadraticCurveTo(32, 134, 30, 124); g.quadraticCurveTo(44, 118, 52, 110); g.closePath();
    fs(g, grad(g, 0, 70, 0, 146, ['#a678ea', '#8a56d0']));
    g.beginPath(); g.moveTo(32, 124); g.quadraticCurveTo(50, 132, 70, 128); g.quadraticCurveTo(62, 142, 40, 134); g.closePath(); fs(g, '#ece0ff', false);
    circ(g, 31, 123, 4); fs(g, '#2a1a3a', false);
    // 额纹
    g.strokeStyle = '#f2c84b'; g.lineWidth = 3; g.beginPath(); g.moveTo(92, 78); g.quadraticCurveTo(84, 90, 92, 100); g.quadraticCurveTo(100, 90, 92, 78); g.stroke();
    circ(g, 92, 94, 3); fs(g, '#4ab0ff', false);
    // 眼
    animeEye(g, 74, 108, 9, 11, '#d08a2a');
    animeEye(g, 108, 108, 9, 11, '#d08a2a');
    ell(g, 66, 124, 6, 3); fs(g, 'rgba(255,140,200,0.5)', false);
    g.strokeStyle = OL; g.lineWidth = 2; g.beginPath(); g.moveTo(50, 132); g.quadraticCurveTo(58, 138, 66, 132); g.stroke();
    // 狐火
    [[30, 80, 16, -0.3], [176, 40, 18, 0.3], [20, 160, 14, -0.5], [200, 190, 12, 0.4]].forEach(f => flame(...f));
    return c;
  }

  // ---------- 战斗背景 ----------
  function battleBg(W, H) {
    const [c, g] = mk(W, H);
    let s = 9; const R = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    g.fillStyle = grad(g, 0, 0, 0, H * 0.5, ['#fdf0d6', '#f6dcb4', '#eccf9e']); g.fillRect(0, 0, W, H);
    const sun = g.createRadialGradient(W * 0.62, H * 0.18, 10, W * 0.62, H * 0.18, 260); sun.addColorStop(0, 'rgba(255,250,220,0.95)'); sun.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = sun; g.fillRect(0, 0, W, H);
    // 云
    for (let i = 0; i < 7; i++) { const x = R() * W, y = 40 + R() * 120; g.fillStyle = 'rgba(255,255,255,0.55)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + k * 30, y + Math.sin(k) * 6, 40, 14, 0, 0, 7); g.fill(); } }
    // 远山
    const range = (base, amp, col, step, seed) => {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
      let x = 0; while (x <= W + step) { const pk = base - R() * amp; g.lineTo(x, pk); g.lineTo(x + step * 0.5, base - R() * amp * 0.4); x += step; }
      g.lineTo(W, H); g.closePath(); g.fill();
    };
    range(250, 150, '#b9c9b4', 110); 
    g.fillStyle = 'rgba(255,250,235,0.55)'; g.fillRect(0, 210, W, 60);
    range(300, 110, '#93b08e', 90);
    // 宝塔
    const px = W * 0.74, py = 250;
    g.fillStyle = '#6d7f6a'; g.beginPath(); g.ellipse(px, py + 20, 120, 40, 0, Math.PI, 0); g.fill();
    for (let k = 0; k < 6; k++) { const ww = 40 - k * 5, yy = py - k * 22; g.fillStyle = '#7a3a2a'; g.fillRect(px - ww / 2 + 5, yy - 16, ww - 10, 16); g.fillStyle = '#3d4e60'; g.beginPath(); g.moveTo(px - ww / 2 - 8, yy - 12); g.quadraticCurveTo(px, yy - 26, px + ww / 2 + 8, yy - 12); g.lineTo(px + ww / 2, yy - 18); g.lineTo(px - ww / 2, yy - 18); g.closePath(); g.fill(); }
    g.fillStyle = '#c99a3a'; g.fillRect(px - 2, py - 150, 4, 22);
    g.fillStyle = 'rgba(255,250,235,0.5)'; g.fillRect(0, 280, W, 50);
    range(340, 70, '#76a06a', 70);
    // 村舍屋顶剪影
    for (let i = 0; i < 4; i++) { const x = 380 + i * 110, y = 336 - (i % 2) * 8; g.fillStyle = '#ece0c4'; g.fillRect(x - 36, y - 18, 72, 22); g.fillStyle = '#4a5a6e'; g.beginPath(); g.moveTo(x - 52, y - 14); g.quadraticCurveTo(x - 40, y - 20, x - 30, y - 34); g.lineTo(x + 30, y - 34); g.quadraticCurveTo(x + 40, y - 20, x + 52, y - 14); g.closePath(); g.fill(); }
    // 地面
    g.fillStyle = grad(g, 0, 330, 0, H, ['#a9cf72', '#8fbd5c', '#6f9e43']); g.fillRect(0, 330, W, H - 330);
    const cl = g.createRadialGradient(W * 0.5, H * 0.72, 30, W * 0.5, H * 0.72, 560); cl.addColorStop(0, 'rgba(232,206,150,0.95)'); cl.addColorStop(0.6, 'rgba(222,196,140,0.6)'); cl.addColorStop(1, 'rgba(222,196,140,0)');
    g.fillStyle = cl; g.beginPath(); g.ellipse(W * 0.5, H * 0.72, 620, 200, 0, 0, 7); g.fill();
    for (let i = 0; i < 1600; i++) { const x = R() * W, y = 340 + R() * (H - 340); g.strokeStyle = R() < 0.5 ? 'rgba(60,110,30,0.35)' : 'rgba(200,230,140,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + R() * 4 - 2, y - 3 - R() * 5); g.stroke(); }
    for (let i = 0; i < 120; i++) { const x = R() * W, y = 360 + R() * (H - 360); if (Math.abs(x - W / 2) < 420 && y > 420) continue; g.fillStyle = ['#ffb7d0', '#ffffff', '#fff2a0'][i % 3]; g.beginPath(); g.arc(x, y, 2.5, 0, 7); g.fill(); }
    // 前景桃树
    const peach = (x, y, sc, flip) => {
      g.save(); g.translate(x, y); g.scale(flip ? -sc : sc, sc);
      g.fillStyle = '#5e3c22'; g.beginPath(); g.moveTo(-14, 0); g.quadraticCurveTo(-6, -120, 30, -220); g.lineTo(44, -212); g.quadraticCurveTo(14, -120, 16, 0); g.closePath(); g.fill();
      g.strokeStyle = '#5e3c22'; g.lineWidth = 10; g.beginPath(); g.moveTo(10, -140); g.quadraticCurveTo(60, -170, 110, -180); g.stroke();
      for (let k = 0; k < 70; k++) { const a = R() * 7, r = R() * 110; g.fillStyle = ['#f6a6c4', '#ffc8dc', '#f08ab0', '#ffe0ec'][k % 4]; g.globalAlpha = 0.85; g.beginPath(); g.arc(50 + Math.cos(a) * r, -220 + Math.sin(a) * r * 0.6, 16 + R() * 22, 0, 7); g.fill(); }
      g.globalAlpha = 1; g.restore();
    };
    peach(40, 380, 1, false); peach(W - 30, 360, 0.95, true);
    // 石块
    const rock = (x, y, s) => { g.fillStyle = '#7f8287'; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x - s * 0.8, y - s * 0.7); g.lineTo(x - s * 0.1, y - s); g.lineTo(x + s * 0.8, y - s * 0.6); g.lineTo(x + s, y); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.2)'; g.beginPath(); g.moveTo(x - s * 0.7, y - s * 0.6); g.lineTo(x - s * 0.1, y - s * 0.9); g.lineTo(x, y - s * 0.4); g.closePath(); g.fill(); };
    rock(70, 700, 60); rock(150, 712, 40); rock(W - 90, 706, 54); rock(W - 30, 690, 36);
    // 飘落花瓣
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,170,200,0.7)'; g.beginPath(); g.ellipse(R() * W, R() * H * 0.9, 4, 2, R() * 3, 0, 7); g.fill(); }
    return c;
  }

  return { hero, pet, npc, tree, boar, fox, battleBg };
})();
