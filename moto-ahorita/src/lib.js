/* =====================================================================
   lib.js · utilidades de la pieza "AHORITA": paleta, texto, burbujas,
   destellos, fondos y props. Todo es función pura del tiempo.
   ===================================================================== */
const W = 1080, H = 1920;
const C = {
  navy: '#0a1430', ink: '#0e1424', blue: '#0d6fc0', blueL: '#54b0f6', blueD: '#07407c',
  red: '#e01428', redL: '#ff5a64', redD: '#8c0b1d', white: '#ffffff', cream: '#f6f1e4', yellow: '#ffcf3d',
};
const FD = 'Anton, Impact, "Arial Narrow", sans-serif', FT = 'Inter, system-ui, sans-serif';
const GROUND = 1310;                         // y del suelo (en el mundo)
const CX = 490;                              // centro óptico de textos (zona segura TikTok: x ≤ 929)
const pop = (t, t0, d = .28, s = 2.6) => E.outBack(inv(t0, t0 + d, t), s);
const fadeIn = (t, a, b) => E.outC(inv(a, b, t));
const fadeOut = (t, a, b) => 1 - E.inC(inv(a, b, t));
const win = (t, a, b, fi = .15, fo = .2) => Math.min(inv(a, a + fi, t), 1 - inv(b - fo, b, t));   // ventana con entrada/salida

/* ------------------------------------------------ texto */
const _cap = {};
function capH(c, font, size) { const k = font + size; if (_cap[k] == null) { c.save(); c.font = `${size}px ${font}`; _cap[k] = c.measureText('H').actualBoundingBoxAscent; c.restore(); } return _cap[k]; }
function txt(c, str, x, y, o = {}) { return STAGE.txt(c, str, x, y, { font: FD, weight: 400, ...o }); }
// pastilla con texto centrado; o: {size, bg, fg, px, py, r, sc, rot, font, weight, alpha, shadow, maxW}
function pill(c, str, x, y, o = {}) {
  const size = o.size || 100, font = o.font || FD, weight = o.weight ?? 400, px = o.px ?? size * .34, py = o.py ?? size * .2, sc = o.sc ?? 1;
  c.save(); c.translate(x, y); c.rotate(o.rot || 0); c.scale(sc, sc); c.globalAlpha *= o.alpha ?? 1;
  c.font = `${weight} ${size}px ${font}`; if ('letterSpacing' in c) c.letterSpacing = (o.tracking || 0) + 'px';
  const w = c.measureText(str).width, ch = capH(c, font, size), bw = w + px * 2, bh = ch + py * 2;
  if (o.bg) { c.shadowColor = 'rgba(4,10,28,.38)'; c.shadowBlur = size * .22; c.shadowOffsetY = size * .08; c.fillStyle = o.bg; c.beginPath(); c.roundRect(-bw / 2, -bh / 2, bw, bh, o.r ?? bh * .24); c.fill(); c.shadowColor = 'transparent'; }
  c.restore();
  c.save(); c.translate(x, y); c.rotate(o.rot || 0); c.scale(sc, sc); c.globalAlpha *= o.alpha ?? 1;
  txt(c, str, 0, ch / 2, { size, font, weight, fill: o.fg || '#fff', tracking: o.tracking, shadow: o.shadow, role: o.role || 'key' });
  c.restore();
  return bw * sc;
}
// burbuja de diálogo. o: {tail:[x,y] punta, tx (x de la base de la cola), bg, fg, size, alpha, sc}
function bubble(c, str, x, y, o = {}) {
  const size = o.size || 56, font = FT, weight = 800, px = size * .62, py = size * .5, sc = o.sc ?? 1;
  c.save(); c.font = `${weight} ${size}px ${font}`; const tw = Math.min(c.measureText(str).width, o.maxW || 9999), bw = tw + px * 2, bh = size + py * 2; c.restore();
  c.save(); c.translate(x, y); c.scale(sc, sc); c.globalAlpha *= o.alpha ?? 1;
  c.shadowColor = 'rgba(4,10,28,.4)'; c.shadowBlur = 26; c.shadowOffsetY = 10; c.fillStyle = o.bg || '#fff';
  c.beginPath(); c.roundRect(-bw / 2, -bh / 2, bw, bh, bh * .36); c.fill();
  if (o.tail) { const [tx, ty] = o.tail, bx = clamp(o.tx ?? tx, -bw / 2 + bh * .5, bw / 2 - bh * .5), dir = ty < 0 ? -1 : 1; c.beginPath(); c.moveTo(bx - 22, dir * (bh / 2 - 2)); c.lineTo(tx, ty); c.lineTo(bx + 22, dir * (bh / 2 - 2)); c.closePath(); c.fill(); }
  c.shadowColor = 'transparent'; c.restore();
  c.save(); c.translate(x, y); c.scale(sc, sc); c.globalAlpha *= o.alpha ?? 1;
  if (o.shown != null) {
    c.save(); c.font = `800 ${size}px ${font}`; const full = c.measureText(str).width; c.restore();
    c.save(); c.font = `800 ${size}px ${font}`; c.textAlign = 'left'; c.fillStyle = o.fg || '#0e1424'; c.fillText(o.shown, -full / 2, size * .34); c.restore();   // texto parcial: sin registrar (sólo cuenta el completo)
    const tr = c.getTransform(), sx = Math.hypot(tr.a, tr.b);
    STAGE.note(str, tr.e - full / 2 * sx, tr.f + (size * .34 - size * .72) * sx, full * sx, size * .95 * sx, size * .72 * sx, 'key');
  }
  else txt(c, str, 0, size * .34, { size, font, weight: 800, fill: o.fg || '#0e1424', maxW: o.maxW, role: o.role || 'key' });
  c.restore();
  return bw * sc;
}

