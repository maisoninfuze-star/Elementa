/* ════════════════════════════════════════════════════════════════
   Elementa — shared app script (multi-page)
   Runs on every page. Heavy hero logic only activates on the home page.
   ════════════════════════════════════════════════════════════════ */
gsap.registerPlugin(ScrollTrigger);

/* ──────────────────────────────────────────────────────────────
   1. SHARED UI — nav, mobile menu, language, scroll progress
   ────────────────────────────────────────────────────────────── */
const nav   = document.getElementById('nav');
const sprog = document.getElementById('sprog');
window.addEventListener('scroll', ()=>{
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  if (sprog){
    const h = document.body.scrollHeight - window.innerHeight;
    sprog.style.transform = `scaleX(${h>0 ? window.scrollY/h : 0})`;
  }
}, {passive:true});

/* Mobile menu */
const burger = document.getElementById('burger');
const mmenu  = document.getElementById('mmenu');
function toggleMenu(force){
  if (!mmenu) return;
  const open = force !== undefined ? force : !mmenu.classList.contains('open');
  mmenu.classList.toggle('open', open);
  if (burger) burger.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
if (burger) burger.addEventListener('click', ()=>toggleMenu());
if (mmenu)  mmenu.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>toggleMenu(false)));

/* Language toggle (persisted across pages) */
let lang = localStorage.getItem('elementa-lang') || 'fr';
function applyLang(){
  document.querySelectorAll('[data-fr]').forEach(el=>{
    const v = el.getAttribute('data-'+lang);
    if(!v) return;
    if(v.includes('<')) el.innerHTML = v; else el.textContent = v;
  });
  const lb = document.getElementById('langBtn');
  const mb = document.getElementById('mlangBtn');
  if (lb) lb.textContent = lang==='fr' ? 'EN' : 'FR';
  if (mb) mb.textContent = lang==='fr' ? 'English' : 'Français';
  document.documentElement.lang = lang;
  localStorage.setItem('elementa-lang', lang);
}
function toggleLang(){ lang = lang==='fr' ? 'en' : 'fr'; applyLang(); }
const _lb = document.getElementById('langBtn');  if (_lb) _lb.addEventListener('click', toggleLang);
const _mb = document.getElementById('mlangBtn'); if (_mb) _mb.addEventListener('click', toggleLang);
applyLang();   // apply stored language immediately

/* Smooth anchor nav — falls back to home page for cross-page hashes */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const hash = a.getAttribute('href');
    if (hash === '#' ) return;
    const t = document.querySelector(hash);
    e.preventDefault();
    if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 70, behavior:'smooth' });
    else   window.location.href = 'index.html' + hash;   // section lives on home
  });
});
/* Honour an incoming hash (e.g. arriving from another page) */
if (location.hash){
  const t = document.querySelector(location.hash);
  if (t) setTimeout(()=>window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 70 }), 120);
}

/* ──────────────────────────────────────────────────────────────
   2. COOKIE BANNER (Québec Law 25 — explicit opt-in, no implied consent)
   ────────────────────────────────────────────────────────────── */
(function(){
  const bar = document.getElementById('cookie');
  if (!bar) return;
  if (localStorage.getItem('elementa-cookie')) return;     // already chose
  setTimeout(()=>bar.classList.add('show'), 1400);
  function choose(v){ localStorage.setItem('elementa-cookie', v); bar.classList.remove('show'); }
  bar.querySelector('.ck-accept').addEventListener('click', ()=>choose('accepted'));
  bar.querySelector('.ck-refuse').addEventListener('click', ()=>choose('refused'));
})();

/* ──────────────────────────────────────────────────────────────
   3. LIGHTBOX (gallery page)
   ────────────────────────────────────────────────────────────── */
