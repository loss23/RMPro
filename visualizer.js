/* Visualizer page. Live visuals use only this page's own <audio>; Spotify playback is never read. */
const $=id=>document.getElementById(id),audio=$("audio"),cv=$("viz"),g=cv.getContext("2d");
const tracks=((window.RMP_CONFIG||{}).tracks||[]).slice();
let index=tracks.findIndex(t=>t.src),loaded=-1,source="mine",ac=null,an=null,spotify=null;
const freq=new Uint8Array(512),wave=new Uint8Array(1024);
const say=t=>$("title").textContent=t;

function renderList(){const list=$("list");list.textContent="";tracks.forEach((t,i)=>{const li=document.createElement("li"),b=document.createElement("button");b.type="button";b.textContent=t.title+" - "+t.artist+(t.src?"":" (coming soon)");b.disabled=!t.src;b.setAttribute("aria-current",String(i===loaded));b.onclick=()=>start(i);li.append(b);list.append(li)})}
function graph(){if(ac)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ac=new AC();an=ac.createAnalyser();an.fftSize=1024;an.smoothingTimeConstant=.78;ac.createMediaElementSource(audio).connect(an);an.connect(ac.destination)}
function resume(){graph();if(ac&&ac.state!=="running")ac.resume();audio.play().catch(()=>say("Could not play this file. Check the file path or format."))}
function start(i){if(!tracks[i]||!tracks[i].src)return;index=i;if(loaded!==i){loaded=i;audio.src=tracks[i].src;say(tracks[i].artist+" - "+tracks[i].title);renderList()}resume()}
function skip(d){const n=tracks.length;for(let k=1;k<=n;k++){const i=(((loaded<0?0:loaded)+d*k)%n+n)%n;if(tracks[i].src)return start(i)}}
$("play").onclick=()=>{if(source!=="mine")show("mine");if(!audio.paused)audio.pause();else if(loaded>=0)resume();else if(index>=0)start(index);else say("No RMP tracks yet. Use Open audio file to try the visualizer.")};
$("stop").onclick=()=>{audio.pause();if(loaded>=0)audio.currentTime=0};
$("prev").onclick=()=>skip(-1);$("next").onclick=()=>skip(1);
$("file").onchange=e=>{const files=[...e.target.files];if(!files.length)return;show("mine");const first=tracks.length;files.forEach(f=>tracks.push({title:f.name.replace(/\.[^.]+$/,""),artist:"Your file",src:URL.createObjectURL(f)}));start(first);e.target.value=""};
audio.volume=.8;$("vol").oninput=e=>audio.volume=e.target.value/100;
const clock=s=>Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0");
audio.ontimeupdate=()=>{$("time").textContent=clock(audio.currentTime);if(audio.duration)$("seek").value=audio.currentTime/audio.duration*1000};
audio.onloadedmetadata=()=>$("seek").disabled=!isFinite(audio.duration);
$("seek").oninput=e=>{if(audio.duration)audio.currentTime=e.target.value/1000*audio.duration};
audio.onplay=()=>{if(spotify)spotify.pause();$("play").textContent="Pause";$("state").textContent="PLAY"};
audio.onpause=()=>{$("play").textContent="Play";$("state").textContent=source==="mine"?"PAUSE":"FREE RUN"};
audio.onended=()=>skip(1);

function show(which){source=which;const mine=which==="mine";$("mine").hidden=!mine;$("sp").hidden=mine;$("tabMine").setAttribute("aria-pressed",String(mine));$("tabSp").setAttribute("aria-pressed",String(!mine));
if(mine){if(spotify)spotify.pause();$("state").textContent=loaded<0?"DEMO":"PAUSE";say(loaded<0?"Pick a track or open an audio file":tracks[loaded].artist+" - "+tracks[loaded].title)}
else{audio.pause();$("state").textContent="FREE RUN";say("Spotify source: visuals are free running");
/* No playback listener here on purpose: nothing on this canvas reads Spotify playback. */
if(!spotify)spotify=window.RMPSpotify?RMPSpotify.mount({items:(window.RMP_CONFIG||{}).spotify,host:$("spHost"),list:$("spList"),status:$("spStatus")}):{pause(){}}}}
$("tabMine").onclick=()=>show("mine");$("tabSp").onclick=()=>show("spotify");