/* ------------------------------------------------ destellos y efectos */
function star4(c, x, y, r, rot = 0, col = '#fff') {
  c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * .22 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.restore();
}
// ráfaga de chispas desde (x,y) a partir de t0 (sin estado)
function sparks(c, T, t0, x, y, n = 14, life = .7, R = 160, seed = 1, col = '#fff') {
  const a = T - t0; if (a < 0 || a > life) return;
  for (let i = 0; i < n; i++) {
    const r = rng(seed * 131 + i * 17), ang = r() * TAU, d = (.35 + r() * .65) * R, k = a / life, e = E.outC(k);
    const px = x + Math.cos(ang) * d * e, py = y + Math.sin(ang) * d * e + 40 * k * k;
    star4(c, px, py, (10 + r() * 16) * (1 - k * k), ang + k * 2, col);
  }
}
function ring(c, T, t0, x, y, R = 220, life = .5, col = '#fff', lw = 10) {
  const a = (T - t0) / life; if (a < 0 || a > 1) return; const e = E.outQuart(a);
  c.save(); c.strokeStyle = rgba(col, (1 - a) * .9); c.lineWidth = lw * (1 - a) + 1; c.beginPath(); c.arc(x, y, R * e, 0, TAU); c.stroke(); c.restore();
}
function speedLines(c, T, y0, y1, dir = 1, alpha = .5, seed = 3, n = 26) {
  c.save(); c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const r = rng(seed * 77 + i), y = lerp(y0, y1, r()), len = 160 + r() * 380, sp = 2600 + r() * 2200, x = ((r() * (W + 800) + dir * T * sp) % (W + 800) + (W + 800)) % (W + 800) - 400;
    c.strokeStyle = rgba('#ffffff', alpha * (.35 + r() * .65)); c.lineWidth = 3 + r() * 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x - dir * len, y); c.stroke();
  }
  c.restore();
}
function puffs(c, T, t0, x, y, n = 6, life = .9, dx = -40, dy = -90, size = 20, col = '#cfd6e2', seed = 4) {
  for (let i = 0; i < n; i++) {
    const a = T - t0 - i * .09; if (a < 0 || a > life) continue; const k = a / life, r = rng(seed * 31 + i)();
    c.fillStyle = rgba(col, .6 * (1 - k)); c.beginPath(); c.arc(x + dx * k * (.6 + r) + Math.sin(k * 6 + i) * 6, y + dy * k, size * (.6 + k * 1.6), 0, TAU); c.fill();
  }
}

