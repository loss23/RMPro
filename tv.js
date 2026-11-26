/* RMP.TV: a TV-style frame and remote around YouTube's own embedded player. Settings: RMP_CONFIG.youtube in config.js.
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

let player = null, ready = false, ids = [], current = 0, waiting = 0, listWait = 0;
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

/* The playlist arrives a moment after the player is ready. */
function readList() {
  const list = (player.getPlaylist && player.getPlaylist()) || [];
  if (!list.length) return false;
  if (list.join() !== ids.join()) { ids = list.slice(); drawGuide(); }
  const at = player.getPlaylistIndex ? player.getPlaylistIndex() : 0;
  if (at >= 0) current = at;
  ["chUp", "chDown", "play", "mute"].forEach(k => $(k).disabled = false);
  powerOn(); clearTimeout(waiting);
  showNow();
  return true;
}

function pollList(tries) {
  if (readList()) return;
  if (tries > 0) listWait = setTimeout(pollList, 500, tries - 1);
  else standby("The video list could not load here. Watch on YouTube instead.");
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

function startPlayer() {
  const vars = { playsinline: 1, rel: 0 };
  if (!picked.length) Object.assign(vars, { listType: "playlist", list: uploads });
  player = new YT.Player("tvPlayer", {
    host: "https://www.youtube-nocookie.com", width: "100%", height: "100%", playerVars: vars,
    events: {
      onReady() {
        ready = true;
        if (picked.length) player.cuePlaylist(picked.map(v => v.id));
        powerOn(); // the player must never sit underneath the standby card
        pollList(16);
      },
      onStateChange(e) {
        readList();
        $("play").textContent = e.data === 1 ? "Pause" : "Play";
        if (e.data === 1) $("tvStatus").textContent = "";
      },
      onError() { $("tvStatus").textContent = "This video can’t play here. Change the channel or watch it on YouTube."; }
    }
  });
}

if (!picked.length && !uploads) standby("No videos are set up yet.");
else {
  const failed = () => { if (!ready) standby("The video player could not load here. Watch on YouTube instead."); };
  window.onYouTubeIframeAPIReady = startPlayer;
  const script = document.createElement("script");
  script.src = "https://www.youtube.com/iframe_api"; script.onerror = failed;
  document.head.append(script);
  waiting = setTimeout(failed, 9000);
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
