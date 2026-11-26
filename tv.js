/* RMP.TV: a TV-style frame and remote around YouTube's own embedded player. Settings: RMP_CONFIG.youtube in config.js.
   The video is a plain YouTube embed that works by itself. The remote and channel guide connect to it afterwards,
   and the screen is never hidden if they cannot.
   YouTube does not allow anything to be drawn over its player, so all the TV styling sits around the screen. */
const $ = id => document.getElementById(id);
const tvSettings = (window.RMP_CONFIG || {}).youtube || {};
const channelUrl = tvSettings.channel || "https://www.youtube.com/@rrmediapro";

/* An 11 character video id from a watch, share, shorts, live or embed link. */
function videoId(link) {
  const m = String(link || "").trim().match(/(?:youtu\.be\/|[?&]v=|\/(?:shorts|live|embed)\/|^)([\w-]{11})(?:[?&#/]|$)/);
  return m ? m[1] : null;
}

/* Hand-picked videos win. Otherwise play the channel's uploads list, whose id is the channel id with UU in place of UC. */
const picked = (tvSettings.videos || []).map(v => ({ id: videoId(v.link), title: v.title || "" })).filter(v => v.id);
const uploads = /^UC[\w-]{22}$/.test(tvSettings.channelId || "") ? "UU" + tvSettings.channelId.slice(2) : "";

let player = null, ready = false, ids = [], current = 0;
const titles = new Map(picked.map(v => [v.id, v.title]));
const two = n => String(n).padStart(2, "0");

$("channelLink").href = $("standbyLink").href = channelUrl;

function standby(message) {
  $("standbyText").textContent = message;
  $("standby").hidden = false;
  $("screen").classList.remove("on");
}
function powerOn() {
  $("standby").hidden = true;
  $("screen").classList.add("on");
}

function drawGuide() {
  const list = $("guideList");
  list.replaceChildren(...ids.map((id, i) => {
    const tile = document.createElement("button"), shot = document.createElement("img");
    const number = document.createElement("small"), name = document.createElement("b");
    tile.type = "button"; tile.className = "program";
    shot.src = "https://i.ytimg.com/vi/" + id + "/mqdefault.jpg"; shot.alt = ""; shot.loading = "lazy";
    shot.onerror = () => shot.remove();
    number.textContent = "CH " + two(i + 1);
    tile.append(shot, number, name);
    tile.onclick = () => { tune(i); $("screen").scrollIntoView({ block: "center" }); };
    return tile;
  }));
  $("guide").hidden = !ids.length;
}

/* Show which video is on. Titles are known for hand-picked videos, and for others once they have been loaded. */
function showNow() {
  const id = ids[current];
  const data = player && player.getVideoData ? player.getVideoData() : null;
  if (data && data.title && data.video_id === id && !titles.get(id)) titles.set(id, data.title);
  $("channelNo").textContent = id ? two(current + 1) : "--";
  $("nowTitle").textContent = titles.get(id) || (id ? "Video " + (current + 1) + " of " + ids.length : "RMP.TV");
  Array.from($("guideList").children).forEach((tile, i) => {
    tile.setAttribute("aria-pressed", String(i === current));
    tile.lastChild.textContent = titles.get(ids[i]) || "Video " + (i + 1);
  });
}

/* The video list arrives a moment after the remote connects. Channels and the guide need it. */
function readList() {
  const list = (player.getPlaylist && player.getPlaylist()) || [];
  if (!list.length) return false;
  if (list.join() !== ids.join()) { ids = list.slice(); drawGuide(); }
  const at = player.getPlaylistIndex ? player.getPlaylistIndex() : 0;
  if (at >= 0) current = at;
  $("chUp").disabled = $("chDown").disabled = false;
  $("tvStatus").textContent = "";
  showNow();
  return true;
}

const SCREEN_HINT = "Use the controls on the screen to play and change videos.";
function pollList(tries) {
  if (ids.length || readList()) return;
  if (tries > 0) setTimeout(pollList, 500, tries - 1);
  else $("tvStatus").textContent = SCREEN_HINT;
}

function tune(i) {
  if (!ready || !ids.length) return;
  current = (i + ids.length) % ids.length;
  $("tvStatus").textContent = "";
  player.playVideoAt(current);
  showNow();
}

$("chUp").onclick = () => tune(current + 1);
$("chDown").onclick = () => tune(current - 1);
$("play").onclick = () => { if (player.getPlayerState() === 1) player.pauseVideo(); else player.playVideo(); };
$("mute").onclick = () => {
  const mute = !player.isMuted();
  if (mute) player.mute(); else player.unMute();
  $("mute").textContent = mute ? "Unmute" : "Mute";
  $("mute").setAttribute("aria-pressed", String(mute));
};

/* The same kind of address YouTube's own "Embed" button gives. enablejsapi lets the remote connect. */
function embedAddress() {
  const query = new URLSearchParams({ playsinline: "1", rel: "0", enablejsapi: "1" });
  if (/^https?:$/.test(location.protocol)) query.set("origin", location.origin);
  let path = "videoseries";
  if (picked.length) {
    path = picked[0].id;
    if (picked.length > 1) query.set("playlist", picked.slice(1).map(v => v.id).join(","));
  } else query.set("list", uploads);
  return "https://www.youtube.com/embed/" + path + "?" + query;
}

function showVideo() {
  const frame = document.createElement("iframe");
  frame.id = "tvPlayer";
  frame.title = "RMP.TV video player";
  frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.allowFullscreen = true;
  frame.referrerPolicy = "strict-origin-when-cross-origin"; // YouTube refuses to play without knowing the site
  frame.src = embedAddress();
  $("tvPlayer").replaceWith(frame);
  powerOn();
}

/* Some previews do not allow other sites inside a page. Say so instead of leaving a blank screen. */
document.addEventListener("securitypolicyviolation", e => {
  if (/^(frame|child)-src/.test(e.effectiveDirective) && /youtube/.test(e.blockedURI))
    standby("This preview blocks YouTube. Open the published site, or watch on YouTube.");
});

function connectRemote() {
  player = new YT.Player("tvPlayer", {
    events: {
      onReady() {
        ready = true;
        $("play").disabled = $("mute").disabled = false;
        pollList(16);
      },
      onStateChange(e) {
        readList();
        $("play").textContent = e.data === 1 ? "Pause" : "Play";
        if (e.data === 1 && ids.length) $("tvStatus").textContent = "";
      },
      onError() { $("tvStatus").textContent = "This video can’t play here. Change the video or watch it on YouTube."; }
    }
  });
}

if (!picked.length && !uploads) standby("No videos are set up yet.");
else if (location.protocol === "file:") standby("YouTube can’t play from a file opened directly. Use the published site.");
else {
  showVideo();
  const noRemote = () => { if (!ready) $("tvStatus").textContent = SCREEN_HINT; };
  window.onYouTubeIframeAPIReady = connectRemote;
  const script = document.createElement("script");
  script.src = "https://www.youtube.com/iframe_api"; script.onerror = noRemote;
  document.head.append(script);
  setTimeout(noRemote, 10000);
}

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