/* ------------------------------------------------ grano + viñeta (precalculado) */
let GRAIN = null;
function grain(c, T, vig = .34) {
  if (!GRAIN) {
    GRAIN = [0, 1, 2, 3].map(f => {
      const cv = document.createElement('canvas'); cv.width = W / 2; cv.height = H / 2; const g = cv.getContext('2d');
      const id = g.createImageData(cv.width, cv.height), d = id.data, r = rng(11 + f);
      for (let i = 0; i < d.length; i += 4) { const n = r(), v = n > .5 ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.abs(n - .5) * 2 * 26; }
      g.putImageData(id, 0, 0); return cv;
    });
    const v = document.createElement('canvas'); v.width = 270; v.height = 480; const g = v.getContext('2d');
    const rg = g.createRadialGradient(135, 230, 120, 135, 240, 330); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = rg; g.fillRect(0, 0, 270, 480); GRAIN.vig = v;
  }
  c.save(); c.globalAlpha = vig; c.drawImage(GRAIN.vig, 0, 0, W, H); c.globalAlpha = 1; c.drawImage(GRAIN[Math.floor(T * 24) % 4], 0, 0, W, H); c.restore();
}

/* ------------------------------------------------ logo (vectorizado del original) */
function drawLogo(c, cx, cy, w, o = {}) {
  const k = w / LOGO.w; c.save(); c.translate(cx, cy); c.rotate(o.rot || 0); c.scale(k * (o.sc ?? 1), k * (o.sc ?? 1)); c.translate(-282, -86);
  c.globalAlpha *= o.alpha ?? 1;
  c.shadowColor = 'rgba(2,8,24,.5)'; c.shadowBlur = 14 / k; c.shadowOffsetY = 6 / k;
  c.fillStyle = '#fff'; c.fill(LOGO.P.white, 'evenodd'); c.shadowColor = 'transparent';
  c.fillStyle = '#e01428'; c.fill(LOGO.P.red, 'evenodd'); c.fillStyle = '#0d6fc0'; c.fill(LOGO.P.blue, 'evenodd');
  c.fillStyle = '#e01428'; c.fill(LOGO.P.moto, 'evenodd');
  // "motors": recreado tipográficamente (el original es demasiado pequeño para vectorizar)
  c.font = '800 17px Inter, sans-serif'; if ('letterSpacing' in c) c.letterSpacing = '13px'; c.textAlign = 'center';
  c.lineJoin = 'round'; c.lineWidth = 6; c.strokeStyle = '#fff'; c.strokeText('motors', 284, 143); c.lineWidth = 3; c.strokeStyle = '#e01428'; c.strokeText('motors', 284, 143); c.fillStyle = '#0d6fc0'; c.fillText('motors', 284, 143);
  if (o.shine != null) {                         // barrido de brillo recortado al logo
    c.save(); c.clip(LOGO.P.white); const u = lerp(-80, LOGO.w + 80, o.shine), g = c.createLinearGradient(u - 40, 0, u + 40, 60); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, LOGO.w, LOGO.h); c.restore();
  }
  c.restore();
}

