/* Home page: player, artists, collaborators, shows and navigation. Data comes from content.js and config.js. */
const $ = id => document.getElementById(id);
const calm = matchMedia("(prefers-reduced-motion: reduce)");
const player = $("player");
const settings = window.RMP_CONFIG || {};
const tracks = (settings.tracks || []).filter(t => t.src);

/* ---------- small helpers ---------- */
function el(tag, text, cls) { const e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; }
function button(text, cls, onClick) { const b = el("button", text, cls); b.type = "button"; if (onClick) b.onclick = onClick; return b; }
function externalLink(text, url, cls) { const a = el("a", text, cls); a.href = url; a.target = "_blank"; a.rel = "noopener"; return a; }
const cssUrl = path => path ? 'url("' + new URL(path, location.href).href + '")' : "none";
const clock = s => isFinite(s) ? Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0") : "0:00";

/* Images load only when they get near the screen. A broken one is removed so the fallback stays visible. */
function addImage(box, src, alt, onLoad) {
  const img = new Image();
  img.alt = alt; img.loading = "lazy"; img.decoding = "async";
  img.onload = onLoad || null; img.onerror = () => img.remove();
  img.src = src; box.append(img);
}

/* A photo over a colored fallback with initials. */
function picture(box, artist, src) {
  box.style.background = artist.bg;
  const mono = el("span", artist.mono); mono.setAttribute("aria-hidden", "true"); box.append(mono);
  if (src) addImage(box, src, "", () => mono.remove());
}

/* A list of [label, line, optional second line]. Rows without a first line are skipped. */
function factList(rows) {
  const list = el("dl");
  rows.filter(r => r[1]).forEach(([label, first, second]) => {
    const row = el("div"), value = el("dd");
    value.append(el("b", first)); if (second) value.append(el("span", second));
    row.append(el("dt", label), value); list.append(row);
  });
  return list;
}

/* Close button, plus closing when the dimmed area outside is clicked. */
function wireDialog(dialog, closeButton) {
  closeButton.onclick = () => dialog.close();
  dialog.onclick = e => { if (e.target === dialog) dialog.close(); };
}

/* ---------- player ---------- */
const ICON = {
  play: '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>'
};
/* ac, an and freq are the Web Audio graph for RMP's own files; effects.js reads them. */
let current = -1, ac = null, an = null, freq = null;
/* source is which music the record player controls: "rmp" (our files) or "spotify". */
let source = "rmp", spotify = null;
let sp = { ready: false, paused: true, position: 0, duration: 0 }, spTitle = "Spotify", spStarted = false;
let listening = true; // true while the main player is on screen

const artOf = track => (artists.find(a => a.name === track.artist) || {}).photo || "";
function paintCover(node, track) {
  const art = artOf(track);
  node.style.backgroundImage = art ? cssUrl(art) : "";
  node.textContent = art ? "" : "RMP";
}
function connectAnalyser() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (ac || !AudioCtx || location.protocol === "file:") return;
  ac = new AudioCtx(); an = ac.createAnalyser(); an.fftSize = 256; freq = new Uint8Array(an.frequencyBinCount);
  ac.createMediaElementSource(player).connect(an); an.connect(ac.destination);
}
/* ---------- what the player and mini player show ---------- */
const isPlaying = () => source === "rmp" ? !player.paused : !sp.paused;
function showNow() {
  const mine = source === "rmp", track = mine ? tracks[current] : null;
  const title = mine ? (track ? track.title : "Music coming soon") : spTitle, by = mine ? (track && track.artist) || "" : "On Spotify";
  $("nowTitle").textContent = $("dockTitle").textContent = title;
  $("now").textContent = $("dockArtist").textContent = by;
  // Spotify mode keeps a plain RMP record label; the official Spotify player shows its own artwork.
  document.querySelector(".now").style.setProperty("--art", cssUrl(track ? artOf(track) : ""));
  paintCover($("cover"), track || {}); paintCover($("dockCover"), track || {});
}
function showTime(position, duration) {
  const known = isFinite(duration) && duration > 0;
  $("elapsed").textContent = clock(position); $("total").textContent = clock(duration);
  $("seek").value = known ? position / duration * 1000 : 0; $("seek").disabled = !known;
}
function showPlayState() {
  const playing = isPlaying();
  for (const id of ["toggle", "dockToggle"]) { $(id).innerHTML = playing ? ICON.pause : ICON.play; $(id).setAttribute("aria-label", playing ? "Pause" : "Play"); }
  $("heroPlay").textContent = playing ? "Pause music" : "Play music";
}
function showControls() {
  const usable = source === "rmp" ? tracks.length > 0 : sp.ready;
  ["toggle", "dockToggle", "prev", "next"].forEach(id => $(id).disabled = !usable);
  const unit = source === "rmp" ? "track" : "artist";
  $("prev").setAttribute("aria-label", "Previous " + unit); $("next").setAttribute("aria-label", "Next " + unit);
}
function updateDock() {
  const started = source === "rmp" ? current >= 0 && (player.currentTime > 0 || !player.paused) : spStarted;
  const visible = started && !listening;
  $("dock").hidden = !visible; document.body.classList.toggle("docked", visible);
}
function refresh() {
  showNow(); showControls(); showPlayState(); updateDock();
  if (source === "rmp") showTime(player.currentTime || 0, player.duration); else showTime(sp.position, sp.duration);
}

