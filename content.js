/* What the home page shows. Edit this file to change artists, collaborators and shows.
   Music, Spotify and store settings are in config.js. */

/* photo: square image for tiles. full: larger image for the profile. mono and bg are used when there is no photo.
   url and service add a "Listen on ..." button; linkLabel replaces its wording.
   spotify adds a second "Listen on Spotify" button.
   An artist's tile photo is also used by the home page Spotify player when a Spotify entry in config.js has the same title. */
const artists = [
{name:"CUDDiE",tags:["Grunge","Alt rock","Hip-hop"],full:"images/cuddie-full.jpg",photo:"images/cuddie.jpg",mono:"C",bg:"radial-gradient(circle at 30% 25%,#f2a65a,#a63d2f 45%,#241018 80%)",bio:"CUDDiE is an underground alternative artist from Huntsville, Alabama, blending grunge, alternative rock, and hip-hop into a sound of his own. Known for his dark aesthetic, raw emotion, and unapologetic energy, CUDDiE turns personal struggles and inner chaos into music. With a rebellious spirit and a sound that refuses to fit into one box, he’s carving out his own lane in the underground scene.",service:"Spotify",url:"https://open.spotify.com/artist/0et1CCt24jLPLWmpxeSzAU"},
{name:"Apollyon",tags:["Cloud rap","Rage","Trap"],photo:"images/apollyon.jpg",mono:"A",bg:"conic-gradient(from 210deg at 50% 60%,#12091f,#5b2a86,#12091f,#2d1650,#12091f)",bio:"Apollyon is an underground producer with a distinct sound that draws on cloud rap, rage and trap, shaped by a wide range of unique samples.",service:"SoundCloud",url:"https://soundcloud.com/loser5808",spotify:"https://open.spotify.com/artist/0hqT1Z7A2PFdiE7Hu8Tqpt"},
{name:"Michael Ville",tags:[],photo:"",mono:"MV",bg:"linear-gradient(145deg,#3b1d8f,#8b3fd1 48%,#150c33)",bio:"",service:"Spotify",url:"https://open.spotify.com/artist/5wnL8RsFqPUj7MmhVpn0kH"},
{name:"DeeRob",role:"Artist • CEO • RMP",tags:["Hip-hop","R&B"],full:"images/deerob-full.jpg",photo:"images/deerob.jpg",mono:"DR",bg:"repeating-linear-gradient(125deg,#1f2b16 0 22px,#41602a 22px 44px)",bio:"DeeRob is a multifaceted hip-hop artist, entrepreneur, and the CEO of RMP. Blending hip-hop with elements of R&B and an unapologetic approach to music, he brings versatility and individuality to everything he touches. Beyond the microphone, DeeRob plays a major role behind the scenes, helping develop talent, build connections, and push the RMP movement forward. Whether he’s creating music, collaborating with other artists, or handling business, DeeRob operates with one mindset: make moves, break boundaries, and do it his own way.",service:"Spotify",url:"https://open.spotify.com/artist/34RJGeJC1CIjwByYzoyNDS"},
{name:"E.A.Z.E",tags:["Melodic rap","R&B","Atmospheric hip-hop"],full:"images/eaze-full.jpg",photo:"images/eaze.jpg",mono:"EZ",bg:"linear-gradient(145deg,#2b2f38,#0d0e12)",bio:"E.A.Z.E is an artist who blends melodic rap, R&B, and atmospheric hip-hop into a sound that feels cinematic, nostalgic, and emotionally unpredictable. Inspired by the energy of the '80s, the melodies of Michael Jackson, and the modern sonic worlds of Don Toliver, Travis Scott, and The Weeknd, E.A.Z.E creates music that balances vulnerability, confidence, and mystery.\n\nHis music explores love, betrayal, ambition, temptation, personal growth, and the chaos that comes with navigating life while trying to become something greater. With melodic vocals, layered harmonies, moody production, and an effortlessly smooth delivery, E.A.Z.E turns real emotions into records that feel like scenes from a movie.\n\nMore than just music, E.A.Z.E is building a world—one where dark aesthetics, nostalgic sounds, raw emotion, and modern artistry collide. Whether it's a late-night record, a toxic love story, or an anthem about overcoming setbacks, his goal is to make listeners feel something, see something, and remember something.\n\nHe's not chasing a sound. He's creating a feeling.",service:"Spotify",linkLabel:"Open Spotify profile",url:"https://open.spotify.com/user/31ecejq75otkhilzaaarksdwuwvu"}
];

/* featured: true gives a larger, highlighted card listed first.
   Optional: handle, url (their Instagram), role (a short line) and photo (use only images you have permission to use). */
const collaborators=[{name:"RichGXTH",featured:true,handle:"@richgxth",url:"https://www.instagram.com/richgxth/",role:"",photo:"images/richgxth.jpg",mono:"RG"},
{name:"Donseph",featured:true,handle:"@1donseph",url:"https://www.instagram.com/1donseph/",role:"",photo:"",mono:"DS"},
{name:"BabyJet",handle:"@babyjet256",url:"https://www.instagram.com/babyjet256/",role:"",photo:"images/babyjet.jpg",mono:"BJ"},
{name:"barzovabullshhh",handle:"@barzovabullshhh",url:"https://www.instagram.com/barzovabullshhh/",role:"",photo:"",mono:"BZ"},
{name:"big_body_music",handle:"@big_body_music",url:"https://www.instagram.com/big_body_music/",role:"",photo:"",mono:"BB"}];

/* Upcoming shows. A show leaves the page on its own once "ends" has passed. */
const shows=[{title:"A New Year's Celebration",date:"Friday, January 1, 2027",short:"Jan 1",time:"8 PM to 12 AM",
starts:"2027-01-01T20:00:00-06:00",ends:"2027-01-02T00:00:00-06:00",venue:"Maggie Meyers Irish Pub",address:"1009 Henderson Rd NW, Huntsville, AL 35816",
price:"$10 admission",deal:"Ladies get in free till 10 PM",note:"RMP presents, with performances from local artists.",
flyer:"images/new-years-flyer.jpg",url:""}];

/* Past shows. Empty date, venue or photos are left out. Openers must match names in "artists". */
const pastShows=[{headliner:"Lil Tracy",place:"in Huntsville",date:"Wednesday, October 28, 2026",venue:"Von Braun Center, Mars Music Hall",openers:["CUDDiE","Michael Ville"],summary:"Michael Ville and CUDDiE opened and performed.",photos:[]}];