/* ---------- visuals ---------- */
const MODES=[["bars","Spectrum"],["scope","Oscilloscope"],["tunnel","Warp tunnel"],["stars","Starfield"]];
let mode="bars";try{const m=localStorage.getItem("rmp-viz");if(MODES.some(x=>x[0]===m))mode=m}catch(e){}
MODES.forEach(([id,name])=>{const b=document.createElement("button");b.type="button";b.textContent=name;b.dataset.mode=id;b.setAttribute("aria-pressed",String(id===mode));b.onclick=()=>{mode=id;try{localStorage.setItem("rmp-viz",id)}catch(e){}[...$("modes").children].forEach(x=>x.setAttribute("aria-pressed",String(x===b)));clear();dirty=true};$("modes").append(b)});
let motion=!matchMedia("(prefers-reduced-motion: reduce)").matches,dirty=true;
const label=()=>$("motion").textContent=motion?"Pause visuals":"Start visuals";
$("motion").onclick=()=>{motion=!motion;dirty=true;label()};label();
$("full").onclick=()=>{const s=$("screen");if(document.fullscreenElement)document.exitFullscreen();else if(s.requestFullscreen)s.requestFullscreen().catch(()=>say("Full screen is not available here"));else say("Full screen is not available on this device")};
document.addEventListener("fullscreenchange",()=>$("full").textContent=document.fullscreenElement?"Exit full screen":"Full screen");