/* ---------- RMP's own tracks ---------- */
function load(i) {
  current = i; player.src = tracks[i].src;
  document.querySelectorAll(".track[aria-current]").forEach(b => b.removeAttribute("aria-current"));
  $("tracks").children[i].firstChild.setAttribute("aria-current", "true");
  refresh();
}
function play() {
  if (spotify) spotify.pause();
  connectAnalyser();
  if (ac && ac.state !== "running") ac.resume();
  player.play().catch(e => { if (e.name !== "AbortError") $("now").textContent = "Could not play this track. Please try again."; });
}
function choose(i) { setSource("rmp"); if (i !== current) load(i); play(); }

/* ---------- Spotify, controlled through its official embedded player ---------- */
/* Only play, pause and seek are sent to Spotify. Nothing on the page animates along with its audio
   (Spotify's Developer Policy does not allow syncing its recordings with visuals). */
let spWaiting = 0;
function onSpotifyState(state) {
  const wasPlaying = !sp.paused, becameReady = !sp.ready;
  if (source !== "spotify") { // a late message must not interrupt our own tracks
    sp = { ...state, paused: true };
    if (!state.paused) spotify.pause();
    return;
  }
  sp = state;
  if (!state.paused) { spStarted = true; clearTimeout(spWaiting); $("spStatus").textContent = ""; player.pause(); }
  if (becameReady) showControls();
  if (becameReady || wasPlaying === state.paused) { showPlayState(); updateDock(); }
  if (!scrubbing) showTime(state.position, state.duration);
}
/* Spotify's player is a large third-party download, so it loads only when someone picks Spotify. */
function mountSpotify() {
  if (spotify || !window.RMPSpotify) return;
  spotify = RMPSpotify.mount({
    items: settings.spotify, host: $("spHost"), list: $("spList"), status: $("spStatus"), height: 152,
    fill(row, item) {
      const art = el("span", "", "cover"), words = el("span");
      paintCover(art, { artist: item.title });
      words.append(el("b", item.title), el("small", "Spotify"));
      row.className = "track"; row.append(art, words);
    },
    onSelect(item) { spTitle = item.title; sp = { ...sp, paused: true, position: 0, duration: 0 }; if (source === "spotify") refresh(); },
    onState: onSpotifyState
  });
}

function setSource(next) {
  if (next === source) return;
  source = next;
  const mine = source === "rmp";
  if (mine) { if (spotify) spotify.pause(); clearTimeout(spWaiting); }
  else { player.pause(); mountSpotify(); }
  $("tabMine").setAttribute("aria-pressed", String(mine)); $("tabSp").setAttribute("aria-pressed", String(!mine));
  $("minePanel").hidden = !mine; $("spPanel").hidden = mine; $("spPane").hidden = mine; $("spectrum").hidden = !mine;
  $("scrubHint").textContent = mine ? "Drag the record to scrub through a song." : "Drag the record to scrub. With Spotify, it turns only when you turn it.";
  refresh();
}

/* ---------- shared controls ---------- */
function toggle() {
  if (source === "spotify") {
    if (!sp.ready) return;
    if (sp.paused) { player.pause(); clearTimeout(spWaiting); spWaiting = setTimeout(() => $("spStatus").textContent = "If it does not start, press play in the Spotify player.", 2500); }
    spotify.toggle();
  } else if (tracks.length) {
    if (current < 0) choose(0); else if (player.paused) play(); else player.pause();
  }
}
function skip(step) {
  if (source === "spotify") { if (sp.ready) spotify.step(step); }
  else if (tracks.length) choose((Math.max(current, 0) + step + tracks.length) % tracks.length);
}