/* ------------------------------------------------ fondos */
const sky = (day) => ({ t: mixColor('#070d24', '#79bff5', day), b: mixColor('#1b2650', '#e8f4ff', day) });
function garageBg(c, T, day, clockT, spin) {
  // pared
  const wall = [mixColor('#2c374a', '#6a7b93', day), mixColor('#1d2635', '#46556b', day)];
  let g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, wall[0]); g.addColorStop(1, wall[1]); c.fillStyle = g; c.fillRect(0, 0, W, GROUND + 4);
  // paneles verticales muy suaves (garage)
  c.fillStyle = 'rgba(0,0,0,.05)'; for (let x = 0; x < W; x += 180) c.fillRect(x, 0, 6, GROUND);
  // zócalo + piso
  c.fillStyle = mixColor('#202a3a', '#394860', day); c.fillRect(0, GROUND - 70, W, 74);
  g = c.createLinearGradient(0, GROUND, 0, H); g.addColorStop(0, mixColor('#161d2a', '#2c3a4e', day)); g.addColorStop(1, '#0d121b'); c.fillStyle = g; c.fillRect(0, GROUND, W, H - GROUND);
  c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(0, GROUND, W, 3);
  // ventana (derecha) con sol/luna
  const wx = 700, wy = 600, ww = 250, wh = 270, s = sky(day);
  c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 24; c.fillStyle = '#9aa7ba'; c.fillRect(wx - 14, wy - 14, ww + 28, wh + 28); c.restore();
  g = c.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, s.t); g.addColorStop(1, s.b); c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
  c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip();
  const cyc = spin ? fract((T - 2) * 1.0 + .25) : fract(.62);   // el sol alcanza su punto más alto cuando la luz es máxima
  const sx = wx + ww * lerp(-.1, 1.1, cyc), sy = wy + wh * (.78 - .62 * Math.sin(Math.PI * clamp(cyc, 0, 1)));
  c.fillStyle = rgba('#fff3b0', .35 + .65 * day); c.beginPath(); c.arc(sx, sy, 34, 0, TAU); c.fill();
  const mc = fract(cyc + .5), mx = wx + ww * lerp(-.1, 1.1, mc), my = wy + wh * (.78 - .62 * Math.sin(Math.PI * mc)); c.fillStyle = rgba('#e8efff', (1 - day) * .95); c.beginPath(); c.arc(mx, my, 24, 0, TAU); c.fill();
  c.restore();
  c.fillStyle = '#9aa7ba'; c.fillRect(wx + ww / 2 - 6, wy, 12, wh); c.fillRect(wx, wy + wh / 2 - 6, ww, 12);
  // haz de luz hacia la escena
  c.save(); c.globalAlpha = .08 + .2 * day; g = c.createLinearGradient(wx, wy, wx - 420, wy + 640); g.addColorStop(0, '#fff6cf'); g.addColorStop(1, 'rgba(255,246,207,0)'); c.fillStyle = g;
  c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + ww, wy); c.lineTo(wx + ww - 320, GROUND); c.lineTo(wx - 560, GROUND); c.closePath(); c.fill(); c.restore();
  // motas de polvo en el haz
  for (let i = 0; i < 34; i++) { const r = rng(40 + i), u = r(), x = lerp(wx + ww - 40, wx - 430, u) + Math.sin(T * (.5 + r()) + i) * 14, y = lerp(wy + 40, GROUND - 120, u) + Math.cos(T * (.4 + r()) + i * 2) * 12; c.fillStyle = rgba('#fff', (.2 + .5 * r()) * (.15 + .6 * day)); c.beginPath(); c.arc(x, y, 1.6 + r() * 2.6, 0, TAU); c.fill(); }
  // reloj de pared (izquierda)
  clock(c, 150, 722, 78, clockT);
  // foco cálido detrás de la moto (la hace despegar del fondo)
  g = c.createRadialGradient(500, 1010, 60, 500, 1030, 640); g.addColorStop(0, `rgba(255,214,150,${.10 + .12 * day})`); g.addColorStop(1, 'rgba(255,214,150,0)'); c.fillStyle = g; c.fillRect(0, 500, W, 900);
}
function clock(c, x, y, r, t) {
  c.save(); c.translate(x, y); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 20; c.shadowOffsetY = 8;
  c.fillStyle = '#1b2230'; c.beginPath(); c.arc(0, 0, r + 10, 0, TAU); c.fill(); c.shadowColor = 'transparent';
  c.fillStyle = '#f2ede0'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  c.strokeStyle = '#2b3342'; c.lineWidth = 4; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; c.beginPath(); c.moveTo(Math.sin(a) * (r - 14), -Math.cos(a) * (r - 14)); c.lineTo(Math.sin(a) * (r - 4), -Math.cos(a) * (r - 4)); c.stroke(); }
  const m = t * TAU, h = t * TAU / 12; c.lineCap = 'round';
  c.strokeStyle = '#1b2230'; c.lineWidth = 7; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(h) * r * .5, -Math.cos(h) * r * .5); c.stroke();
  c.lineWidth = 4.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(m) * r * .78, -Math.cos(m) * r * .78); c.stroke();
  c.fillStyle = '#e01428'; c.beginPath(); c.arc(0, 0, 6, 0, TAU); c.fill();
  c.restore();
}
// escenario de marca (azul vivo)
let DOTS = null;
function brandBg(c, T, o = {}) {
  const k = o.k ?? 1;
  let g = c.createRadialGradient(W * .5, H * .36, 60, W * .5, H * .5, 1250); g.addColorStop(0, o.c0 || '#2b9bf0'); g.addColorStop(.5, o.c1 || '#0f63b8'); g.addColorStop(1, o.c2 || '#062a63'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  // bandas diagonales suaves
  c.save(); c.globalAlpha = .12; c.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { const x = ((i * 380 + T * 38) % 1500) - 300; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 150, 0); c.lineTo(x - 450, H); c.lineTo(x - 600, H); c.closePath(); c.fill(); } c.restore();
  // puntos de media tinta
  if (!DOTS) { DOTS = document.createElement('canvas'); DOTS.width = 540; DOTS.height = 960; const d = DOTS.getContext('2d'); d.fillStyle = '#fff'; for (let y = 0; y < 960; y += 30) for (let x = ((y / 30) % 2) * 15; x < 540; x += 30) { const rr = 2.2 * (1 - y / 1100); d.beginPath(); d.arc(x, y, rr, 0, TAU); d.fill(); } }
  c.save(); c.globalAlpha = .1; c.drawImage(DOTS, 0, 0, W, H); c.restore();
  // piso
  g = c.createLinearGradient(0, GROUND - 30, 0, H); g.addColorStop(0, 'rgba(4,22,60,.0)'); g.addColorStop(.08, 'rgba(4,22,60,.55)'); g.addColorStop(1, 'rgba(3,12,34,.95)'); c.fillStyle = g; c.fillRect(0, GROUND - 30, W, H - GROUND + 30);
  c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0, GROUND, W, 3);
}
function ctaBg(c, T) {
  let g = c.createRadialGradient(W * .5, H * .3, 60, W * .5, H * .5, 1300); g.addColorStop(0, '#16397c'); g.addColorStop(.55, '#0a1d49'); g.addColorStop(1, '#050c22'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.globalAlpha = .07; if (DOTS) c.drawImage(DOTS, 0, 0, W, H); c.restore();
  // cinta tricolor en la zona inferior (no lleva texto: la interfaz de TikTok la tapa)
  c.save(); c.translate(W / 2, 1735 + Math.sin(T * .8) * 6); c.rotate(-.17);
  c.fillStyle = C.red; c.fillRect(-1000, -70, 2000, 86); c.fillStyle = '#fff'; c.fillRect(-1000, 16, 2000, 20); c.fillStyle = C.blue; c.fillRect(-1000, 36, 2000, 52);
  c.restore();
  // brillo suave arriba del logo
  g = c.createRadialGradient(W * .5, 330, 10, W * .5, 330, 520); g.addColorStop(0, 'rgba(120,180,255,.22)'); g.addColorStop(1, 'rgba(120,180,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, 800);
}
/* ------------------------------------------------ props de abandono */
function nest(c, k, T) {            // nido sobre el asiento (coords locales de la moto), k 0..1
  if (k <= 0) return; const s = E.outBack(k, 2.4);
  c.save(); c.translate(-48, -79); c.scale(s, s);
  c.fillStyle = '#6b4a2a'; c.beginPath(); c.ellipse(0, 0, 17, 7, 0, 0, TAU); c.fill();
  c.strokeStyle = '#8a6238'; c.lineWidth = 1.6; c.lineCap = 'round'; const r = rng(77); for (let i = 0; i < 14; i++) { const a = r() * TAU, d = r() * 13; c.beginPath(); c.moveTo(Math.cos(a) * d - 6, Math.sin(a) * d * .35); c.lineTo(Math.cos(a) * d + 6, Math.sin(a) * d * .35 - 2 + r() * 3); c.stroke(); }
  c.restore();
}
function eggs(c, T, t0) {            // huevos que asoman uno a uno
  for (let i = 0; i < 3; i++) { const k = pop(T, t0 + i * .16, .22, 3); if (k <= 0) continue; c.save(); c.translate(-54 + i * 6.4, -83 - Math.abs(Math.sin(k * 3)) * 0); c.scale(k, k); c.fillStyle = '#9fd6e8'; c.beginPath(); c.ellipse(0, 0, 4, 5.2, .15 * (i - 1), 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(-1.2, -1.8, 1.1, 1.8, 0, 0, TAU); c.fill(); c.restore(); }
}
function sprout(c, k, T) {          // planta que crece del escape
  if (k <= 0) return; const h = 34 * E.outCirc(k), sw = Math.sin(T * 2.2) * 2 * k;
  c.save(); c.translate(-92, -10); c.strokeStyle = '#5da84a'; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(sw, -h * .5, sw * 1.6, -h); c.stroke();
  const lk = E.outBack(inv(.45, 1, k), 2); c.fillStyle = '#7ccf5d'; for (const sgn of [-1, 1]) { c.save(); c.translate(sw * 1.6, -h); c.rotate(sgn * (.9 + Math.sin(T * 3) * .06)); c.scale(lk, lk); c.beginPath(); c.ellipse(sgn * 7, -3, 9, 4.6, sgn * -.2, 0, TAU); c.fill(); c.restore(); }
  c.restore();
}
