/* =====================================================================
   moto.js · el personaje: una moto deportiva de perfil (mira a la derecha)
   con un ojo-faro muy expresivo. Todo vectorial, determinista.
   Coordenadas locales: origen entre ejes a la altura del eje, x→ adelante,
   y↓ ; rueda r=30 → el suelo está en y=+30. Largo total ≈ 185 unidades.
   ===================================================================== */
const MOTO = (() => {
  const R = 30, AX_R = -65, AX_F = 65;
  // Catmull-Rom → Bézier (curvas suaves a partir de puntos clave)
  const cr = (pts, closed = true, k = 1) => {
    const p = new Path2D(), n = pts.length, g = i => closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    p.moveTo(pts[0][0], pts[0][1]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const a = g(i - 1), b = g(i), c = g(i + 1), d = g(i + 2);
      p.bezierCurveTo(b[0] + (c[0] - a[0]) * k / 6, b[1] + (c[1] - a[1]) * k / 6, c[0] - (d[0] - b[0]) * k / 6, c[1] - (d[1] - b[1]) * k / 6, c[0], c[1]);
    }
    if (closed) p.closePath();
    return p;
  };
  /* ---- formas (se construyen una vez) ---- */
  const SH = {
    // carrocería continua: carenado → tanque → cola (como la silueta del logo)
    body:    cr([[86, -38], [78, -56], [62, -70], [46, -76], [32, -80], [14, -81], [-6, -80], [-22, -70], [-46, -70], [-70, -76], [-90, -76], [-95, -68], [-80, -57], [-54, -48], [-30, -42], [-8, -37], [14, -33], [40, -25], [62, -21], [78, -27]], true),
    pad:     cr([[-22, -71], [-46, -74], [-71, -80], [-75, -75], [-47, -69], [-24, -66]], true),
    tankHi:  cr([[26, -78], [8, -82], [-8, -78], [-14, -72], [2, -74], [18, -74]], true),
    engine:  cr([[-24, -27], [8, -29], [26, -17], [23, 0], [-2, 8], [-28, 4], [-35, -10]], true),
    screen:  cr([[64, -70], [52, -92], [38, -99], [33, -84], [46, -77]], true),
  };
  const TAU = Math.PI * 2;
  const clampv = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
  const mixSkin = (a, b, k) => {
    const o = {}; for (const key in a) o[key] = (typeof a[key] === 'string' && a[key][0] === '#') ? mixColor(a[key], b[key], k) : (typeof a[key] === 'number' ? lerp(a[key], b[key], k) : (k < .5 ? a[key] : b[key])); return o;
  };
  const SKINS = {
    old:  { base: '#a79b82', hi: '#c6baa0', sh: '#756a58', trim: '#343944', rim: '#868c96', tire: '#25272c', wear: 1, st1: '#a79b82', st2: '#a79b82', stA: 0 },
    red:  { base: '#e01428', hi: '#ff6068', sh: '#8c0b1d', trim: '#1b2130', rim: '#e3e9f2', tire: '#13161c', wear: 0, st1: '#ffffff', st2: '#0d6fc0', stA: 1 },
    blue: { base: '#0d6fc0', hi: '#54b0f6', sh: '#07407c', trim: '#1b2130', rim: '#e3e9f2', tire: '#13161c', wear: 0, st1: '#ffffff', st2: '#e01428', stA: 1 },
  };
  // manchas de óxido y raspones (fijas)
  const RUST = (() => { const r = rng(5), a = []; for (let i = 0; i < 26; i++) a.push([-90 + r() * 170, -80 + r() * 70, 2 + r() * 6.5]); return a; })();
  const SCR = (() => { const r = rng(9), a = []; for (let i = 0; i < 9; i++) { const x = -80 + r() * 150, y = -78 + r() * 60; a.push([x, y, x + 6 + r() * 14, y + (r() - .5) * 10]); } return a; })();

  function paint(c, path, sk, o = {}) {
    const g = c.createLinearGradient(0, o.y0 ?? -90, 0, o.y1 ?? -34);
    g.addColorStop(0, sk.hi); g.addColorStop(.38, sk.base); g.addColorStop(1, sk.sh);
    c.fillStyle = g; c.fill(path);
    c.save(); c.clip(path);
    if (sk.stA > .01 && !o.noStripe) {            // franjas de marca
      c.globalAlpha = sk.stA; c.fillStyle = sk.st1; c.beginPath(); c.moveTo(-100, -56); c.lineTo(80, -78); c.lineTo(80, -70); c.lineTo(-100, -48); c.fill();
      c.fillStyle = sk.st2; c.beginPath(); c.moveTo(-100, -47); c.lineTo(80, -69); c.lineTo(80, -60); c.lineTo(-100, -38); c.fill(); c.globalAlpha = 1;
    }
    if (sk.wear > .3 && !o.noStripe) {            // panel de repuesto que no combina (azul desteñido) con tornillos
      c.fillStyle = `rgba(104,128,150,${.95 * sk.wear})`; c.beginPath(); c.moveTo(-76, -82); c.lineTo(-44, -82); c.lineTo(-48, -46); c.lineTo(-70, -48); c.fill();
      c.strokeStyle = `rgba(40,52,66,${.6 * sk.wear})`; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-76, -82); c.lineTo(-70, -48); c.moveTo(-44, -82); c.lineTo(-48, -46); c.stroke();
      c.fillStyle = `rgba(46,52,60,${.9 * sk.wear})`; for (const [x, y] of [[-72, -76], [-49, -76], [-52, -54], [-67, -54]]) { c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill(); }
    }
    if (sk.wear > .01) {                          // óxido + raspones
      for (const [x, y, r] of RUST) { const gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, `rgba(138,70,34,${.85 * sk.wear})`); gg.addColorStop(.6, `rgba(120,62,30,${.5 * sk.wear})`); gg.addColorStop(1, 'rgba(120,62,30,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); }
      c.strokeStyle = `rgba(52,46,38,${.5 * sk.wear})`; c.lineWidth = .9; c.lineCap = 'round';
      for (const [a, b, c2, d] of SCR) { c.beginPath(); c.moveTo(a, b); c.lineTo(c2, d); c.stroke(); }
    }
    // brillo de arista (luz arriba-izquierda)
    c.strokeStyle = rgba('#ffffff', (o.rim ?? .35) * (1 - sk.wear * .6)); c.lineWidth = 2.2; c.stroke(path);
    if (o.shine != null) {                         // barrido de brillo
      const u = o.shine, gg = c.createLinearGradient(u - 30, -90, u + 6, -30); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, 'rgba(255,255,255,.75)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gg; c.fillRect(u - 40, -100, 80, 130);
    }
    if (sk.dust > .01) { c.fillStyle = `rgba(150,138,118,${sk.dust * .55})`; c.fillRect(-100, -100, 200, 120); c.fillStyle = `rgba(214,204,186,${sk.dust * .35})`; c.beginPath(); c.ellipse(-20, -70, 70, 10, -.1, 0, TAU); c.fill(); }
    c.restore();
  }

  function wheel(c, x, y, ang, sk, o = {}) {
    const sag = o.sag || 0, dy = R * .1 * sag, isNew = o.isNew, ry = R * (1 - .1 * sag);
    c.save(); c.translate(x, y + dy);
    c.fillStyle = isNew ? sk.tire : sk.tire; c.beginPath(); c.ellipse(0, 0, R, ry, 0, 0, TAU); c.fill();
    c.strokeStyle = isNew ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.07)'; c.lineWidth = 2; c.setLineDash([3.2, 5.2]); c.lineDashOffset = -ang * R; c.beginPath(); c.arc(0, 0, R - 1.6, 0, TAU); c.stroke(); c.setLineDash([]);
    const rg = c.createLinearGradient(-18, -18, 18, 18); const rim = isNew ? sk.rim : '#7b818b'; rg.addColorStop(0, isNew ? '#ffffff' : '#a1a7b0'); rg.addColorStop(1, rim);
    c.fillStyle = rg; c.beginPath(); c.arc(0, 0, 21, 0, TAU); c.fill();
    c.fillStyle = isNew ? '#101420' : '#262a33'; c.beginPath(); c.arc(0, 0, 14.6, 0, TAU); c.fill();
    c.strokeStyle = isNew ? '#dfe6f0' : '#767c86'; c.lineWidth = 3.2; c.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const a = ang + i * TAU / 5; c.beginPath(); c.moveTo(Math.cos(a) * 4, Math.sin(a) * 4); c.lineTo(Math.cos(a) * 14.4, Math.sin(a) * 14.4); c.stroke(); }
    c.fillStyle = isNew ? '#ffffff' : '#8d939c'; c.beginPath(); c.arc(0, 0, 4.4, 0, TAU); c.fill();
    if (!isNew) { c.fillStyle = 'rgba(140,74,36,.65)'; for (let i = 0; i < 4; i++) { const a = i * 1.7 + .5; c.beginPath(); c.arc(Math.cos(a) * 17, Math.sin(a) * 17, 2.4, 0, TAU); c.fill(); } }
    else { c.strokeStyle = sk.wear > .5 ? '#0d6fc0' : sk.base; c.lineWidth = 1.8; c.beginPath(); c.arc(0, 0, 19.6, 0, TAU); c.stroke(); }
    c.restore();
  }

  // ojo-faro: st = { lid, tilt, look:[x,y], happy, glow, pupil, bags, brow:[ang, lift], r }
  function eye(c, cx, cy, sk, st) {
    const r = (st.r || 14.5) * (1 + (st.wide || 0) * .12);
    c.save(); c.translate(cx, cy);
    if (st.glow > 0) { const gg = c.createRadialGradient(0, 0, r * .8, 0, 0, r * (1.9 + st.glow)); gg.addColorStop(0, `rgba(255,236,150,${.7 * st.glow})`); gg.addColorStop(1, 'rgba(255,236,150,0)'); c.fillStyle = gg; c.beginPath(); c.arc(0, 0, r * 3, 0, TAU); c.fill(); }
    // aro cromado
    c.fillStyle = '#1a1f2c'; c.beginPath(); c.arc(0, 0, r + 3.4, 0, TAU); c.fill();
    c.fillStyle = '#c9d0db'; c.beginPath(); c.arc(0, 0, r + 1.8, 0, TAU); c.fill();
    c.fillStyle = '#fbfcff'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
    const lk = st.look || [0, 0], px = lk[0] * r * .42, py = lk[1] * r * .42, pr = r * (st.pupil || .44);
    c.fillStyle = '#12161f'; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(px - pr * .32, py - pr * .34, pr * .3, 0, TAU); c.fill();
    c.beginPath(); c.arc(px + pr * .35, py + pr * .3, pr * .13, 0, TAU); c.fill();
    // párpado superior (con inclinación) del color de la carrocería oscurecido
    const lid = clampv(st.lid ?? 0, 0, 1.02), tilt = st.tilt || 0;
    if (lid > 0) {
      c.save(); c.rotate(tilt); const yy = -r + lid * r * 2.05; c.fillStyle = sk.sh; c.fillRect(-r * 1.6, -r * 1.8, r * 3.2, yy + r * 1.8);
      c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-r * 1.6, yy); c.lineTo(r * 1.6, yy); c.stroke(); c.restore();
    }
    // mejilla / feliz: párpado inferior sube
    const hp = clampv(st.happy || 0);
    if (hp > 0) { const top = r * (.72 - .5 * hp); c.fillStyle = sk.base; c.beginPath(); c.ellipse(0, top + r * 1.1, r * 1.45, r * 1.1, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, top + r * 1.1, r * 1.45, r * 1.1, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    c.restore();
    // ojeras (moto cansada)
    if (st.bags > 0) { c.strokeStyle = `rgba(40,30,30,${.5 * st.bags})`; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.arc(0, r * .15, r + 5, .35, Math.PI - .35); c.stroke(); c.lineWidth = 1.6; c.beginPath(); c.arc(0, r * .15, r + 9, .55, Math.PI - .55); c.stroke(); }
    if (st.smile > 0) { c.strokeStyle = '#141824'; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.arc(r * .35, r * .9, r * 1.05, .2 * Math.PI, (.2 + .6 * st.smile) * Math.PI); c.stroke(); }
    // ceja
    const br = st.brow || [0, 0];
    c.save(); c.translate(0, -r * 1.55 - br[1] * r * .4); c.rotate(br[0]); c.strokeStyle = '#141824'; c.lineWidth = 4.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * .85, 0); c.lineTo(r * .85, 0); c.stroke(); c.restore();
    c.restore();
  }

  function mirrorOld(c, sk) {          // espejo roto, torcido, con cinta
    c.save(); c.translate(36, -97); c.rotate(-.45); c.strokeStyle = '#4a4f59'; c.lineWidth = 3.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-3, -14); c.stroke();
    c.translate(-3, -15); c.rotate(-.55); c.fillStyle = '#31353f'; c.beginPath(); c.ellipse(0, 0, 11, 7.2, 0, 0, TAU); c.fill();
    c.fillStyle = '#9aa3ad'; c.beginPath(); c.ellipse(0, 0, 8.6, 5.3, 0, 0, TAU); c.fill();
    c.strokeStyle = '#2b2e36'; c.lineWidth = 1; c.beginPath(); c.moveTo(-6, -3); c.lineTo(1, 1); c.lineTo(5, -4); c.moveTo(1, 1); c.lineTo(-1, 5); c.stroke();
    c.fillStyle = 'rgba(190,190,180,.9)'; c.fillRect(-2, -9, 5, 9);
    c.restore();
  }
  function mirrorNew(c, sk) {
    c.save(); c.translate(36, -96); c.strokeStyle = '#d8dee8'; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-3, -13); c.stroke();
    c.translate(-4, -15); c.fillStyle = sk.trim; c.beginPath(); c.ellipse(0, 0, 11.5, 7, -.1, 0, TAU); c.fill();
    const g = c.createLinearGradient(-8, -5, 8, 5); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#8fb8e6'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 9, 5, -.1, 0, TAU); c.fill();
    c.restore();
  }

  /* ------------------------------------------------------------------
     MOTO.draw(c, o)
       o.x, o.y (punto de contacto del suelo), o.s (escala), o.flip
       o.pitch (rad, + = cabecea), o.wheelie (rad)
       o.skin  (objeto de SKINS o mezcla)  · o.parts {fw,rw,mir,seat,chain}
       o.eye   (ver eye())  · o.ang {f,r} giro de ruedas · o.sag (llanta baja 0-1)
       o.deco(c) dibuja detalles (nido, planta, telaraña) en coordenadas locales
       o.shine (x local del brillo que barre) · o.sq [sx,sy] squash
     ------------------------------------------------------------------ */
  function draw(c, o) {
    const sk = o.skin, P = o.parts || {}, ang = o.ang || { f: 0, r: 0 }, sag = o.sag || 0;
    c.save(); c.translate(o.x, o.y); c.scale((o.flip ? -1 : 1) * o.s, o.s);
    const sq = o.sq || [1, 1]; c.translate(0, 0); c.scale(sq[0], sq[1]);     // squash anclado al suelo (y local 0 = suelo)
    c.translate(0, -R);                                                        // ahora y=0 es la altura del eje
    if (o.wheelie) { c.translate(AX_R, R); c.rotate(-o.wheelie); c.translate(-AX_R, -R); }
    if (o.pitch) { c.translate(AX_F, R); c.rotate(o.pitch); c.translate(-AX_F, -R); }
    if (sag > 0) { c.translate(AX_F, R); c.rotate(-sag * .045); c.translate(-AX_F, -R); }
    const bob = o.bob || 0; c.translate(0, bob);
    c.lineJoin = 'round'; c.lineCap = 'round';

    // --- rueda trasera (atrás de todo)
    wheel(c, AX_R, 0, ang.r, sk, { isNew: P.rw, sag });
    // --- amortiguador + basculante
    c.strokeStyle = '#464c58'; c.lineWidth = 9; c.beginPath(); c.moveTo(-24, -1); c.lineTo(AX_R, 1); c.stroke();
    c.strokeStyle = '#c9d0db'; c.lineWidth = 4; c.beginPath(); c.moveTo(-38, -38); c.lineTo(-32, -8); c.stroke();
    c.strokeStyle = P.rw ? sk.base : '#c04a2a'; c.lineWidth = 3; c.setLineDash([2.4, 2.4]); c.beginPath(); c.moveTo(-37.4, -34); c.lineTo(-32.6, -12); c.stroke(); c.setLineDash([]);
    // cadena (nueva = brillante)
    c.strokeStyle = P.chain ? '#e8edf5' : '#6b4a32'; c.lineWidth = 2; c.setLineDash([1.6, 1.6]); c.beginPath(); c.moveTo(-20, 8); c.lineTo(AX_R, 13); c.stroke(); c.setLineDash([]);
    // --- escape
    c.strokeStyle = '#8f98a5'; c.lineWidth = 7; c.beginPath(); c.moveTo(-20, 8); c.quadraticCurveTo(-48, 14, -66, -8); c.stroke();
    c.save(); c.translate(-74, -15); c.rotate(-.36);
    const eg = c.createLinearGradient(0, -9, 0, 9); eg.addColorStop(0, P.rw ? '#f4f7fb' : '#aab2bd'); eg.addColorStop(1, P.rw ? '#8b95a5' : '#5d636d');
    c.fillStyle = eg; c.beginPath(); c.roundRect(-22, -6.5, 46, 13, 6.5); c.fill(); c.fillStyle = '#10131a'; c.beginPath(); c.ellipse(-22, 0, 2.8, 6, 0, 0, TAU); c.fill(); c.restore();
    // --- motor
    c.fillStyle = '#2a303c'; c.fill(SH.engine);
    c.strokeStyle = '#4b5362'; c.lineWidth = 1.6; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-4 + i * 3, -30 + i * 9); c.lineTo(22, -26 + i * 8); c.stroke(); }
    c.fillStyle = '#a2abb8'; c.beginPath(); c.arc(-12, -4, 9, 0, TAU); c.fill(); c.fillStyle = '#444b58'; c.beginPath(); c.arc(-12, -4, 5.4, 0, TAU); c.fill();
    // --- rueda delantera + horquilla (detrás de la carrocería)
    c.strokeStyle = '#c7cfda'; c.lineWidth = 5.6; c.beginPath(); c.moveTo(44, -60); c.lineTo(AX_F, 0); c.stroke();
    c.strokeStyle = '#3a404c'; c.lineWidth = 8.4; c.beginPath(); c.moveTo(56, -26); c.lineTo(AX_F, 0); c.stroke();
    wheel(c, AX_F, 0, ang.f, sk, { isNew: P.fw });
    c.strokeStyle = P.fw ? '#dfe5ee' : '#8a909a'; c.lineWidth = 2.4; c.beginPath(); c.arc(AX_F, 0, 13.4, -.4, 2.2); c.stroke();                       // disco de freno
    c.fillStyle = P.fw ? (sk.wear > .5 ? '#0d6fc0' : sk.base) : '#b05a2a'; c.beginPath(); c.roundRect(AX_F - 20, -9, 8, 12, 2); c.fill();                                           // pinza
    // --- carrocería continua
    paint(c, SH.body, sk, { y0: -86, y1: -22, shine: o.shine });
    c.save(); c.clip(SH.body); c.fillStyle = `rgba(255,255,255,${.22 * (1 - sk.wear * .7)})`; c.fill(SH.tankHi); c.restore();
    // separación carenado/tanque (línea de panel)
    c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(30, -80); c.quadraticCurveTo(24, -62, 30, -35); c.stroke();
    // asiento
    if (P.seat) { c.fillStyle = '#10141c'; c.fill(SH.pad); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1.2; c.stroke(SH.pad); }
    else {
      c.fillStyle = '#6a5a43'; c.fill(SH.pad); c.strokeStyle = '#2b241a'; c.lineWidth = 1.2; c.stroke(SH.pad);
      c.strokeStyle = 'rgba(205,205,196,.95)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-52, -76); c.lineTo(-44, -68); c.moveTo(-44, -76); c.lineTo(-52, -68); c.stroke();   // cinta gris
    }
    // cinta en X sobre el tanque (moto vieja)
    if (sk.wear > .5) { c.save(); c.clip(SH.body); c.strokeStyle = `rgba(214,214,206,${.92 * sk.wear})`; c.lineWidth = 3.6; c.beginPath(); c.moveTo(-8, -76); c.lineTo(14, -52); c.moveTo(14, -78); c.lineTo(-6, -52); c.stroke(); c.restore(); }
    // parabrisas
    c.fillStyle = 'rgba(20,30,52,.5)'; c.fill(SH.screen); c.strokeStyle = 'rgba(255,255,255,.42)'; c.lineWidth = 1; c.stroke(SH.screen);
    // --- manillar + espejo
    c.strokeStyle = '#161a24'; c.lineWidth = 5; c.beginPath(); c.moveTo(34, -82); c.lineTo(20, -85); c.stroke();
    if (P.mir) mirrorNew(c, sk); else mirrorOld(c, sk);
    // --- decoraciones del mundo (nido, planta, telaraña) en coords locales
    if (o.deco) o.deco(c);
    // --- el ojo
    if (o.eye) eye(c, 55, -52, sk, o.eye);
    c.restore();
  }
  return { draw, wheel, eye, mirrorNew, SKINS, mixSkin, cr, SH, R, AX_R, AX_F };
})();