/* Scrubbing, used by the record (effects.js) and the seek bar. Spotify gets one seek when the drag ends. */
let scrubbing = false, scrubTarget = 0;
const canScrub = () => source === "rmp" ? current >= 0 && player.duration > 0 : sp.ready && sp.duration > 0;
function scrubStart() { scrubbing = true; scrubTarget = source === "rmp" ? player.currentTime : sp.position; }
function scrubBy(seconds) {
  const duration = source === "rmp" ? player.duration : sp.duration;
  scrubTarget = Math.min(duration - .2, Math.max(0, scrubTarget + seconds));
  if (source === "rmp") player.currentTime = scrubTarget; else showTime(scrubTarget, duration);
}
function scrubEnd() {
  if (!scrubbing) return;
  scrubbing = false;
  if (source === "spotify") { spotify.seek(scrubTarget); sp.position = scrubTarget; }
}

tracks.forEach((track, i) => {
  const item = el("li"), row = button("", "track", () => i === current ? toggle() : choose(i));
  const art = el("span", "", "cover"), words = el("span"), length = el("span", "", "time");
  paintCover(art, track); words.append(el("b", track.title), el("small", track.artist));
  row.append(art, words, length); item.append(row); $("tracks").append(item);
  const probe = new Audio(); probe.preload = "metadata";
  probe.onloadedmetadata = () => length.textContent = clock(probe.duration); probe.src = track.src;
});
$("toggle").onclick = $("dockToggle").onclick = toggle;
$("prev").onclick = () => skip(-1);
$("next").onclick = () => skip(1);
$("tabMine").onclick = () => setSource("rmp");
$("tabSp").onclick = () => setSource("spotify");
$("heroPlay").onclick = () => source === "spotify" || tracks.length ? toggle() : $("listen").scrollIntoView();
player.onplay = () => { if (spotify) spotify.pause(); if (source !== "rmp") setSource("rmp"); showPlayState(); updateDock(); };
player.onpause = () => showPlayState();
player.onended = () => skip(1);
player.onloadedmetadata = player.ontimeupdate = () => { if (source === "rmp") showTime(player.currentTime, player.duration); };
$("seek").oninput = e => { // while dragging the seek bar
  if (!canScrub()) return;
  if (!scrubbing) scrubStart();
  const duration = source === "rmp" ? player.duration : sp.duration;
  scrubBy(e.target.value / 1000 * duration - scrubTarget);
};
$("seek").onchange = scrubEnd;
if (tracks.length) load(0); else refresh();
new IntersectionObserver(e => { listening = e[0].isIntersecting; updateDock(); }, { threshold: .15 }).observe(document.querySelector(".console"));

/* ---------- artists: tiles, profile pop-up, style filters and name ticker ---------- */
function openProfile(artist) {
  const photo = $("pPhoto"), large = artist.full || artist.photo;
  photo.textContent = ""; picture(photo, artist, large); photo.style.setProperty("--haze", cssUrl(large));
  $("pName").textContent = artist.name;
  $("pRole").textContent = artist.role || ""; $("pRole").hidden = !artist.role;
  $("pTags").replaceChildren(...artist.tags.map(t => el("span", t)));
  $("pBio").textContent = artist.bio || "Bio coming soon.";
  const actions = $("pActions"); actions.textContent = "";
  if (artist.url) actions.append(externalLink(artist.linkLabel || "Listen on " + artist.service, artist.url, "btn"));
  const own = tracks.findIndex(t => t.artist === artist.name);
  if (own >= 0) actions.append(button("Play " + tracks[own].title + " here", "ghost", () => { choose(own); $("profile").close(); $("listen").scrollIntoView(); }));
  $("profile").showModal(); $("profile").scrollTop = 0;
}
wireDialog($("profile"), $("pClose"));

/* A clickable picture of an artist, used for the tiles and for past-show openers. */
function artistButton(artist, cls, caption) {
  const b = button("", cls, () => openProfile(artist)), pic = el("span", "", "pic"), label = el("span", "", "label");
  picture(pic, artist, artist.photo);
  label.append(el("b", artist.name)); if (caption) label.append(el("small", caption));
  b.append(pic, label); b.setAttribute("aria-haspopup", "dialog");
  return b;
}
$("artistList").append(...artists.map(a => artistButton(a, "artist", a.role || a.tags.join(" · ") || "View profile")));