(function(){
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const img   = lb.querySelector('img');
  const items = Array.from(document.querySelectorAll('.gp-item img'));
  let idx = 0;
  function open(i){ idx=(i+items.length)%items.length; img.src=items[idx].src; lb.classList.add('open'); document.body.style.overflow='hidden'; }
  function close(){ lb.classList.remove('open'); document.body.style.overflow=''; }
  items.forEach((im,i)=>im.parentElement.addEventListener('click', ()=>open(i)));
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', e=>{ e.stopPropagation(); open(idx-1); });
  lb.querySelector('.lb-next').addEventListener('click', e=>{ e.stopPropagation(); open(idx+1); });
  lb.addEventListener('click', e=>{ if (e.target===lb) close(); });
  document.addEventListener('keydown', e=>{
    if (!lb.classList.contains('open')) return;
    if (e.key==='Escape') close();
    if (e.key==='ArrowLeft') open(idx-1);
    if (e.key==='ArrowRight') open(idx+1);
  });
})();

/* ──────────────────────────────────────────────────────────────
   4. PAGE ANIMATIONS (run on every page; each guarded)
   ────────────────────────────────────────────────────────────── */
function initPage(){
  // Generic reveals
  gsap.utils.toArray('.reveal').forEach(el=>{
    gsap.to(el,{opacity:1,y:0,duration:.6,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%'}});
  });

  // Intro lines (home)
  gsap.utils.toArray('.intro-line span').forEach((el,i)=>{
    gsap.to(el,{y:0,duration:.8,delay:i*.08,ease:'power3.out',scrollTrigger:{trigger:'#intro',start:'top 80%'}});
  });
  if (document.querySelector('.intro-tag'))
    gsap.to('.intro-tag',{opacity:1,duration:.6,scrollTrigger:{trigger:'#intro',start:'top 65%'}});

  // 3D scroll card (home)
  if (document.getElementById('scCard')){
    const m = window.innerWidth <= 768;
    const s = m ? [0.7,0.9] : [1.05,1];
    gsap.set('#scCard',{ transformPerspective:1000, rotateX:20, scale:s[0] });
    gsap.timeline({ scrollTrigger:{ trigger:'#showcase', start:'top 85%', end:'top 15%', scrub:0.5 } })
      .fromTo('#scCard',{ rotateX:20, scale:s[0] },{ rotateX:0, scale:s[1], ease:'none' },0)
      .fromTo('#scHeader',{ y:0 },{ y:-100, ease:'none' },0);
  }

  // Card stack (home)
  if (document.getElementById('cardstack'))
    initCardStack({ initialIndex:0, autoAdvance:true, intervalMs:3500, pauseOnHover:true, showDots:true });

  // Philosophy parallax (home)
  if (document.querySelector('.phi-img'))
    gsap.to('.phi-img',{ y:'-12%', ease:'none', scrollTrigger:{ trigger:'#philosophy', start:'top bottom', end:'bottom top', scrub:true }});

  // Stats count-up
  document.querySelectorAll('.bs-val[data-target]').forEach(el=>{
    const target=+el.dataset.target, suffix=el.dataset.suffix||'';
    ScrollTrigger.create({trigger:el,start:'top 88%',once:true,onEnter:()=>{
      gsap.fromTo({v:0},{v:target},{duration:1.1,ease:'power2.out',onUpdate(){el.textContent=Math.round(this.targets()[0].v)+suffix;}});
    }});
  });
}

/* ──────────────────────────────────────────────────────────────
   5. HERO — frame pre-extraction scrub (HOME ONLY)
   ────────────────────────────────────────────────────────────── */
const vid = document.getElementById('vv');
const heroCanvas = document.getElementById('vc');

if (vid && heroCanvas){
  const heroCtx = heroCanvas.getContext('2d', { alpha:false });

  const FRAME_COUNT = 48;     // frames pre-decoded into memory
  const FRAME_W     = 1000;   // downscaled width — lower memory ⇒ no GC jank
  let frames = [];
  let frameH = 0;
  let currentFrame = -1;
  let rafPending = false;
  let pendingIdx = 0;

  function resizeHero(){
    heroCanvas.width  = window.innerWidth;
    heroCanvas.height = window.innerHeight;
    drawFrame(currentFrame < 0 ? 0 : currentFrame, true);
  }
  window.addEventListener('resize', resizeHero);

  function drawFrame(i, force){
    if (!frames.length) return;
    i = Math.max(0, Math.min(FRAME_COUNT-1, i));
    if (i === currentFrame && !force) return;
    currentFrame = i;
    const img = frames[i];
    if (!img) return;
    const cw = heroCanvas.width, ch = heroCanvas.height;
    const iw = img.width, ih = img.height;
    const scale = Math.max(cw/iw, ch/ih);
    const w = iw*scale, h = ih*scale;
    heroCtx.drawImage(img, (cw-w)/2, (ch-h)/2, w, h);
  }
  // rAF-batched draw so we never draw more than once per frame
  function queueDraw(i){
    pendingIdx = i;
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(()=>{ rafPending = false; drawFrame(pendingIdx); });
  }

  function seekVideo(t){
    return new Promise(res=>{
      const on=()=>{ vid.removeEventListener('seeked',on); res(); };
      vid.addEventListener('seeked',on);
      vid.currentTime = t;
    });
  }

  async function extractFrames(onProgress){
    const dur = vid.duration;
    // Resilience: if the video is missing/failed (404, decode error), skip
    // extraction so the loader still dismisses instead of hanging on NaN seeks.
    if (!isFinite(dur) || dur <= 0 || !vid.videoWidth) {
      if (onProgress) onProgress(1);
      return;
    }
    frameH = Math.round(FRAME_W * (vid.videoHeight / vid.videoWidth));
    for (let i=0;i<FRAME_COUNT;i++){
      await seekVideo((i/(FRAME_COUNT-1)) * (dur-0.05));
      let bmp;
      try { bmp = await createImageBitmap(vid,{ resizeWidth:FRAME_W, resizeHeight:frameH, resizeQuality:'high' }); }
      catch(e){ const oc=document.createElement('canvas'); oc.width=FRAME_W; oc.height=frameH; oc.getContext('2d').drawImage(vid,0,0,FRAME_W,frameH); bmp=oc; }
      frames[i]=bmp;
      if (onProgress) onProgress((i+1)/FRAME_COUNT);
    }
  }

  const ldBar = document.getElementById('ldBar');
  const ldPct = document.getElementById('ldPct');
  if (ldBar) gsap.fromTo(ldBar,{x:'-100%'},{x:'0%',duration:1.2,ease:'power2.inOut'});
  const setLoad = p => { if (ldPct) ldPct.textContent = Math.round(p*100)+'%'; };

  async function initHero(){
    resizeHero();
    await extractFrames(setLoad);
    drawFrame(0,true);
    if (ldPct) ldPct.textContent='100%';
    const loaderEl = document.getElementById('loader');
    gsap.to('#loader',{opacity:0,duration:0.5,delay:0.1,onComplete:()=>{ if(loaderEl) loaderEl.style.display='none'; }});
    // Hard fallback — guarantees dismissal even if rAF (gsap) is throttled in a background tab
    setTimeout(()=>{ if(loaderEl && loaderEl.style.display!=='none'){ loaderEl.style.transition='opacity .4s'; loaderEl.style.opacity='0'; setTimeout(()=>loaderEl.style.display='none',420); } }, 900);

    // Hero text entrance
    gsap.timeline({delay:0.25})
      .to('.h-eye',    {opacity:1,y:0,duration:.5,ease:'power3.out'})
      .to('.h-title',  {opacity:1,y:0,duration:.6,ease:'power3.out'},'-=.25')
      .to('.h-sub',    {opacity:1,y:0,duration:.5,ease:'power3.out'},'-=.25')
      .to('.h-actions',{opacity:1,y:0,duration:.45,ease:'power3.out'},'-=.2')
      .to('.h-pill',   {opacity:1,scale:1,duration:.5,stagger:.1,ease:'back.out(1.6)'},'-=.2')
      .to('.h-rating', {opacity:1,y:0,duration:.5,ease:'power3.out'},'-=.4')
      .to('.h-scroll', {opacity:1,duration:.4},'-=.2');

    // Scrub — draw cached frames via rAF (no seeking, no GC ⇒ smooth)
    ScrollTrigger.create({
      trigger:'#hero', start:'top top', end:'bottom bottom', scrub:true,
      onUpdate: self => queueDraw(Math.round(self.progress*(FRAME_COUNT-1)))
    });

    gsap.to('.pill-1',{y:-40,scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:1}});
    gsap.to('.pill-2',{y:-70,scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:1}});
    gsap.to('.pill-3',{y:-30,scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:1}});

    ScrollTrigger.refresh();
  }

  let _inited=false;
  const startOnce=()=>{ if(_inited)return; _inited=true; initHero(); };
  if (vid.readyState>=2 && vid.videoWidth) startOnce();
  else { vid.addEventListener('loadeddata',startOnce); vid.addEventListener('canplay',startOnce); vid.addEventListener('error',startOnce); setTimeout(startOnce,3000); }
}

