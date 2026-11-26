/* RMP site settings. This is the one file to edit; all pages read it. */
window.RMP_CONFIG = {
  shopify: {
    domain: "",            // "your-store.myshopify.com"
    publicToken: "",       // optional PUBLIC Storefront token. Never paste an Admin API or private token here.
    collection: "",        // optional collection handle, e.g. "merch". Blank = all products.
    apiVersion: "2026-10"  // Shopify releases new versions quarterly; update periodically.
  },
  // Booking form: requests are written as an email to this address.
  booking: { email: "Remunerativerecords@gmail.com" },
  // Email sign-up. With "action" blank, visitors send RMP an email asking to join, and you add them yourself.
  // To collect sign-ups automatically, paste your mailing list service's form address (it starts with https://)
  // and set emailField to the name that service expects for the email box (Mailchimp uses "EMAIL").
  signup: { action: "", emailField: "email" },
  // RMP.TV (tv.html). With "videos" empty, the TV plays the channel's own uploads from YouTube.
  // To choose the videos and their order yourself, list them, for example:
  //   videos: [{ title: "My video", link: "https://youtu.be/VIDEO_ID" }]
  youtube: {
    channel: "https://www.youtube.com/@rrmediapro",
    channelId: "UCYbY9VeyPMBg4IEd0el3-tQ",
    videos: []
  },
  spotify: [
    // Paste share links (track, album, playlist, artist, episode or show):
    // { title: "RMP Playlist", link: "https://open.spotify.com/playlist/XXXXXXXX" }
    // A user profile link (open.spotify.com/user/...) cannot play on the site; on the home page it becomes
    // a channel with a button that opens the profile. Swap in any link type above to make it playable.
    { title: "CUDDiE", link: "https://open.spotify.com/artist/0et1CCt24jLPLWmpxeSzAU" },
    { title: "Apollyon", link: "https://open.spotify.com/artist/0hqT1Z7A2PFdiE7Hu8Tqpt" },
    { title: "Michael Ville", link: "https://open.spotify.com/artist/5wnL8RsFqPUj7MmhVpn0kH" },
    { title: "DeeRob", link: "https://open.spotify.com/artist/34RJGeJC1CIjwByYzoyNDS" },
    { title: "E.A.Z.E", link: "https://open.spotify.com/user/31ecejq75otkhilzaaarksdwuwvu" }
  ],
  tracks: [
    // Played on the visualizer page only. MP3s you own the rights to or have permission to post.
    { title: "ghxst", artist: "Apollyon", src: "music/ghxst.mp3" },
    { title: "gxp", artist: "Apollyon", src: "music/gxp.mp3" }
  ]
};
