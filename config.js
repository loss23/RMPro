/* RMP site settings. This is the one file to edit; both pages read it. */
window.RMP_CONFIG = {
  shopify: {
    domain: "",            // "your-store.myshopify.com"
    publicToken: "",       // optional PUBLIC Storefront token. Never paste an Admin API or private token here.
    collection: "",        // optional collection handle, e.g. "merch". Blank = all products.
    apiVersion: "2026-10"  // Shopify releases new versions quarterly; update periodically.
  },
  spotify: [
    // Paste share links (track, album, playlist, artist, episode or show):
    // { title: "RMP Playlist", link: "https://open.spotify.com/playlist/XXXXXXXX" }
    { title: "CUDDiE", link: "https://open.spotify.com/artist/0et1CCt24jLPLWmpxeSzAU" },
    { title: "Michael Ville", link: "https://open.spotify.com/artist/5wnL8RsFqPUj7MmhVpn0kH" },
    { title: "DeeRob", link: "https://open.spotify.com/artist/34RJGeJC1CIjwByYzoyNDS" }
  ],
  tracks: [
    // MP3s you own the rights to or have permission to post.
    { title: "ghxst", artist: "Apollyon", src: "music/ghxst.mp3" },
    { title: "gxp", artist: "Apollyon", src: "music/gxp.mp3" }
  ]
};