const FILTERS = [["Everyone", ""], ["Hip-hop", "hip-hop"], ["R&B", "r&b"], ["Rap and trap", "rap|trap|rage"], ["Rock and grunge", "rock|grunge"]];
FILTERS.forEach(([name, pattern], n) => {
  const chip = button(name, "", () => {
    [...$("chips").children].forEach(c => c.setAttribute("aria-pressed", String(c === chip)));
    [...$("artistList").children].forEach((tile, i) => tile.classList.toggle("dim", !!pattern && !new RegExp(pattern, "i").test(artists[i].tags.join(" "))));
  });
  chip.setAttribute("aria-pressed", String(!n)); $("chips").append(chip);
});

/* Two copies of the names make the ticker loop without a gap. */
[0, 1].forEach(copy => artists.forEach(a => {
  const name = button(a.name, "", () => openProfile(a));
  if (copy) { name.setAttribute("aria-hidden", "true"); name.tabIndex = -1; }
  $("run").append(name);
}));
$("stopRun").onclick = e => {
  const stopped = $("ticker").classList.toggle("stopped");
  e.target.textContent = stopped ? "Play" : "Pause"; e.target.setAttribute("aria-pressed", String(stopped));
};

/* ---------- collaborators ---------- */
[...collaborators].sort((a, b) => !!b.featured - !!a.featured).forEach(person => {
  const card = el("li", "", person.featured ? "collab featured" : "collab"), face = el("div", "", "face"), words = el("div", "", "who"), mono = el("span", person.mono);
  mono.setAttribute("aria-hidden", "true"); face.append(mono);
  if (person.photo) addImage(face, person.photo, "Photo for " + person.name, () => { mono.remove(); card.classList.add("has-photo"); });
  if (person.featured) words.append(el("span", "Featured", "badge"));
  words.append(el("h3", person.name));
  [person.role, person.handle].filter(Boolean).forEach(line => words.append(el("p", line)));
  card.append(face, words);
  if (person.url) {
    const link = externalLink("Instagram", person.url, "btn ghost");
    link.setAttribute("aria-label", "Follow " + person.name + " on Instagram"); card.append(link);
  }
  $("collabList").append(card);
});

/* ---------- upcoming shows ---------- */
const upcoming = shows.filter(s => !s.ends || Date.now() < Date.parse(s.ends));

function countdown(show) {
  const box = el("div", "", "countdown"); box.setAttribute("role", "timer");
  const units = [["days", 86400], ["hours", 3600], ["min", 60], ["sec", 1]].map(([name, seconds]) => {
    const cell = el("div"), number = el("b"); cell.append(number, el("small", name)); box.append(cell); return { number, seconds };
  });
  let timer = 0;
  function tick() {
    let left = Math.floor((Date.parse(show.starts) - Date.now()) / 1000);
    if (left <= 0) {
      const live = Date.now() < Date.parse(show.ends);
      box.replaceChildren(el("div", live ? "Happening now" : "This show has ended"));
      if (!live) clearInterval(timer);
      return;
    }
    units.forEach(u => { u.number.textContent = Math.floor(left / u.seconds); left %= u.seconds; });
  }
  timer = setInterval(tick, 1000); tick();
  return box;
}

function upcomingCard(show) {
  const card = el("li", "", "event"), info = el("div", "", "details"), tags = el("div", "", "tags"), actions = el("div", "", "actions");
  const alt = "Flyer for " + show.title + ", " + show.date + ", " + show.time + " at " + show.venue + ". " + show.price + ". " + show.deal + ".";
  const flyer = button("", "flyer", () => { $("posterImg").src = show.flyer; $("posterImg").alt = alt; $("poster").showModal(); });
  flyer.setAttribute("aria-haspopup", "dialog"); addImage(flyer, show.flyer, alt); flyer.append(el("span", "View flyer"));
  tags.append(el("span", show.price), el("span", show.deal));
  if (show.url) actions.append(externalLink("Tickets", show.url, "btn"));
  const map = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(show.venue + ", " + show.address);
  actions.append(externalLink("Get directions", map, show.url ? "btn ghost" : "btn"));
  info.append(el("h3", show.title), el("p", show.note, "sub"));
  if (show.starts) info.append(countdown(show));
  info.append(factList([["When", show.date, show.time], ["Where", show.venue, show.address]]), tags, actions);
  card.append(flyer, info);
  return card;
}