/* ──────────────────────────────────────────────────────────────
   6. CARD STACK (coverflow fan — vanilla port of <CardStack/>)
   ────────────────────────────────────────────────────────────── */
function initCardStack({ initialIndex=0, autoAdvance=true, intervalMs=3500, pauseOnHover=true, showDots=true } = {}){
  const stack   = document.getElementById('cardstack');
  const cards   = Array.from(document.querySelectorAll('#csTrack .cs-card'));
  const dotsBox = document.getElementById('csDots');
  const counter = document.getElementById('elCounter');
  const track   = document.getElementById('csTrack');
  const N = cards.length;
  if (!N) return;

  let front = initialIndex % N, timer = null, paused = false;
  stack.style.setProperty('--csdur', intervalMs+'ms');

  if (showDots){
    dotsBox.innerHTML='';
    cards.forEach((_,i)=>{ const b=document.createElement('button'); b.className='cs-dot'; b.setAttribute('aria-label','Élément '+(i+1)); b.addEventListener('click',()=>{goTo(i);restart();}); dotsBox.appendChild(b); });
  }
  let dots = Array.from(dotsBox ? dotsBox.children : []);

  function render(){
    const cw = track.clientWidth || 1000;
    const spacing = Math.min(260, Math.max(150, cw*0.21));
    cards.forEach((card,i)=>{
      let o=i-front; if(o>N/2)o-=N; if(o<-N/2)o+=N;
      const a=Math.abs(o);
      card.style.transform=`translateX(${o*spacing}px) translateZ(${-a*160}px) rotateY(${o*-26}deg) scale(${a===0?1.06:Math.max(1-a*0.16,0.6)})`;
      card.style.opacity = a>2?'0':(a===2?'0.55':'1');
      card.style.zIndex  = String(100-a);
      card.classList.toggle('front', o===0);
    });
    if (counter) counter.textContent = String(front+1).padStart(2,'0');
    if (showDots){
      dots.forEach((d,i)=>{ if(i!==front){ d.classList.remove('active'); d.classList.toggle('paused',paused);} });
      const old=dots[front], fresh=old.cloneNode(true);
      fresh.className='cs-dot active'+(paused?' paused':'');
      old.replaceWith(fresh); dots[front]=fresh;
      fresh.addEventListener('click',()=>{goTo(front);restart();});
    }
  }
  function goTo(i){ front=((i%N)+N)%N; render(); }
  function next(){ goTo(front+1); }
  function start(){ if(autoAdvance&&!timer&&!paused) timer=setInterval(next,intervalMs); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} }
  function restart(){ stop(); start(); }

  if (pauseOnHover){
    stack.addEventListener('mouseenter',()=>{ paused=true; stop(); dots.forEach(d=>d.classList.add('paused')); });
    stack.addEventListener('mouseleave',()=>{ paused=false; dots.forEach(d=>d.classList.remove('paused')); restart(); });
  }
  cards.forEach((card,i)=>card.addEventListener('click',()=>{ if(i!==front){goTo(i);restart();} }));
  window.addEventListener('resize', render);
  new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting?restart():stop()),{threshold:0.15}).observe(stack);

  render(); start();
}

/* kick off page animations */
initPage();
