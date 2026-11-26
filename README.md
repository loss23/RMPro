# RMP website

Upload every file in this folder to the same place on your web host. No build step is needed.

## Which file to edit
| To change | Edit |
|---|---|
| Artists, collaborators, upcoming and past shows | `content.js` |
| Shopify, Spotify and your own tracks | `config.js` |
| Page text and section order | `index.html`, `visualizer.html` |
| Colors and fonts (both pages) | `theme.css` |
| Layout and looks | `styles.css` (home), `visualizer.css` |

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

## Spotify
Add share links to the `spotify` list. No API key is needed. This uses Spotify's embed player;
what a listener can play (full track or preview) depends on their Spotify login and plan.
It does not include account sign-in, search, or Web API data.

On the home page, choose **Spotify** at the top of the record player. The official Spotify player appears inside it,
and the site's play, pause, seek bar and record drag control it. Previous and next move between the artists in the
`spotify` list (Spotify's embed controls do not offer next song). Spotify loads only after someone picks it.
Some browsers require the first press to be inside the Spotify player itself.

## Your own music
Add MP3 paths under `tracks`. Host them on the same site as the pages. Audio from another domain
without CORS permission will not drive the visualizer and may be silent.

## Spotify rules to know
- The Developer Policy says not to synchronize Spotify recordings with visual media. So the record does not spin
  and the sound bars are hidden for Spotify, and the visualizer does not read Spotify playback. Showing free-running visuals beside the player is our design choice,
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
- Hero contour lines react to the pointer and clicks, and to the bass of RMP's own tracks (not Spotify).
- Drag the record to scrub the current track. Seeking needs a normal web host (one that supports byte ranges); Python's basic `http.server` does not.
- Style filter chips are matched against each artist's `tags`. Add a new chip if you add a new style.
- The countdown uses the show's `starts` and `ends` times. Include both when you add a show.
- The name ticker fills itself from the `artists` list.

## Past shows
Edit the `pastShows` list in `content.js`. Each entry has a headliner, place, date, venue, openers, summary and photos.
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
