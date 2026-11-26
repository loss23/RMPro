/* Home page animation: logo contour lines, starry sky, spectrum bars and the record.
   Sound-reactive parts read only RMP's own audio (the analyser set up in app.js), never Spotify.
   Each part redraws only when it has something new to show. */
const IDLE_FRAME = 31; // ms between redraws for slow background motion (about 30 per second)
const stage = $("home"), mark = document.querySelector(".mark"), wavesCanvas = $("waves");
const sky = createStarfield($("dust"));
const pt = { x: -999, y: -999 }, aim = { x: 0, y: 0 }, eye = { x: 0, y: 0 };
let ripples = [], bass = 0, wavesOnScreen = true;

/* ---------- pointer ---------- */
const localPoint = e => { const r = wavesCanvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
stage.addEventListener("pointermove", e => {
  Object.assign(pt, localPoint(e));
  mark.style.setProperty("--mx", (e.clientX / innerWidth - .5) * 22 + "px");
  mark.style.setProperty("--my", (e.clientY / innerHeight - .5) * 22 + "px");
});
stage.addEventListener("pointerleave", () => { pt.x = pt.y = -999; });
stage.addEventListener("pointerdown", e => {
  if (e.target.closest("a,button") || calm.matches) return;
  ripples.push({ ...localPoint(e), born: performance.now() });
  if (ripples.length > 6) ripples.shift();
});
document.addEventListener("pointermove", e => {
  if (calm.matches || e.pointerType === "touch") return;
  aim.x = e.clientX / innerWidth - .5; aim.y = e.clientY / innerHeight - .5;
  const style = document.querySelector(".sky").style;
  style.setProperty("--mx", aim.x); style.setProperty("--my", aim.y);
});
new IntersectionObserver(e => wavesOnScreen = e[0].isIntersecting).observe(wavesCanvas);

/* ---------- contour field, drawn from the rings in the RMP logo ---------- */
const RINGS = 30, STEPS = 110;
function drawWaves(t) {
  const [ctx, w, h] = fitCanvas(wavesCanvas);
  ctx.clearRect(0, 0, w, h);
  const m = mark.getBoundingClientRect(), c = wavesCanvas.getBoundingClientRect();
  const cx = m.left - c.left + m.width / 2, cy = m.top - c.top + m.height / 2;

  let target = 0;
  if (an && !player.paused && !calm.matches) { an.getByteFrequencyData(freq); for (let i = 0; i < 10; i++) target += freq[i]; target /= 2550; }
  bass += (target - bass) * .2;

  const now = performance.now(), time = calm.matches ? 0 : t, reach = Math.max(w, h) * .9;
  ripples = ripples.filter(r => now - r.born < 2200);
  eye.x += (aim.x - eye.x) * .06; eye.y += (aim.y - eye.y) * .06;
  const lift = calm.matches ? 0 : Math.min(scrollY, h);
  ctx.strokeStyle = sunsetGradient(ctx, cx - w * .35, cy - h * .4, cx + w * .25, cy + h * .45, "#9d6bff");

  for (let k = 0; k < RINGS; k++) {
    const base = m.width * .36 + Math.pow(k / RINGS, 1.25) * reach, z = Math.pow(k / RINGS, 1.5);
    const ox = eye.x * z * 110, oy = eye.y * z * 80 + lift * z * .28; // outer rings sit "closer" and move more
    ctx.beginPath();
    for (let i = 0; i <= STEPS; i++) {
      const a = i / STEPS * Math.PI * 2;
      const wobble = Math.sin(a * 3 + k * .23 + time * .00045) * 9 + Math.sin(a * 5 - k * .17 - time * .0003) * 6 + Math.sin(a * 2 + time * .0002) * 14;
      const r = base + wobble * (.5 + k / 18) + bass * 38 * Math.sin(a * 8 + k * .5 + time * .004);
      let x = cx + ox + Math.cos(a) * r * .86, y = cy + oy + Math.sin(a) * r;
      const dx = x - pt.x, dy = y - pt.y, d = Math.hypot(dx, dy);
      if (d < 150 && d > 0) { const push = Math.pow(1 - d / 150, 2) * 46; x += dx / d * push; y += dy / d * push; }
      for (const ripple of ripples) {
        const ex = x - ripple.x, ey = y - ripple.y, dist = Math.hypot(ex, ey) || 1, age = (now - ripple.born) / 2200, gap = dist - age * 700;
        if (Math.abs(gap) < 70) { const push = Math.cos(gap / 70 * Math.PI / 2) * 28 * (1 - age); x += ex / dist * push; y += ey / dist * push; }
      }
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
    const bold = k % 7 === 3;
    ctx.lineWidth = .8 + z * 1.5 + (bold ? .8 : 0);
    ctx.globalAlpha = Math.max(.1, .68 - k / RINGS * .52 + bass * .25 + (bold ? .14 : 0));
    ctx.stroke();
  }
}

/* ---------- spectrum bars under the player (a still pattern when not playing) ---------- */
const BARS = 48;
let spectrumIdle = ""; // size of the still pattern already on the canvas
function drawSpectrum() {
  if (!listening || source !== "rmp") return; // hidden while Spotify is selected
  const canvas = $("spectrum"), live = an && !player.paused && !calm.matches;
  const size = canvas.clientWidth + "x" + canvas.clientHeight + "@" + devicePixelRatio;
  if (!live && size === spectrumIdle) return;
  spectrumIdle = live ? "" : size;
  const [ctx, w, h] = fitCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  if (live) an.getByteFrequencyData(freq);
  ctx.fillStyle = sunsetGradient(ctx, 0, 0, w, 0);
  ctx.globalAlpha = live ? 1 : .45;
  for (let i = 0; i < BARS; i++) {
    const v = live ? freq[Math.floor(i * 1.8)] / 255 : .12 + .45 * Math.abs(Math.sin(i * .5) * Math.cos(i * .19));
    const height = Math.max(4, v * h);
    ctx.fillRect(i * w / BARS + 1, (h - height) / 2, Math.max(2, w / BARS - 3), height);
  }
}

/* ---------- record: spins while an RMP track plays (never for Spotify); drag it to scrub, about 6 seconds per turn ---------- */
const disc = $("disc");
let turn = 0, shownTurn = null, drag = null, lastFrame = 0;
const angleOf = e => { const r = disc.getBoundingClientRect(); return Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2) * 180 / Math.PI; };
function spinRecord(t) {
  const elapsed = Math.min(60, t - lastFrame || 0); lastFrame = t;
  if (drag === null && !player.paused && !calm.matches) turn += elapsed * .12;
  if (turn !== shownTurn) { shownTurn = turn; $("spin").style.transform = "rotate(" + turn + "deg)"; }
}
disc.onpointerdown = e => { if (!canScrub()) return; drag = angleOf(e); scrubStart(); disc.setPointerCapture(e.pointerId); };
disc.onpointermove = e => {
  if (drag === null) return;
  const angle = angleOf(e);
  let step = angle - drag;
  if (step > 180) step -= 360;
  if (step < -180) step += 360;
  drag = angle; turn += step; scrubBy(step / 360 * 6);
};
disc.onpointerup = disc.onpointercancel = () => { if (drag === null) return; drag = null; scrubEnd(); };

/* ---------- one animation loop (browsers pause it in background tabs) ---------- */
let wavesAt = -1e9, skyAt = -1e9, skyScroll = -1, skySize = "", wavesSize = "";
function frame(t) {
  const size = innerWidth + "x" + innerHeight;

  if (wavesOnScreen) {
    const busy = !calm.matches && (pt.x > -999 || ripples.length || !player.paused || scrollY !== skyScroll);
    const due = calm.matches ? size !== wavesSize || pt.x > -999 || t - wavesAt >= 500 : busy || t - wavesAt >= IDLE_FRAME;
    if (due) { drawWaves(t); wavesAt = t; wavesSize = size; }
  }

  // Reduced motion: the sky is drawn once per window size and then left alone.
  const skyDue = calm.matches ? size !== skySize : size !== skySize || scrollY !== skyScroll || sky.busy || t - skyAt >= IDLE_FRAME;
  if (skyDue) { sky.draw(t, { still: calm.matches, scroll: scrollY, lean: eye.x, comets: true }); skyAt = t; skySize = size; }
  skyScroll = scrollY;

  drawSpectrum();
  spinRecord(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
