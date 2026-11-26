/* Drawing helpers used by both pages: canvas sizing, the site colors and the starry sky. */
const RMP_TINTS = ["#ffffff", "#ffffff", "#ffffff", "#cfd8ff", "#d9c2ff", "#ffc4e1", "#ffd2ad"];

/* Size a canvas to its on-screen box. Returns [context, width, height, resized]. */
function fitCanvas(canvas) {
  const ratio = Math.min(devicePixelRatio || 1, 2), w = canvas.clientWidth, h = canvas.clientHeight;
  const pw = Math.round(w * ratio), ph = Math.round(h * ratio), resized = canvas.width !== pw || canvas.height !== ph;
  if (resized) { canvas.width = pw; canvas.height = ph; }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return [ctx, w, h, resized];
}

/* Orange to pink to violet. */
function sunsetGradient(ctx, x0, y0, x1, y1, end = "#a875ff") {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, "#ff8a3d"); g.addColorStop(.5, "#ff4fa3"); g.addColorStop(1, end);
  return g;
}

/* Stars in three layers; nearer ones are brighter and move more. This never reads any audio.
   Returns draw(timeMs, {still, scroll, lean, comets}). */
function createStarfield(canvas) {
  const count = Math.round(Math.min(720, Math.max(240, innerWidth * innerHeight / 1700)));
  const stars = Array.from({ length: count }, (_, i) => {
    const layer = i % 20 < 13 ? 0 : i % 20 < 18 ? 1 : 2;
    return { x: Math.random(), y: Math.random(), layer, r: [.5, .85, 1.35][layer] * (.7 + Math.random() * .6),
      color: RMP_TINTS[Math.floor(Math.random() * RMP_TINTS.length)], phase: Math.random() * 7,
      speed: .0008 + Math.random() * .0022, flare: layer === 2 && Math.random() < .3 };
  });
  const wrap = (v, size) => ((v % size) + size) % size;
  let comet = null, nextComet = 2500;

  function drawComet(ctx, w, h, t) {
    const age = (t - comet.born) / 900;
    if (age >= 1) { comet = null; nextComet = t + 3500 + Math.random() * 5500; return; }
    const dx = w * .35, dy = h * .24, len = Math.hypot(dx, dy) || 1;
    const hx = comet.x - age * dx, hy = comet.y + age * dy, tx = hx + dx / len * 140, ty = hy - dy / len * 140;
    const tail = ctx.createLinearGradient(hx, hy, tx, ty);
    tail.addColorStop(0, "#fff"); tail.addColorStop(1, "#a875ff00");
    ctx.globalAlpha = Math.sin(age * Math.PI); ctx.strokeStyle = tail; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
  }

  function draw(t, { still = false, scroll = 0, lean = 0, comets = false } = {}) {
    const [ctx, w, h] = fitCanvas(canvas);
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const depth = s.layer + 1;
      const x = wrap(s.x * w + (still ? 0 : t * .0016 * depth - lean * depth * 14), w);
      const y = wrap(s.y * h - (still ? 0 : scroll * depth * .07), h);
      const glow = still ? 1 : .68 + .32 * Math.sin(t * s.speed + s.phase);
      ctx.globalAlpha = [.5, .72, .95][s.layer] * glow; ctx.fillStyle = s.color;
      if (s.r < 1) ctx.fillRect(x, y, s.r * 1.7, s.r * 1.7);
      else { ctx.beginPath(); ctx.arc(x, y, s.r, 0, 7); ctx.fill(); }
      if (s.flare) {
        const arm = s.r * 5 * glow;
        ctx.globalAlpha = .4 * glow; ctx.fillRect(x - arm, y - .4, arm * 2, .8); ctx.fillRect(x - .4, y - arm, .8, arm * 2);
        ctx.globalAlpha = .12 * glow; ctx.beginPath(); ctx.arc(x, y, s.r * 3.5, 0, 7); ctx.fill();
      }
    }
    if (still || !comets) { comet = null; return; }
    if (!comet && t > nextComet) comet = { x: w * (.25 + Math.random() * .75), y: h * Math.random() * .45, born: t };
    if (comet) drawComet(ctx, w, h, t);
  }

  return { draw, count, get busy() { return !!comet; } };
}