let W=0,H=0;const peaks=new Array(48).fill(0),buf=document.createElement("canvas"),bx=buf.getContext("2d");
const stars=Array.from({length:260},()=>({x:Math.random()*2-1,y:Math.random()*2-1,z:Math.random()*.95+.05}));
const sweep=()=>sunsetGradient(g,0,0,W,0);
function clear(){g.globalAlpha=1;g.fillStyle="#04030a";g.fillRect(0,0,W,H)}
function size(){const r=Math.min(devicePixelRatio||1,2),w=Math.round(cv.clientWidth*r),h=Math.round(cv.clientHeight*r);if(cv.width!==w||cv.height!==h){cv.width=buf.width=w;cv.height=buf.height=h;W=w;H=h;clear();dirty=true}}
/* Live data only from our own <audio>. Otherwise a made-up signal driven by the clock. */
function sample(t){if(source==="mine"&&an&&!audio.paused){an.getByteFrequencyData(freq);an.getByteTimeDomainData(wave);return}
for(let i=0;i<512;i++)freq[i]=Math.max(0,(150+60*Math.sin(i*.09+t*1.7)+40*Math.sin(i*.031-t*1.1))*(1-i/620));
for(let i=0;i<1024;i++)wave[i]=128+34*Math.sin(i*.03+t*2.3)+16*Math.sin(i*.011-t*1.4)}
const level=(a,b)=>{let s=0;for(let i=a;i<b;i++)s+=freq[i];return s/(b-a)/255};
function bars(){clear();const n=48,w=W/n,seg=Math.max(4,H/48),floor=H*.78,tone=sweep();for(let i=0;i<n;i++){const a=Math.floor(Math.pow(400,i/n)),b=Math.max(a+1,Math.floor(Math.pow(400,(i+1)/n))),v=level(a,b)*floor*.95;
g.fillStyle=tone;for(let y=0;y<v;y+=seg){g.globalAlpha=1;g.fillRect(i*w+1,floor-y-seg+2,w-3,seg-2);const back=y*.3;if(back<H-floor){g.globalAlpha=.22*(1-back/(H-floor));g.fillRect(i*w+1,floor+back+3,w-3,Math.max(1,seg*.3-1))}}
g.globalAlpha=1;peaks[i]=Math.max(v,peaks[i]-H*.006);g.fillStyle="#fff";g.fillRect(i*w+1,floor-peaks[i]-4,w-3,3)}}
function trace(color,width,fn){g.strokeStyle=color;g.lineWidth=width;g.beginPath();fn();g.stroke()}
function scope(){g.fillStyle="rgba(4,3,10,.3)";g.fillRect(0,0,W,H);const tone=sweep();for(const [c,lw,alpha] of [[tone,H/34,.2],[tone,H/110,1],["#fff",Math.max(1,H/420),.8]]){g.globalAlpha=alpha;trace(c,lw,()=>{for(let i=0;i<1024;i+=2){const x=i/1022*W,y=H/2+(wave[i]-128)/128*H*.46;i?g.lineTo(x,y):g.moveTo(x,y)}})}g.globalAlpha=1}
/* Feedback loop: redraw the last frame slightly bigger and rotated, in the style of early-2000s PC visualizers. */
function tunnel(t){bx.clearRect(0,0,W,H);bx.drawImage(cv,0,0);clear();const bass=level(1,12);g.save();g.translate(W/2,H/2);g.rotate(.018+.01*Math.sin(t*.3));const z=1.035+bass*.025;g.scale(z,z);g.globalAlpha=.9;g.drawImage(buf,-W/2,-H/2);g.restore();
const R=Math.min(W,H)*(.14+bass*.1);trace("hsl("+(320+62*Math.sin(t*.55))+",100%,65%)",H/160,()=>{for(let i=0;i<=180;i++){const a=i/180*Math.PI*2,r=R+(wave[(i%180)*5]-128)/128*R*.9,x=W/2+Math.cos(a+t*.5)*r,y=H/2+Math.sin(a+t*.5)*r;i?g.lineTo(x,y):g.moveTo(x,y)}})}
function starfield(t,dt){g.fillStyle="rgba(4,3,10,.4)";g.fillRect(0,0,W,H);const speed=(.15+level(1,40)*.8)*dt;for(let n=0;n<stars.length;n++){const s=stars[n],old=s.z;s.z-=speed;if(s.z<=.05){s.x=Math.random()*2-1;s.y=Math.random()*2-1;s.z=1;continue}
const p=z=>[W/2+s.x/z*W*.28,H/2+s.y/z*H*.28],[x0,y0]=p(old),[x1,y1]=p(s.z);trace(RMP_TINTS[n%RMP_TINTS.length],(1-s.z)*H/130+1,()=>{g.moveTo(x0,y0);g.lineTo(x1+.5,y1+.5)})}
/* a ringed planet in the middle, swelling with the low end */
const r=Math.min(W,H)*(.08+level(1,12)*.09),orb=g.createRadialGradient(W/2-r*.35,H/2-r*.4,r*.05,W/2,H/2,r*1.05);orb.addColorStop(0,"#ffd2ad");orb.addColorStop(.28,"#ff6b8a");orb.addColorStop(.68,"#6d35c9");orb.addColorStop(1,"#1a0d38");
const ring=(from,to)=>{g.strokeStyle="#ffc4e1b3";g.lineWidth=Math.max(1.5,r*.05);g.beginPath();g.ellipse(W/2,H/2,r*1.75,r*.46,-.32,from,to);g.stroke()};
ring(Math.PI,Math.PI*2);g.fillStyle=orb;g.beginPath();g.arc(W/2,H/2,r,0,7);g.fill();ring(0,Math.PI)}
const draw={bars,scope,tunnel,stars:starfield};
/* Page background: the shared starry sky. It holds still while the visuals are paused, and never reads audio. */
const sky=createStarfield($("dust"));
let skyAt=-1e9,skySize="",skyStill=false;
function night(ms){const size=innerWidth+"x"+innerHeight,still=!motion,changed=size!==skySize||still!==skyStill;
if(!changed&&(still||ms-skyAt<31))return;skyAt=ms;skySize=size;skyStill=still;sky.draw(vt*1000,{still})}
let last=0,vt=0;
function frame(ms){const dt=Math.min(.05,(ms-last)/1000||0);last=ms;size();
if(W&&H){if(motion){vt+=dt;sample(vt);draw[mode](vt,dt)}else if(dirty){for(let k=0;k<40;k++){sample(2+k/60);draw[mode](2+k/60,1/60)}}dirty=false}
night(ms);requestAnimationFrame(frame)}
renderList();requestAnimationFrame(frame);
