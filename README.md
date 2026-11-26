# RMP website

Upload every file in this folder to the same place on your web host. No build step is needed.

## Which file to edit
| To change | Edit |
|---|---|
| Artists, collaborators, shows and the spotlight | `content.js` |
| Shopify, Spotify and your own tracks | `config.js` |
| Page text and section order | `index.html`, `visualizer.html`, `tv.html`, `spotlight.html` |
| Colors and fonts (both pages) | `theme.css` |
| Layout and looks | `styles.css` (home), `visualizer.css`, `tv.css`, `spotlight.css` |

Other scripts: `app.js` (player and page content), `effects.js` (home animation), `shared.js` (star field and
canvas helpers used by both pages), `spotify.js`, `shopify.js`, `visualizer.js`. Keep the script order in the HTML files.

## Shopify
1. Set `shopify.domain` to your `something.myshopify.com` address.
2. Make your products available to the storefront (sales channel) you use for API access.
3. Leave `publicToken` blank to use tokenless access. If you want one, use only the PUBLIC Storefront token.
   Never put an Admin API token or private token in these files; anyone can read them.
4. Optional: set `collection` to a collection handle to show only that collection.

The site shows up to 12 products with up to 20 options each. Checkout and payment happen on Shopify.
A password-protected store may block checkout until the password is removed.

## Booking and email sign-up
The site has no server. The booking form writes an email to `booking.email` in `config.js`; the visitor opens or
copies it and sends it. Sign-up works the same way until you set `signup.action` to your mailing list service's
form address (and `signup.emailField` to its email field name). Check that service's own setup steps, send a test
sign-up, and add any consent wording it or the law requires. The note under the sign-up box promises that people
can email RMP to stop updates, so honor those requests.

## Spotlight page
`spotlight.html` features the artist named in `spotlight` in `content.js`. You can add a `headline`, a `release`
(`title` and `link`) and a YouTube `video`; each stays hidden while blank. Other artists can be picked at the top,
and each has its own link, such as `spotlight.html#deerob`.

## RMP.TV
`tv.html` is a TV-style page around YouTube's own player. Settings are `youtube` in `config.js`.
- The screen is a standard YouTube embed. The remote and channel guide connect to it afterwards; if they cannot,
  the video still plays with YouTube's own controls. After changing `tv.js`, raise the `?v=` number in `tv.html`.
- With `videos` empty it loads the channel's uploads list, so new public uploads should appear without editing the site.
- To pick videos yourself, add `{ title, link }` entries to `videos`. Titles you type show in the channel guide right away;
  with the automatic list, a video's title appears after it has been tuned in.
- YouTube does not allow anything on top of its player and needs it at least 200 by 200 pixels. Keep that if you restyle it.
- YouTube also needs to know which site is asking, so test on a web host or local server.

## Page titles, descriptions and icon
Each HTML file has its own `<title>` and description near the top. The icon files are `favicon.svg`,
`favicon-32.png` and `apple-touch-icon.png`. The `og:url` and `og:image` tags point at
`https://loss23.github.io/RMPro/`; change them if you move to your own domain.

## Spotify
Add share links to the `spotify` list. No API key is needed. This uses Spotify's embed player;
what a listener can play (full track or preview) depends on their Spotify login and plan.
It does not include account sign-in, search, or Web API data.

On the home page this is **RMP Radio**: each entry in the `spotify` list is a channel. If an entry's title matches an
artist in `content.js`, the channel and poster use that artist's photo. The official Spotify player sits inside
the RMP frame, unchanged, with RMP play, pause and seek controls below it.
A user profile link cannot be played by Spotify's embed, so that channel shows a button to the profile instead
(it is left out of the visualizer's Spotify list). Previous and next change channels
(Spotify's embed controls do not offer next song). Spotify loads when the player is near the screen.
Some browsers require the first press to be inside the Spotify player itself.

## Your own music
These play on the visualizer page only. Add MP3 paths under `tracks`. Host them on the same site as the pages. Audio from another domain
without CORS permission will not drive the visualizer and may be silent.

## Spotify rules to know
- The Developer Policy says not to synchronize Spotify recordings with visual media. So nothing on the home page
  animates with Spotify, and the visualizer does not read Spotify playback. Showing free-running visuals beside the player is our design choice,
  not something Spotify has approved.
- The policy also restricts commercial use around Spotify streaming and has separate Widget Terms.
  Review both before putting the store and the player on the same live site:
  https://developer.spotify.com/policy  and  https://developer.spotify.com/documentation/embeds/terms

## Artist photos
Put photos in an `images` folder (square crops work best). In `content.js`, set each artist's `photo`,
for example `photo:"images/cuddie.jpg"`. Use only photos you have permission to use.

## Testing
Use a web host or a local server (`python3 -m http.server`), not a double-clicked file.

## Interactive art layer (home page)
- Hero contour lines react to the pointer and clicks.
- Style filter chips are matched against each artist's `tags`. Add a new chip if you add a new style.
- The countdown uses the show's `starts` and `ends` times. Include both when you add a show.
- The name ticker fills itself from the `artists` list.

## Past shows
Edit the `pastShows` list in `content.js`. Each entry has a headliner, optional special guest, place, date, time, venue, address, openers, summary and photos.
Opener names must match the `artists` list. To add pictures from a show, put them in `images` and list
their paths in `photos`. Upcoming shows do not move here by themselves; add an entry after the show.

## Colors
The main colors are the variables in `theme.css`, used by both pages. The canvas art and some glows have their own
color values in `styles.css`, `effects.js`, `shared.js` and `visualizer.js`.

## Collaborators and stars
- Edit the `collaborators` list in `content.js`. `featured: true` puts a person first on a highlighted card.
  `handle`, `url`, `role` and `photo` are optional; without a photo the card shows initials, and without a `url` there is no button.
- The star field is in `shared.js`. The number of stars scales with the screen size; change the limits in `count`.

## Keeping it fast
- Export new images at about 800px wide for artist tiles and 900px for large photos, JPEG quality about 80.
- Large panels use a near-solid background instead of blur, and the background glows no longer animate on their own.
  Both made scrolling noticeably slower.