if (upcoming.length) {
  $("showList").append(...upcoming.map(upcomingCard));
  $("flash").textContent = "Next show: " + upcoming[0].short + " · " + upcoming[0].title + " →";
  $("flash").hidden = false;
} else {
  const card = el("li", "", "empty"), words = el("div"), link = el("a", "Meet the artists", "btn ghost");
  link.href = "#artists";
  words.append(el("h3", "No shows announced yet"), el("p", "Dates and tickets will be listed here.", "sub"));
  card.append(words, link); $("showList").append(card);
}
wireDialog($("poster"), $("posterClose"));

/* ---------- past shows ---------- */
pastShows.forEach(show => {
  const card = el("li", "", "recap"), bill = el("div", "", "bill"), title = el("h3", show.headliner), openers = el("div", "", "openers"), story = el("div", "", "story");
  title.append(el("small", show.place));
  show.openers.map(name => artists.find(a => a.name === name)).filter(Boolean).forEach(a => openers.append(artistButton(a, "opener")));
  bill.append(title, openers);
  story.append(el("p", show.summary, "lead"));
  if (show.date || show.venue) story.append(factList([["When", show.date], ["Where", show.venue]]));
  if (show.photos.length) {
    const gallery = el("div", "", "gallery");
    show.photos.forEach((src, n) => addImage(gallery, src, show.headliner + " " + show.place + ", photo " + (n + 1)));
    story.append(gallery);
  }
  card.append(bill, story); $("pastList").append(card);
});

/* ---------- scrolling: progress bar, current nav link, background parallax ---------- */
const sections = [...document.querySelectorAll("section")];
const navLinks = [...document.querySelectorAll('.links a[href^="#"]')];
const NAV_ALIAS = { past: "shows", collaborators: "artists" }; // sections without their own nav link
let scrollQueued = false;
function updateOnScroll() {
  scrollQueued = false;
  const max = document.documentElement.scrollHeight - innerHeight;
  const tops = sections.map(s => s.getBoundingClientRect().top); // measure everything before changing anything
  $("progress").style.transform = "scaleX(" + (max > 0 ? scrollY / max : 0) + ")";
  let active = "";
  sections.forEach((s, i) => { if (tops[i] < innerHeight * .4) active = "#" + (NAV_ALIAS[s.id] || s.id); });
  navLinks.forEach(a => a.hash === active ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"));
  if (calm.matches) return;
  document.querySelector(".sky").style.setProperty("--sy", scrollY);
  sections.forEach((s, i) => { if (tops[i] < innerHeight && tops[i] > -s.offsetHeight) s.style.setProperty("--px", Math.round(tops[i] * .22) + "px"); });
}
addEventListener("scroll", () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateOnScroll); } }, { passive: true });
updateOnScroll();

/* Content rises into place the first time it is seen. */
if (!calm.matches && "IntersectionObserver" in window) {
  const reveal = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    reveal.unobserve(e.target); e.target.classList.add("in");
    setTimeout(() => e.target.classList.remove("rise", "in"), 1000);
  }), { rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".head,.console,#chips,#artistList,#collabList,#showList,#pastList,#merchList,.about")
    .forEach(node => { node.classList.add("rise"); reveal.observe(node); });
}

/* ---------- mouse only: 3D tile tilt and panel light ---------- */
if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
  const TILT = ["--ix", "--iy", "--rx", "--ry"];
  [...$("artistList").children].forEach(tile => {
    tile.onpointermove = e => {
      const r = tile.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      tile.style.setProperty("--gx", x * 100 + "%"); tile.style.setProperty("--gy", y * 100 + "%");
      if (calm.matches) return;
      [(.5 - x) * 12 + "px", (.5 - y) * 12 + "px", (.5 - y) * 16 + "deg", (x - .5) * 16 + "deg"].forEach((v, i) => tile.style.setProperty(TILT[i], v));
    };
    tile.onpointerleave = () => TILT.forEach(name => tile.style.removeProperty(name));
  });
  document.addEventListener("pointermove", e => {
    const box = e.target.closest && e.target.closest(".card,.queue");
    if (!box) return;
    const r = box.getBoundingClientRect();
    box.style.setProperty("--gx", e.clientX - r.left + "px"); box.style.setProperty("--gy", e.clientY - r.top + "px");
  });
}
