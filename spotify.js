/* Spotify embed (iFrame API). No API key or secret needed. */
window.RMPSpotify = (function () {
  const TYPES = "track|album|playlist|artist|episode|show";
  function parse(link) {
    const m = String(link || "").match(new RegExp("(?:spotify:|open\\.spotify\\.com/(?:intl-[a-z-]+/)?(?:embed/)?)(" + TYPES + ")[:/]([A-Za-z0-9]+)"));
    return m ? { uri: "spotify:" + m[1] + ":" + m[2], url: "https://open.spotify.com/" + m[1] + "/" + m[2] } : null;
  }

  /* Options: items, host, list, status, height, and optionally
     fill(button, item, n) to draw a list button, onSelect(item), and onState(state) for playback controls.
     Without onState, nothing listens to Spotify playback. */
  function mount(opts) {
    const items = (opts.items || []).map(i => Object.assign({ title: i.title }, parse(i.link))).filter(i => i.uri);
    items.forEach((item, n) => item.title = item.title || "Spotify selection " + (n + 1));
    const { host, list, status } = opts;
    const none = () => {};
    if (!items.length) { status.textContent = "Spotify music is coming soon."; return { pause: none, toggle: none, seek: none, step: none }; }

    let controller = null, index = 0;
    const out = document.createElement("a");
    out.className = "sp-out"; out.target = "_blank"; out.rel = "noopener"; out.textContent = "Open on Spotify";
    status.after(out);

    function select(n) {
      index = (n + items.length) % items.length;
      const item = items[index];
      out.href = item.url;
      [...list.children].forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
      if (controller) (controller.loadEntity || controller.loadUri).call(controller, item.uri);
      if (opts.onSelect) opts.onSelect(item);
    }
    items.forEach((item, n) => {
      const b = document.createElement("button");
      b.type = "button"; b.onclick = () => { if (n !== index) select(n); };
      if (opts.fill) opts.fill(b, item, n); else b.textContent = item.title;
      list.append(b);
    });
    select(0);

    status.textContent = "Loading the Spotify player…";
    const fail = () => { if (!controller) status.textContent = "The Spotify player could not load here. Use the link to listen."; };
    window.onSpotifyIframeApiReady = api => {
      const slot = document.createElement("div"); host.append(slot);
      api.createController(slot, { uri: items[index].uri, width: "100%", height: opts.height || 352 }, c => {
        controller = c; status.textContent = "";
        if (!opts.onState) return;
        c.addListener("playback_update", e => {
          const d = e.data;
          if (d) opts.onState({ ready: true, paused: !!d.isPaused, position: (d.position || 0) / 1000, duration: (d.duration || 0) / 1000 });
        });
        opts.onState({ ready: true, paused: true, position: 0, duration: 0 });
      });
    };
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1"; script.async = true; script.onerror = fail;
    document.body.append(script); setTimeout(fail, 8000);

    return {
      pause() { if (controller) controller.pause(); },
      toggle() { if (controller) controller.togglePlay(); },
      seek(seconds) { if (controller) controller.seek(Math.floor(seconds)); },
      step(by) { select(index + by); if (controller) controller.play(); }
    };
  }
  return { parse, mount };
})();
