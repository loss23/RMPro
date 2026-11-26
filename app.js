/* Home page: Spotify player, artists, collaborators, shows and navigation. Data comes from content.js and config.js. */
const $ = id => document.getElementById(id);
const calm = matchMedia("(prefers-reduced-motion: reduce)");
const settings = window.RMP_CONFIG || {};

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

/* ---------- RMP Radio: our own frame and controls around Spotify's official embedded player ---------- */
/* Only play, pause and seek are sent to Spotify. The embedded player is shown as Spotify draws it, and nothing
   on the page animates along with its audio (Spotify's Developer Policy does not allow syncing it with visuals). */
const ICON = {
  play: '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>'
};
const noPlayer = () => {};
let spotify = { toggle: noPlayer, seek: noPlayer, step: noPlayer };
let sp = { ready: false, paused: true, position: 0, duration: 0 }, spStarted = false, spWaiting = 0, seeking = false;
let listening = true; // true while the radio is on screen
let playable = true; // false on a channel that is only a Spotify profile link

/* The artist entry behind a Spotify list item. Playlists and other titles get a plain RMP look. */
const channelArtist = title => artists.find(a => a.name === title) ||
  { name: title, photo: "", mono: "RMP", bg: "linear-gradient(145deg,#3b1d8f,#8b3fd1 48%,#150c33)" };
const twoDigits = n => String(n).padStart(2, "0");

function showTime(position, duration) {
  const known = duration > 0;
  $("elapsed").textContent = clock(position); $("total").textContent = clock(duration);
  $("seek").value = known ? position / duration * 1000 : 0; $("seek").disabled = !known;
}
function showPlayState() {
  for (const id of ["toggle", "dockToggle"]) { $(id).innerHTML = sp.paused ? ICON.play : ICON.pause; $(id).setAttribute("aria-label", sp.paused ? "Play" : "Pause"); }
}
function showControls() {
  ["prev", "next"].forEach(id => $(id).disabled = !sp.ready);
  ["toggle", "dockToggle"].forEach(id => $(id).disabled = !sp.ready || !playable);
}
function updateDock() {
  const visible = spStarted && playable && !listening;
  $("dock").hidden = !visible; document.body.classList.toggle("docked", visible);
}
function onSpotifyState(state) {
  const wasPlaying = !sp.paused, becameReady = !sp.ready;
  if (!playable) { // nothing plays on a profile channel
    sp = { ready: true, paused: true, position: 0, duration: 0 };
    if (!state.paused) spotify.pause();
    if (becameReady) showControls();
    return;
  }
  sp = state;
  if (!state.paused) { spStarted = true; clearTimeout(spWaiting); $("spStatus").textContent = ""; }
  if (becameReady) showControls();
  if (becameReady || wasPlaying === state.paused) { showPlayState(); updateDock(); }
  if (!seeking) showTime(state.position, state.duration);
}
function toggle() {
  if (!sp.ready || !playable) return;
  clearTimeout(spWaiting);
  if (sp.paused) spWaiting = setTimeout(() => $("spStatus").textContent = "If it does not start, press play in the Spotify player.", 2500);
  spotify.toggle();
}

/* Change the poster, the big name and the mini player to the chosen channel. */
function showChannel(title, number) {
  const artist = channelArtist(title), art = $("posterArt"), cover = $("dockCover");
  art.textContent = ""; picture(art, artist, artist.full || artist.photo);
  cover.textContent = ""; picture(cover, artist, artist.photo);
  $("channelNo").textContent = twoDigits(number);
  $("nowTitle").textContent = $("dockTitle").textContent = title;
  $("dockArtist").textContent = "On Spotify";
}

$("toggle").onclick = $("dockToggle").onclick = toggle;
$("prev").onclick = () => spotify.step(-1);
$("next").onclick = () => spotify.step(1);
/* The time updates while the slider is dragged; Spotify gets one seek when it is let go. */
$("seek").oninput = e => { seeking = true; showTime(e.target.value / 1000 * sp.duration, sp.duration); };
$("seek").onchange = e => {
  seeking = false;
  sp.position = e.target.value / 1000 * sp.duration; spotify.seek(sp.position);
};
showControls(); showPlayState();
new IntersectionObserver(e => { listening = e[0].isIntersecting; updateDock(); }, { threshold: .15 }).observe(document.querySelector(".radio"));

/* Spotify's player is a large third-party download, so it loads only when the radio gets close. */
function mountSpotify() {
  if (!window.RMPSpotify) return;
  spotify = RMPSpotify.mount({
    profiles: true, items: settings.spotify, host: $("spHost"), list: $("spList"), status: $("spStatus"), height: 352,
    fill(tab, item, n) {
      const orb = el("span", "", "orb"), words = el("span"), artist = channelArtist(item.title);
      picture(orb, artist, artist.photo);
      words.append(el("small", "CH " + twoDigits(n + 1)), el("b", item.title));
      tab.className = "channel"; tab.append(orb, words);
    },
    onSelect(item) {
      showChannel(item.title, [...$("spList").children].findIndex(b => b.getAttribute("aria-pressed") === "true") + 1);
      playable = !!item.uri;
      $("spHost").hidden = !playable; $("profileCard").hidden = playable;
      if (!playable) { $("profileTitle").textContent = item.title + " on Spotify"; $("profileLink").href = item.url; clearTimeout(spWaiting); if (sp.ready) $("spStatus").textContent = ""; }
      sp = { ...sp, paused: true, position: 0, duration: 0 };
      seeking = false; showTime(0, 0); showPlayState(); showControls(); updateDock();
    },
    onState: onSpotifyState
  });
}
const spotifyWatcher = new IntersectionObserver(entries => {
  if (!entries.some(e => e.isIntersecting)) return;
  spotifyWatcher.disconnect(); mountSpotify();
}, { rootMargin: "300px" });
spotifyWatcher.observe(document.querySelector(".radio"));

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
  if (artist.spotify) actions.append(externalLink("Listen on Spotify", artist.spotify, "btn ghost"));
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
  if (show.guest) { // the guest gets a big name of their own
    const guest = el("span", "", "guest");
    guest.append(el("em", "Special guest"), el("strong", show.guest));
    title.append(guest);
  }
  show.openers.map(name => artists.find(a => a.name === name)).filter(Boolean).forEach(a => openers.append(artistButton(a, "opener")));
  bill.append(title, openers);
  story.append(el("p", show.summary, "lead"));
  if (show.date || show.venue) story.append(factList([["When", show.date, show.time], ["Where", show.venue, show.address]]));
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
const NAV_ALIAS = { past: "shows", collaborators: "artists", signup: "book" }; // sections without their own nav link
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
  document.querySelectorAll(".head,.radio,#chips,#artistList,#collabList,#showList,#pastList,#merchList,.panel-form,.signup,.about")
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
    const box = e.target.closest && e.target.closest(".card");
    if (!box) return;
    const r = box.getBoundingClientRect();
    box.style.setProperty("--gx", e.clientX - r.left + "px"); box.style.setProperty("--gy", e.clientY - r.top + "px");
  });
}
