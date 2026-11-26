/* RMP Spotlight. Who is featured comes from "spotlight" in content.js. The buttons at the top show any other
   artist, and each has its own address to share, for example spotlight.html#deerob */
const $ = id => document.getElementById(id);
const make = (tag, text, cls) => { const e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; };
const slug = name => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const featured = artists.find(a => a.name === spotlight.artist) || artists[0];

function link(text, url, cls) {
  const a = make("a", text, cls);
  a.href = url;
  if (/^https?:/.test(url)) { a.target = "_blank"; a.rel = "noopener"; }
  return a;
}

/* An official embedded player, shown as its maker draws it. */
function frame(box, src, title, height) {
  const f = document.createElement("iframe");
  f.title = title; f.loading = "lazy"; f.allowFullscreen = true;
  f.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
  f.referrerPolicy = "strict-origin-when-cross-origin";
  if (height) f.height = height;
  f.src = src;
  box.replaceChildren(f);
}
function spotifyEmbed(url) {
  const found = window.RMPSpotify && RMPSpotify.parse(url);
  return found ? found.url.replace("open.spotify.com/", "open.spotify.com/embed/") : "";
}
const youtubeId = url => (String(url || "").match(/(?:youtu\.be\/|[?&]v=|\/(?:shorts|live|embed)\/)([\w-]{11})(?:[?&#/]|$)/) || [])[1];

function showsFor(artist) {
  return pastShows.filter(s => s.openers.includes(artist.name)).map(s =>
    [s.headliner + " " + s.place, [s.guest && "Special guest: " + s.guest, s.date, s.venue].filter(Boolean).join(" · ")]);
}

function show(artist) {
  const extra = artist === featured ? spotlight : {}; // release, video and headline belong to the featured artist
  const photo = $("photo"), large = artist.full || artist.photo, mono = make("span", artist.mono);
  photo.replaceChildren(mono); photo.style.background = artist.bg; mono.setAttribute("aria-hidden", "true");
  if (large) {
    const img = new Image();
    img.alt = artist.name; img.onload = () => mono.remove(); img.onerror = () => img.remove(); img.src = large;
    photo.append(img);
  }
  $("name").textContent = artist.name;
  $("role").textContent = artist.role || ""; $("role").hidden = !artist.role;
  $("headline").textContent = extra.headline || ""; $("headline").hidden = !extra.headline;
  $("tags").replaceChildren(...artist.tags.map(t => make("span", t)));
  $("bio").textContent = artist.bio || "Bio coming soon.";

  const links = [];
  if (artist.url) links.push(link(artist.linkLabel || "Listen on " + artist.service, artist.url, "btn ghost"));
  if (artist.spotify) links.push(link("Listen on Spotify", artist.spotify, "btn ghost"));
  links.unshift(link("Book " + artist.name, "index.html?artist=" + encodeURIComponent(artist.name) + "#book", "btn"));
  $("links").replaceChildren(...links);

  const release = extra.release || {}, releaseSrc = spotifyEmbed(release.link);
  $("release").hidden = !release.link;
  $("releaseTitle").textContent = release.title || "";
  if (releaseSrc) frame($("releasePlayer"), releaseSrc, "Latest release by " + artist.name, 352);
  else $("releasePlayer").replaceChildren(...(/^https:\/\//.test(release.link || "") ? [link("Hear it", release.link, "btn")] : []));

  const video = youtubeId(extra.video);
  $("video").hidden = !video;
  if (video) frame($("videoPlayer"), "https://www.youtube.com/embed/" + video + "?rel=0", "Video from " + artist.name);
  else $("videoPlayer").replaceChildren();

  const music = spotifyEmbed(artist.spotify) || spotifyEmbed(artist.url);
  $("music").hidden = !music;
  if (music) frame($("musicPlayer"), music, artist.name + " on Spotify", 352);
  else $("musicPlayer").replaceChildren();

  const played = showsFor(artist);
  $("stage").hidden = !played.length;
  $("showRows").replaceChildren(...played.map(([title, detail]) => {
    const row = make("li");
    row.append(make("b", title), make("span", detail));
    return row;
  }));

  document.querySelectorAll("#picks a").forEach(a =>
    a.hash === "#" + slug(artist.name) ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"));
}

$("picks").append(...artists.map(artist => {
  const a = make("a", artist.name);
  a.href = "#" + slug(artist.name);
  if (artist === featured) a.append(make("small", "Featured"));
  return a;
}));
const fromAddress = () => artists.find(a => "#" + slug(a.name) === location.hash) || featured;
addEventListener("hashchange", () => show(fromAddress()));
show(fromAddress());

/* Drifting stars, drawn about 30 times a second. */
const sky = createStarfield($("dust"));
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
let lastDraw = 0;
function animate(t) {
  if (t - lastDraw > 32 || sky.busy) { lastDraw = t; sky.draw(t, { scroll: scrollY, comets: true }); }
  requestAnimationFrame(animate);
}
if (calm) { sky.draw(0, { still: true }); addEventListener("resize", () => sky.draw(0, { still: true })); }
else requestAnimationFrame(animate);
