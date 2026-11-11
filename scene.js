/* Launch On Cult — hand-coded, per-pixel lit pixel-art temple (no external art) */
(() => {
  const cv = document.getElementById("rite"); if (!cv) return;
  const ctx = cv.getContext("2d");
  const H = 240; let W = 430, CX = 215;
  const mark = new Image(); mark.src = "mark.png";
  let bg = null, mx = .5, my = .5, blink = 0, nextBlink = 3, t = 0;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16 - .5);
  const RAMP = []; for (let i = 0; i < 18; i++) { const k = i / 17; RAMP.push([4 + k * 190, 4 + k * 186, 7 + k * 196]); }
  const WARM = [255, 158, 78], COOL = [150, 120, 255];
  let buf, Wd;

  function put(x, y, r, g, b) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255; }
  function light(x, y) { // static lighting field
    const dw = Math.hypot((x - CX) / 1.4, y - 64), da = Math.hypot((x - CX) / 1.8, (y - 170) * 1.2);
    return { cool: .55 * Math.exp(-(dw * dw) / 5200), warm: .6 * Math.exp(-(da * da) / 4200) };
  }
  function shade(x, y, v, warmMul = 1, coolMul = 1) {
    const L = light(x, y); v = v * (.42 + L.cool * coolMul * .9 + L.warm * warmMul) + BAYER[(y & 3) * 4 + (x & 3)] * .045;
    const idx = Math.max(0, Math.min(17, Math.round(v * 17)));
    let [r, g, b] = RAMP[idx];
    const wm = L.warm * warmMul * .55 * Math.min(1, v * 2.2), cm = L.cool * coolMul * .35 * Math.min(1, v * 2.2);
    r += (WARM[0] - r) * wm + (COOL[0] - r) * cm; g += (WARM[1] - g) * wm + (COOL[1] - g) * cm; b += (WARM[2] - b) * wm + (COOL[2] - b) * cm;
    put(x, y, r, g, b);
  }
  let seed = 9; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

  /* hooded figure: per-pixel cylindrical shading with folds */
  function figure(cx, top, w, h, base, o = {}) {
    const facing = Math.sign(CX - cx) || 0;
    for (let y = 0; y < h; y++) {
      const k = y / h; let hw;
      if (k < .2) hw = w * .5 * (.34 + .66 * Math.sqrt(Math.max(0, 1 - Math.pow((.2 - k) / .2, 2))));
      else if (k < .34) hw = w * .5 * (1 + .25 * (k - .2) / .14);
      else hw = w * .5 * (1.25 + .22 * (k - .34) / .66);
      if (k < .2) hw *= .72;
      for (let x = -Math.floor(hw); x <= Math.floor(hw); x++) {
        const nx = x / hw, curv = Math.sqrt(Math.max(0, 1 - nx * nx));
        let v = base * (.55 + .45 * curv) + facing * nx * .1 * base;
        if (k > .3) v += Math.sin(nx * 9 + k * 3) * .06 * base * (k);
        { const fx = x / (w * .19), fy = (k - .125) / .075; if (fx * fx + fy * fy < 1) v *= o.faceDark ?? .12; } // hood opening
        if (o.robeTrim && k > .34 && Math.abs(x) < 1.2) v = .9;
        shade(cx + x, top + y, v, o.warm ?? 1, o.cool ?? 1);
      }
    }
  }
  function rect(x0, y0, w, h, v, f) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) shade(x, y, typeof v === "function" ? v(x - x0, y - y0) : v, f?.warm, f?.cool); }
  function solid(x0, y0, w, h, c) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) put(x, y, ...c); }

  function resize() {
    const r = cv.getBoundingClientRect();
    W = Math.max(360, Math.round(H * r.width / Math.max(1, r.height)));
    CX = Math.floor(W / 2);
    cv.width = W; cv.height = H; buildBg();
  }

  function buildBg() {
    seed = 9;
    bg = document.createElement("canvas"); bg.width = W; bg.height = H;
    const c = bg.getContext("2d"); const id = c.createImageData(W, H); buf = id.data;
    // wall: bricks with per-brick tone
    for (let y = 0; y < 206; y++) for (let x = 0; x < W; x++) {
      const row = Math.floor(y / 8), off = row % 2 ? 9 : 0, bx = Math.floor((x + off) / 18);
      const mortar = y % 8 === 7 || (x + off) % 18 === 17;
      const tone = .2 + hash(bx, row) * .1 + (hash(x, y) > .97 ? .05 : 0);
      shade(x, y, mortar ? .09 : tone * (1 - y / 900));
    }
    // arch niche behind idol
    for (let y = 18; y < 206; y++) for (let x = -70; x <= 70; x++) {
      const inArch = y > 18 + 70 - Math.sqrt(Math.max(0, 70 * 70 - x * x)) * 1;
      if (inArch) shade(CX + x, y, .1 + .05 * (1 - Math.abs(x) / 70));
    }
    for (let a = 0; a <= Math.PI; a += .004) for (let r = 70; r < 76; r++) shade(CX + Math.cos(a) * r, 88 - Math.sin(a) * r * 1, r < 72 ? .5 : .32);
    // rose window
    const wy = 64, R = 46;
    for (let y = -R - 6; y <= R + 6; y++) for (let x = -R - 6; x <= R + 6; x++) {
      const d = Math.hypot(x, y); if (d > R + 6) continue;
      const X = CX + x, Y = wy + y;
      if (d > R) { shade(X, Y, d > R + 3 ? .38 : .55); continue; }
      if (d > R - 2) { put(X, Y, 18, 16, 24); continue; }
      if (d < 19) { if (d > 17) put(X, Y, 30, 28, 38); else put(X, Y, 16 + 10 * (1 - d / 17), 14 + 8 * (1 - d / 17), 26 + 18 * (1 - d / 17)); continue; }
      const a = (Math.atan2(y, x) + Math.PI) / (Math.PI * 2), seg = Math.floor(a * 12), ap = a * 12 - seg;
      const petal = Math.abs(ap - .5) * 2, ring = d < 31;
      if (ap < .07 || ap > .93 || Math.abs(d - 31) < .9 || (ring ? false : petal > .9 - (d - 31) / 40)) { put(X, Y, 22, 20, 28); continue; }
      const pal = ring ? [[120, 36, 70], [64, 40, 150], [24, 110, 104]] : [[140, 18, 40], [88, 52, 190], [170, 110, 28], [24, 120, 112]];
      const col = pal[seg % pal.length], lum = .62 + .38 * (1 - d / R) + BAYER[(Y & 3) * 4 + (X & 3)] * .2;
      put(X, Y, col[0] * lum, col[1] * lum, col[2] * lum);
    }
    // columns (cylindrical shading) + capitals
    const cols = []; for (let k = 0; k < 14; k++) { cols.push(CX - 128 - k * 64); cols.push(CX + 112 + k * 64); }
    cols.forEach(x0 => {
      if (x0 < -24 || x0 > W) return;
      for (let y = 14; y < 196; y++) for (let x = 0; x < 18; x++) { const nx = x / 17 * 2 - 1; const side = (x0 < CX ? nx : -nx); let v = .24 + .3 * Math.sqrt(1 - nx * nx) + .08 * side; if (x % 6 === 3) v *= .8; shade(x0 + x, y, v); }
      rect(x0 - 4, 8, 26, 7, (x, y) => y < 2 ? .62 : .42); rect(x0 - 2, 14, 22, 3, .3);
      rect(x0 - 4, 194, 26, 8, (x, y) => y < 2 ? .55 : .36);
    });
    // banners
    [CX - 70, CX + 50].forEach(bx => {
      rect(bx - 3, 16, 26, 3, (x, y) => y ? .45 : .7);
      for (let y = 19; y < 112; y++) for (let x = 0; x < 20; x++) {
        if (y > 100 && Math.abs(x - 9.5) < (y - 100) * .85) continue;
        const nx = x / 19 * 2 - 1, wave = .82 + .18 * Math.sin(x * .9 + 1), lum = (.55 + .3 * Math.sqrt(1 - nx * nx)) * wave;
        const L = light(bx + x, y), b = BAYER[(y & 3) * 4 + (x & 3)] * .1;
        put(bx + x, y, (150 + 60 * L.warm) * (lum + b), (14 + 20 * L.warm) * (lum + b), (30 + 10 * L.warm) * (lum + b));
      }
      for (let i = 0; i < 13; i++) for (let j = -Math.floor(i / 2); j <= Math.floor(i / 2); j++) put(bx + 10 + j, 40 + i, 220, 214, 196);
      for (let j = -3; j <= 3; j++) for (let i = 0; i < 2; i++) put(bx + 10 + j, 48 + i, Math.abs(j) < 2 ? 10 : 220, Math.abs(j) < 2 ? 10 : 214, Math.abs(j) < 2 ? 12 : 196);
      solid(bx, 68, 20, 1, [243, 183, 79]); solid(bx, 72, 20, 1, [140, 96, 30]);
    });
    // throne back
    for (let y = 80; y < 182; y++) for (let x = -40; x <= 40; x++) { const top = 80 + Math.abs(x) * .4; if (y < top) continue; shade(CX + x, y, .2 + .1 * (1 - Math.abs(x) / 40) + (Math.abs(x) > 36 ? .12 : 0)); }
    for (let i = 0; i < 10; i++) rect(CX - 1 - i, 66 + i, 2 + i * 2, 1, .42);
    // idol
    figure(CX, 92, 68, 98, .5, { faceDark: .05 });
    // idol sleeves / hands
    for (const s of [-1, 1]) for (let y = 0; y < 12; y++) for (let x = 0; x < 20; x++) { const e = Math.pow((x - 10) / 10, 2) + Math.pow((y - 6) / 6, 2); if (e < 1) shade(CX + s * (12 + x) - (s < 0 ? 19 : 0), 144 + y, .42 + .2 * (1 - e)); }
    // flanking statues on pedestals
    [CX - 96, CX + 96].forEach((x, i) => {
      rect(x - 22, 176, 44, 22, (a, b) => b < 2 ? .6 : b > 19 ? .2 : .38 - Math.abs(a - 22) / 200);
      figure(x, 108, 34, 70, .42);
      if (i === 0) { rect(x - 24, 94, 3, 86, .55); for (let y = 0; y < 9; y++) for (let xx = 0; xx < 9; xx++) if (Math.hypot(xx - 4, y - 4) < 4.6) shade(x - 27 + xx, 86 + y, Math.hypot(xx - 4, y - 4) < 2.6 ? .1 : .6); }
      else { rect(x - 9, 140, 18, 11, (a) => a < 9 ? .82 : .7, { warm: 1.4 }); rect(x, 140, 1, 11, .3); }
    });
    // stairs
    for (let i = 0; i < 5; i++) { const w = 150 + i * 34, y = 182 + i * 5; rect(CX - w / 2, y, w, 5, (a, b) => b === 0 ? .62 : .34 - b * .02, { warm: 1.3 }); }
    // altar
    rect(CX - 28, 164, 56, 18, (a, b) => b < 1 ? .75 : .38 + (a < 3 ? .1 : 0), { warm: 1.4 });
    rect(CX - 31, 160, 62, 4, (a, b) => b ? .62 : .85, { warm: 1.6 });
    for (let y = 160; y < 182; y++) for (let x = -10; x <= 10; x++) { const l = .55 + .45 * Math.sqrt(1 - Math.pow(x / 10, 2)); put(CX + x, y, 140 * l + 40, 12 * l, 28 * l); }
    solid(CX - 10, 160, 21, 1, [230, 60, 80]); solid(CX - 6, 174, 13, 1, [243, 183, 79]);
    // floor with reflections
    for (let y = 206; y < H; y++) for (let x = 0; x < W; x++) {
      const k = (y - 206) / (H - 206), tile = (Math.floor((x - CX) / (14 + k * 26) + 100) + Math.floor(y / (5 + k * 6))) % 2;
      shade(x, y, (.16 + tile * .03) * (1 - k * .5), 1.5);
    }
    c.putImageData(id, 0, 0);
  }

  /* --- dynamic --- */
  const R = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const candles = [[-26, 160], [-20, 160], [20, 160], [26, 160], [-62, 182], [-54, 182], [54, 182], [62, 182], [-82, 187], [82, 187], [-100, 192], [-92, 192], [92, 192], [100, 192], [-118, 197], [118, 197], [-40, 197], [40, 197], [-136, 202], [136, 202], [-14, 202], [14, 202]].map(([dx, y], i) => ({ dx, y, h: 4 + (i * 7 % 6), p: i * 1.7 }));
  const smoke = [], embers = [];
  function glow(x, y, r, rgb, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  function leader(x, y) {
    const s = Math.sin(t * 1.3) * 1.2;
    for (let yy = 0; yy < 34; yy++) { const k = yy / 34, hw = k < .2 ? 3 + k * 10 : 5 + k * 6; R(x - hw, y + yy, hw * 2, 1, "#c9c3b2"); R(x - hw, y + yy, hw * .6, 1, "#ece6d6"); R(x + hw * .4, y + yy, hw * .6, 1, "#9a9384"); }
    R(x - 1, y + 10, 2, 24, "#c3142d"); R(x - 3, y + 2, 6, 5, "#c9a48a"); R(x - 2, y + 4, 1, 1, "#20140c"); R(x + 1, y + 4, 1, 1, "#20140c");
    for (let i = 0; i < 9; i++) R(x - 3 + i / 3, y + 1 - i, 6 - i / 1.5, 1, i > 6 ? "#f3b74f" : "#ece6d6");
    for (let i = 0; i < 12; i++) { R(x - 6 - i * .55, y + 10 - i + s, 3, 1, "#d9d3c2"); R(x + 4 + i * .55, y + 10 - i - s, 3, 1, "#b9b2a2"); }
    R(x - 14, y - 3 + s, 3, 3, "#c9a48a"); R(x + 11, y - 3 - s, 3, 3, "#c9a48a");
  }
  function acolyte(x, y) {
    for (let yy = 0; yy < 24; yy++) { const k = yy / 24, hw = k < .25 ? 2 + k * 10 : 4.5 + k * 3; R(x - hw, y + yy, hw * 2, 1, "#6b6656"); R(x - hw, y + yy, hw * .6, 1, "#8f8a78"); }
    R(x - 2, y + 3, 4, 3, "#0a0a0c"); R(x - 1, y + 4, 1, 1, "#e0193a"); R(x + 1, y + 4, 1, 1, "#e0193a");
    R(x - 3, y + 11, 6, 5, "#3a3a44"); R(x - 1, y + 8, 2, 3, "#f3b74f");
  }
  function congregation() {
    const rows = [[204, 3.8, 20, [16, 16, 21], 0], [216, 4.6, 24, [10, 10, 14], 1], [230, 5.6, 30, [5, 5, 8], 0]];
    rows.forEach(([y, s, gap, base, alt], ri) => {
      for (let x = (CX % gap) - gap + (alt ? gap / 2 : 0); x < W + gap; x += gap) {
        const b = Math.sin(t * 1.1 + x * .17 + ri) * .9, w = s * 2.8, h = s * 6;
        const dist = Math.abs(x - CX) / (W * .5), rim = Math.max(0, 1 - dist * 1.4);
        for (let yy = 0; yy < h; yy++) {
          const k = yy / h, hw = k < .42 ? w * .36 * Math.sqrt(1 - Math.pow((.42 - k) / .42, 2)) + .6 : w * (.38 + .62 * Math.min(1, (k - .42) / .3));
          const shadeK = 1 + (1 - k) * .35;
          R(x - hw, y + yy + b, hw * 2, 1, `rgb(${base[0] * shadeK},${base[1] * shadeK},${base[2] * shadeK})`);
          if (yy < h * .5) { R(x - hw, y + yy + b, 1, 1, `rgba(255,160,80,${.25 * rim})`); R(x + hw - 1, y + yy + b, 1, 1, `rgba(255,160,80,${.25 * rim})`); }
        }
        R(x - w * .2, y + b, w * .4, 1, `rgba(255,170,90,${.35 * rim})`);
      }
    });
  }
  function brazier(x, y) {
    R(x - 7, y, 14, 3, "#3a3a44"); R(x - 5, y + 3, 10, 2, "#26262e"); R(x - 1, y + 5, 2, 12, "#26262e"); R(x - 5, y + 16, 10, 2, "#33333c");
    ctx.globalCompositeOperation = "lighter"; glow(x, y - 4, 26, "255,120,50", .3 + .06 * Math.sin(t * 7)); ctx.globalCompositeOperation = "source-over";
    for (let i = 0; i < 14; i++) { const fx = x - 5 + (i % 7) * 1.6, ph = Math.sin(t * 10 + i * 2.3), fh = 4 + (i % 3) * 2 + ph * 2; R(fx, y - fh, 1.4, fh, i % 3 ? "#ff7a3d" : "#f3b74f"); }
    R(x - 1, y - 9 - Math.sin(t * 9) * 2, 2, 3, "#fff2c0");
    if (Math.random() < .2) embers.push({ x: x + (Math.random() - .5) * 8, y: y - 6, vy: -.4 - Math.random() * .4, vx: (Math.random() - .5) * .3, l: 1 });
  }

  function frame(ts) {
    t = ts / 1000; ctx.imageSmoothingEnabled = false;
    if (!bg) resize();
    ctx.drawImage(bg, 0, 0);
    const pulse = .5 + .5 * Math.sin(t * .8);

    ctx.globalCompositeOperation = "lighter";
    [["139,108,255", -.5], ["224,25,58", -.16], ["243,183,79", .16], ["69,208,193", .5]].forEach(([c, a], i) => {
      ctx.fillStyle = `rgba(${c},${.04 + .02 * Math.sin(t * .6 + i)})`;
      ctx.beginPath(); ctx.moveTo(CX + a * 50 - 8, 64); ctx.lineTo(CX + a * 50 + 8, 64); ctx.lineTo(CX + a * 330 + 40, H); ctx.lineTo(CX + a * 330 - 40, H); ctx.fill();
    });
    glow(CX, 64, 64, "139,108,255", .2 + .08 * pulse);
    glow(CX, 64, 22, "236,232,220", .18 + .08 * pulse);
    ctx.globalCompositeOperation = "source-over";
    if (mark.naturalWidth) ctx.drawImage(mark, CX - 14, 50, 28, 28);

    // idol eyes
    if (t > nextBlink) { blink = t; nextBlink = t + 3 + Math.random() * 4; }
    if (t - blink > .14) {
      R(CX - 6, 103, 3, 1, "#ff2848"); R(CX + 3, 103, 3, 1, "#ff2848");
      ctx.globalCompositeOperation = "lighter"; glow(CX - 4.5, 103, 8, "224,25,58", .55 + .2 * pulse); glow(CX + 4.5, 103, 8, "224,25,58", .55 + .2 * pulse); ctx.globalCompositeOperation = "source-over";
    }
    [CX - 96, CX + 96].forEach(x => { R(x - 3, 115, 1, 1, "#6a6a7a"); R(x + 2, 115, 1, 1, "#6a6a7a"); });
    ctx.globalCompositeOperation = "lighter"; glow(CX - 118.5, 90.5, 14, "69,208,193", .28 + .15 * Math.sin(t * 2)); ctx.globalCompositeOperation = "source-over";
    R(CX - 120, 89, 3, 3, "#45d0c1");

    // floating pyramid eye
    const bob = Math.sin(t * 1.5) * 2.2, s = 40;
    ctx.globalCompositeOperation = "lighter"; glow(CX, 130 + bob, 40, "236,232,220", .16 + .08 * pulse); ctx.globalCompositeOperation = "source-over";
    if (mark.naturalWidth) ctx.drawImage(mark, CX - s / 2, Math.round(110 + bob), s, s);
    const ey = Math.round(110 + bob) + Math.round(s * .66), px = Math.round(CX + (mx - .5) * 5), py = Math.round(ey + (my - .5) * 1.6);
    R(CX - 6, ey - 2, 12, 4, "#f0f0f0"); R(px - 1.5, py - 2, 3, 4, "#000"); R(px - 1, py - 2, 1, 1, "#fff");

    leader(CX - 48, 146); acolyte(CX + 46, 154); acolyte(CX + 62, 158);
    brazier(CX - 160, 186); brazier(CX + 160, 186);

    ctx.globalCompositeOperation = "lighter";
    candles.forEach(c => glow(CX + c.dx + 1, c.y - c.h - 2, 14, "255,160,70", .2 + .04 * Math.sin(t * 9 + c.p)));
    ctx.globalCompositeOperation = "source-over";
    candles.forEach(c => {
      const x = CX + c.dx, fl = Math.sin(t * 9 + c.p) * .5 + Math.sin(t * 23 + c.p * 3) * .5;
      R(x, c.y - c.h, 2, c.h, "#bdb6a4"); R(x, c.y - c.h, 1, c.h, "#ece6d6");
      R(x, c.y - c.h - 3, 2, 3, fl > .1 ? "#f3b74f" : "#ff7a3d"); R(x + (fl > 0 ? 0 : 1), c.y - c.h - 4, 1, 1, "#fff3c4");
      // floor reflection
      ctx.fillStyle = "rgba(255,160,70,.07)"; ctx.fillRect(x, c.y + 2, 2, 3);
      if (Math.random() < .012) smoke.push({ x: x + 1, y: c.y - c.h - 5, a: .22, r: 1 });
      if (Math.random() < .004) embers.push({ x: x + 1, y: c.y - c.h - 3, vy: -.25 - Math.random() * .3, vx: (Math.random() - .5) * .2, l: 1 });
    });
    for (let i = smoke.length - 1; i >= 0; i--) { const p = smoke[i]; p.y -= .2; p.x += Math.sin(t * 2 + p.y * .2) * .14; p.r += .03; p.a -= .002; if (p.a <= 0) { smoke.splice(i, 1); continue; } ctx.fillStyle = `rgba(150,148,168,${p.a})`; ctx.fillRect(Math.round(p.x - p.r), Math.round(p.y - p.r), Math.ceil(p.r * 2), Math.ceil(p.r * 2)); }
    ctx.globalCompositeOperation = "lighter";
    for (let i = embers.length - 1; i >= 0; i--) { const e = embers[i]; e.y += e.vy; e.x += e.vx + Math.sin(t * 3 + i) * .06; e.l -= .005; if (e.l <= 0) { embers.splice(i, 1); continue; } ctx.fillStyle = `rgba(255,${120 + e.l * 90 | 0},60,${e.l})`; ctx.fillRect(Math.round(e.x), Math.round(e.y), 1, 1); }
    for (let i = 0; i < 60; i++) { const x = CX - 160 + ((i * 53.7 + t * 3) % 320), y = 64 + ((i * 37.3 + t * (2 + i % 3)) % 140); ctx.fillStyle = `rgba(236,232,220,${.06 + .06 * Math.sin(t + i)})`; ctx.fillRect(x | 0, y | 0, 1, 1); }
    ctx.globalCompositeOperation = "source-over";

    congregation();
    const g = ctx.createLinearGradient(0, 190, 0, H); g.addColorStop(0, "rgba(110,100,150,0)"); g.addColorStop(1, `rgba(110,100,150,${.08 + .03 * Math.sin(t * .5)})`); ctx.fillStyle = g; ctx.fillRect(0, 190, W, H - 190);
    requestAnimationFrame(frame);
  }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => bg = null, 120); });
  addEventListener("pointermove", e => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; });
  mark.onload = () => { bg = null; };
  requestAnimationFrame(frame);
})();
