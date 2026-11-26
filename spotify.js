/* Spotify embed (iFrame API). No API key or secret needed. */
window.RMPSpotify = (function () {
  const TYPES = "track|album|playlist|artist|episode|show";
  function parse(link) {
    const m = String(link || "").match(new RegExp("(?:spotify:|open\\.spotify\\.com/(?:intl-[a-z-]+/)?(?:embed/)?)(" + TYPES + ")[:/]([A-Za-z0-9]+)"));
    return m ? { uri: "spotify:" + m[1] + ":" + m[2], url: "https://open.spotify.com/" + m[1] + "/" + m[2] } : null;
  }
  function mount(opts) {
    const items = (opts.items || []).map(i => Object.assign({ title: i.title }, parse(i.link))).filter(i => i.uri);
    const { host, list, status } = opts;
    if (!items.length) { status.textContent = "Spotify music is coming soon."; return { pause() {} }; }
    let controller = null, current = items[0], ready = false;
    const out = document.createElement("a");
    out.className = "sp-out"; out.target = "_blank"; out.rel = "noopener"; out.textContent = "Open on Spotify";
    status.after(out);
    function select(item, button) {
      current = item; out.href = item.url;
      [...list.children].forEach(b => b.setAttribute("aria-pressed", String(b === button)));
      if (controller) controller.loadUri(item.uri);
    }
    items.forEach((item, n) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = item.title || "Spotify selection " + (n + 1);
      b.onclick = () => select(item, b);
      list.append(b);
    });
    select(current, list.firstChild);
    status.textContent = "Loading the Spotify player…";
    const fail = () => { if (!ready) status.textContent = "The Spotify player could not load here. Use the link to listen."; };
    window.onSpotifyIframeApiReady = api => {
      const slot = document.createElement("div"); host.append(slot);
      api.createController(slot, { uri: current.uri, width: "100%", height: 352 }, c => {
        controller = c; ready = true; status.textContent = "";
        if (opts.onPlay) c.addListener("playback_update", e => { if (e.data && !e.data.isPaused) opts.onPlay(); });
      });
    };
    const s = document.createElement("script");
    s.src = "https://open.spotify.com/embed/iframe-api/v1"; s.async = true; s.onerror = fail;
    document.body.append(s); setTimeout(fail, 8000);
    return { pause() { if (controller) controller.pause(); } };
  }
  return { parse, mount };
})();
