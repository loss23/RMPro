# RMP website

Upload every file in this folder to the same place on your web host. Edit `config.js` to connect your accounts.

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

## Your own music
Add MP3 paths under `tracks`. Host them on the same site as the pages. Audio from another domain
without CORS permission will not drive the visualizer and may be silent.

## Spotify rules to know
- The Developer Policy says not to synchronize Spotify recordings with visual media, so the visualizer
  does not read Spotify playback. Showing free-running visuals beside the player is our design choice,
  not something Spotify has approved.
- The policy also restricts commercial use around Spotify streaming and has separate Widget Terms.
  Review both before putting the store and the player on the same live site:
  https://developer.spotify.com/policy  and  https://developer.spotify.com/documentation/embeds/terms

## Artist photos
Put photos in an `images` folder (square crops work best). In `index.html`, set each artist's `photo`,
for example `photo:"images/cuddie.jpg"`. Use only photos you have permission to use.

## Testing
Use a web host or a local server (`python3 -m http.server`), not a double-clicked file.
