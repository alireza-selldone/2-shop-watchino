/* Watchino — demo storefront for Selldone. Vanilla JS, no dependencies.
   This is a capability demo, not a live shop: no order is ever placed. */

const SHOP = { handle:'Watchino', id:8460, xapi:'https://xapi.selldone.com' };

const CDN = 'https://cdn.selldone.com/app/shops/8460/products/';
const IMG = {
  325648: CDN + 'brownwoodenwristwatchpackedopenboxtopsideviewwhitebackground1jpg4082d4728f663cd550e8d4d5cfb1812c.jpg',
  709386: CDN + 'vecteezywristwatchispinkcoloronwhitebackground773388371jpg8e5966e837754a7285786d48de9be4f7jpg34fd4da2ab65bb90b872200afbee803ajpgba5888f141434b65fa8ab090e15c3af4.jpg',
  709384: CDN + 'vecteezyrealisticblueorangewatchclocksilverblackleatherstrap8173864jpg407441452275a8fc6ef90fd203440be7jpg6fe9cbe6b0e63cd3d26190a423c44f25jpg174ba7e2ceaad1306e59dc67c2a38f98.jpg',
  709380: CDN + 'vecteezyrealisticclockwatchsportchronographblacksilverred10477677jpgf9fad7e0f747ae07928f6bfe9c37d0d4jpg466b2995650b8512f00bfa4618a65b63jpg7b69571af09699a171650de3ac84e572.jpg',
  709376: CDN + 'luxurywatchesisolatedwhitebackgroundwithclippingpathsilverwatchwomenmanwatchesfemalemalewatches1jpg3e37acf36e833199a6ad88f119c72ac5jpgbacdceb238eeca3703f8e5d169748ae8jpga7b433ed8c46347f8380ea0281cdebeb.jpg',
  709403: CDN + 'prestigeaeroskeletonpng11dbeec5dafa5770b19b30b89b6661b2png8602efa74aa3b8e1bea03646af2ded98.png'
};

const CATS = [
  { slug:'mens-classic',      name:"Men's Classic",       icon:325648, blurb:'Round cases, printed dials, nothing shouting.' },
  { slug:'womens-collection', name:"Women's Collection",  icon:709386, blurb:'Smaller cases, set indices, quartz and automatic.' },
  { slug:'heritage-leather',  name:'Heritage & Leather',  icon:709384, blurb:'Alligator and calf, stitched by hand.' },
  { slug:'sport-chronograph', name:'Sport & Chronograph', icon:709380, blurb:'Tachymeter bezels and screw-down crowns.' },
  { slug:'diamond-gold',      name:'Diamond & Gold',      icon:709376, blurb:'Set stones and solid cases, finished by hand.' },
  { slug:'haute-horlogerie',  name:'Haute Horlogerie',    icon:709403, blurb:'Six references. Months of finishing per piece.' }
];

const P=(id,name,cat,price,was,qty,cal)=>({id,name,cat,price,was,qty,cal});
const PRODUCTS = [
  P(325701,'Zenith Edge','mens-classic',3650,3950,64,'WT-210'),
  P(325708,'Terra Explorer','mens-classic',4100,4450,52,'WT-212'),
  P(325648,'Classic Chrono','mens-classic',4290,4890,120,'WT-118 C'),
  P(325707,'Metro Chronograph','mens-classic',5200,5650,38,'WT-118 C'),
  P(325703,'Horizon Pilot','mens-classic',5950,6450,27,'WT-240 P'),
  P(325705,'Summit Diver','mens-classic',6690,7290,44,'WT-300 D'),

  P(325704,'Radiant Quartz','womens-collection',4290,4690,88,'WQ-08'),
  P(325697,'Midnight Steel','womens-collection',5250,null,71,'WT-160'),
  P(325709,'Celestial Glow','womens-collection',5390,5890,33,'WT-162'),
  P(709375,'Molex T-Master Black','womens-collection',6200,null,25,'MX-44'),
  P(709386,'Molino Womens Pink Gold','womens-collection',6766.9,null,41,'ML-22'),
  P(325698,'Voyager Automatic','womens-collection',9690,null,20,'WT-165 A'),

  P(325710,'Infinity Steel','heritage-leather',4950,5350,58,'WT-180'),
  P(709381,'Molino BStar Original Automatic','heritage-leather',6198.9,null,36,'ML-31 A'),
  P(325706,'Noble Classic','heritage-leather',6200,6750,47,'WT-182'),
  P(325711,'Regal Automatic','heritage-leather',7550,8250,29,'WT-186 A'),
  P(325702,'Vintage Revival','heritage-leather',8250,null,24,'WT-188'),
  P(325700,'Urban Nomad','heritage-leather',9149,null,31,'WT-190'),
  P(325699,'Luxe Heritage','heritage-leather',18990,null,12,'WT-196 A'),

  P(709380,'Molino Unisex Stainless Steel EDS23','sport-chronograph',1888.9,null,308,'ML-10 Q'),
  P(709379,'Molino Mens R3011 Swiss Quartz','sport-chronograph',3448.9,null,142,'ML-12 Q'),
  P(709383,'Molino Verona Automatic','sport-chronograph',6228.9,null,66,'ML-30 A'),
  P(709385,'Molino Unisex Centrix','sport-chronograph',10198.9,null,34,'ML-34'),
  P(709377,'Molex BA2-Master Gold','sport-chronograph',10598.9,null,28,'MX-52 C'),

  P(709373,'Molex President Anniversary ES234','diamond-gold',6198.9,null,45,'MX-60'),
  P(709382,'Molino Gold Plated Stainless Steel','diamond-gold',7248.9,null,39,'ML-40'),
  P(709384,'Molion Golden Horse Swiss','diamond-gold',7788.9,null,26,'MN-14'),
  P(709374,'Molex Cosmograph RT254','diamond-gold',10198.9,null,22,'MX-64 C'),
  P(709376,'Molex SS-Master Black','diamond-gold',14600,null,18,'MX-70'),

  P(709378,'Molex BA7-Master Gold','haute-horlogerie',63778.9,null,9,'MX-80 T'),
  P(709402,'RegalTime Perpetual Classic','haute-horlogerie',81000,89500,6,'RT-QP'),
  P(709403,'PrestigeAero Skeleton','haute-horlogerie',97865.9,null,4,'PA-238 SK'),
  P(709405,'AvantGarde Lunar Horizon','haute-horlogerie',108844.99,null,3,'AG-LM'),
  P(709404,'Lumiere Grande Complication','haute-horlogerie',123198.9,null,2,'LM-GC'),
  P(709401,'EliteTime Chronos','haute-horlogerie',153888.9,null,2,'ET-1946 MR')
];

/* Demo copy. Replace with the real descriptions held in Selldone. */
const COPY = {
  'haute-horlogerie':'Bridges cut away until only the load paths remain, then chamfered by hand. Sapphire on both sides, so the going train stays visible from the wrist and from the desk.',
  'diamond-gold':'Stones set into a solid case by one setter, start to finish. Applied indices are cut and polished before they ever touch the dial.',
  'heritage-leather':'Straps cut from a single hide and stitched by hand, so the grain runs continuously across the buckle.',
  'sport-chronograph':'Built to be worn hard. Screw-down crown, tachymeter bezel, and a movement regulated for wrist motion rather than a resting drawer.',
  'mens-classic':'A round case and a printed dial, done properly. Nothing on it that does not tell you the time.',
  'womens-collection':'A smaller case that keeps the full movement. No compromise made for the diameter.'
};

const catOf   = s => CATS.find(c=>c.slug===s) || CATS[0];
const catName = s => catOf(s).name;
const money   = n => '$' + Number(n).toLocaleString('en-US',{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2});
const byId    = id => PRODUCTS.find(p=>p.id===Number(id));
const art = (id,alt,cls='') => IMG[id]
  ? `<img class="${cls}" src="${IMG[id]}" alt="${alt}" loading="lazy" width="500" height="500">`
  : `<div class="ph ${cls}" role="img" aria-label="${alt}"></div>`;

function cardHTML(p){
  return `<a class="pcard" href="product.html?id=${p.id}">
    <div class="pcard__art">${art(p.id,p.name)}</div>
    <p class="eyebrow" style="margin-bottom:6px">${catName(p.cat)}</p>
    <span class="pcard__name">${p.name}</span>
    <p class="price mb0">${money(p.price)}${p.was?`<s>${money(p.was)}</s>`:''}</p>
  </a>`;
}

/* ==========================================================================
   Boutique scenes. Engraved line illustrations standing in for photography —
   swap in real images of the salon when they exist.
   ========================================================================== */
const SCENES = {
facade:`<svg viewBox="0 0 760 620" role="img" aria-label="The Watchino shopfront at dusk">
<defs><radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
<stop offset="0" stop-color="#4468AE" stop-opacity=".34"/><stop offset="1" stop-color="#4468AE" stop-opacity="0"/>
</radialGradient></defs>
<circle class="glow" cx="640" cy="150" r="130"/>
<path class="fl-2" d="M90 150h470v390H90z"/>
<path class="ln" d="M70 540h620M90 540V150h470v390"/>
<path class="ln" d="M110 150V96h430v54"/>
<path class="ln-2" d="M120 123h410"/>
<text x="325" y="134" text-anchor="middle" fill="#C3C8CC" font-family="'Bodoni Moda',Didot,serif" font-size="26" letter-spacing="7">WATCHINO</text>
<path class="fl" d="M126 232h250v208H126z"/>
<path class="ln" d="M126 440V232a125 125 0 0 1 250 0v208z"/>
<path class="ln-2" d="M251 232v208M126 336h250M170 250a90 90 0 0 1 162 0"/>
<path class="ln" d="M126 440h250v100H126z"/>
<path class="ln-2" d="M150 470h60M150 486h40M266 470h60M266 486h40"/>
<circle class="ln-a" cx="180" cy="300" r="20"/><path class="ln-a" d="M180 290v11l7 5"/>
<circle class="ln-a" cx="251" cy="292" r="16"/><path class="ln-a" d="M251 284v9l6 4"/>
<circle class="ln-a" cx="322" cy="300" r="20"/><path class="ln-a" d="M322 290v11l8 3"/>
<path class="ln" d="M430 540V300h100v240M430 300h100"/>
<path class="ln-2" d="M480 300v240M446 330h20M446 362h20M494 330h20M494 362h20"/>
<circle class="ln-2" cx="516" cy="424" r="5"/>
<path class="ln" d="M400 190h180l-14 46H414z"/>
<path class="ln-2" d="M414 236 400 190M446 236l-8-46M482 236l-2-46M518 236l4-46M554 236l10-46"/>
<path class="ln" d="M640 540V214M614 214h52M628 214v-16a12 12 0 0 1 24 0v16"/>
<circle class="ln-2" cx="640" cy="176" r="15"/>
<path class="ln-2" d="M596 540h88M40 540h30M690 540h30" opacity=".6"/>
</svg>`,

vitrine:`<svg viewBox="0 0 620 470" role="img" aria-label="Watches on stands inside a lit display case">
<defs><linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#4468AE" stop-opacity=".24"/><stop offset="1" stop-color="#4468AE" stop-opacity="0"/>
</linearGradient></defs>
<path fill="url(#beam)" d="M158 64h34l40 210h-114z"/>
<path fill="url(#beam)" d="M308 64h34l40 210H268z"/>
<path fill="url(#beam)" d="M448 64h34l40 210H408z"/>
<path class="ln-2" d="M120 58h390M175 58v8M325 58v8M465 58v8"/>
<path class="fl" d="M70 280h490v90H70z"/>
<path class="ln" d="M70 370h490M70 280h490M70 280v90M560 280v90"/>
<path class="ln" d="M110 280V150h410v130"/>
<path class="ln-2" d="M110 150h410M315 150v130"/>
<g class="ln-a"><circle cx="175" cy="235" r="26"/><path d="M175 219v17l11 6"/></g>
<path class="ln" d="M167 209v-14h16v14M167 261v14h16v-14"/>
<g class="ln-a"><circle cx="255" cy="240" r="21"/><path d="M255 227v14l8 5"/></g>
<path class="ln" d="M249 219v-11h12v11M249 261v11h12v-11"/>
<g class="ln-a"><circle cx="380" cy="235" r="26"/><path d="M380 219v17l12 4"/></g>
<path class="ln" d="M372 209v-14h16v14M372 261v14h16v-14"/>
<g class="ln-a"><circle cx="462" cy="240" r="21"/><path d="M462 227v14l7 6"/></g>
<path class="ln" d="M456 219v-11h12v11M456 261v11h12v-11"/>
<path class="ln-2" d="M120 302h100M120 316h64M340 302h100M340 316h72"/>
<path class="ln-2" d="M96 370v40M534 370v40M96 410h438" opacity=".5"/>
</svg>`,

bench:`<svg viewBox="0 0 620 470" role="img" aria-label="A watchmaker's bench with a movement under a loupe">
<path class="fl" d="M40 300h540v130H40z"/>
<path class="ln" d="M40 300h540M40 300v130M580 300v130M40 430h540"/>
<circle class="fl-2" cx="248" cy="192" r="104"/>
<circle class="ln" cx="248" cy="192" r="104"/>
<circle class="ln-2" cx="248" cy="192" r="88"/>
<circle class="ln-a" cx="206" cy="162" r="34"/>
<path class="ln-2" d="M206 128v68M172 162h68M182 138l48 48M230 138l-48 48"/>
<circle class="ln-a" cx="290" cy="222" r="26"/>
<path class="ln-2" d="M290 196v52M264 222h52M272 204l36 36M308 204l-36 36"/>
<circle class="ln-a" cx="288" cy="148" r="16"/>
<circle class="ln-2" cx="212" cy="246" r="12"/>
<path class="ln" d="M144 192a104 104 0 0 1 34-77M318 258a104 104 0 0 1-40 30"/>
<circle class="ln" cx="440" cy="178" r="58"/>
<circle class="ln-2" cx="440" cy="178" r="48"/>
<path class="ln" d="M440 236v64M424 300h32"/>
<path class="ln-2" d="M414 158a34 34 0 0 1 40-12" opacity=".8"/>
<path class="ln" d="M96 348h96l-6 14H102z"/>
<path class="ln" d="M120 348v-52M168 348v-40"/>
<path class="ln" d="M330 356h150M330 356l-8 10h150l8-10"/>
<path class="ln-2" d="M360 356v-26M392 356v-18M424 356v-30"/>
<path class="ln" d="M498 340l56-16M498 340l4 8 56-16-4-8z"/>
<path class="ln-2" d="M60 388h180M60 402h120" opacity=".55"/>
</svg>`
};

/* ==========================================================================
   Live data. The demo ships with the catalog above so it always renders.
   If XAPI answers, real images and prices replace it.
   Verify this path against the Selldone storefront guideline before relying on it.
   ========================================================================== */
async function hydrate(){
  try{
    const r = await fetch(`${SHOP.xapi}/shops/@${SHOP.handle}/products?limit=50`,{mode:'cors'});
    if(!r.ok) return;
    const d = await r.json();
    const rows = d.products || d.data || [];
    if(!Array.isArray(rows) || !rows.length) return;
    let n=0;
    rows.forEach(row=>{
      const p = byId(row.id); if(!p) return;
      if(row.icon){ IMG[p.id] = String(row.icon).startsWith('http') ? row.icon : CDN + row.icon; n++; }
      if(typeof row.price === 'number') p.price = row.price - (row.discount || 0);
    });
    if(n) document.dispatchEvent(new Event('catalog:updated'));
  }catch(e){ /* offline or CORS blocked — the embedded catalog already rendered */ }
}

/* ---------- Header, drawers ---------- */
function initHeader(){
  const hdr=document.querySelector('.hdr');
  if(hdr){ const s=()=>hdr.classList.toggle('is-stuck',scrollY>120); s(); addEventListener('scroll',s,{passive:true}); }
  const scrim=document.querySelector('.scrim');
  const open=el=>{ if(!el) return; el.classList.add('is-open'); scrim?.classList.add('is-on'); document.body.style.overflow='hidden'; };
  const closeAll=()=>{ document.querySelectorAll('.drawer,.cart,.filters').forEach(e=>e.classList.remove('is-open'));
    scrim?.classList.remove('is-on'); document.body.style.overflow=''; };
  document.querySelector('[data-open="nav"]')?.addEventListener('click',()=>open(document.querySelector('.drawer')));
  document.querySelector('[data-open="cart"]')?.addEventListener('click',()=>open(document.querySelector('.cart')));
  document.querySelector('[data-open="filters"]')?.addEventListener('click',()=>open(document.querySelector('.filters')));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closeAll));
  scrim?.addEventListener('click',closeAll);
  addEventListener('keydown',e=>{ if(e.key==='Escape') closeAll(); });
}

function initRail(){
  const m=document.querySelector('.rail__marker'), t=document.querySelector('.rail__ticks');
  if(!m||!t) return;
  const move=()=>{ const max=document.body.scrollHeight-innerHeight;
    m.style.top=((max>0?Math.min(1,scrollY/max):0)*(t.clientHeight-2))+'px'; };
  move(); addEventListener('scroll',move,{passive:true}); addEventListener('resize',move);
}

function initReveal(){
  const els=document.querySelectorAll('.reveal');
  if(!els.length) return;
  if(!('IntersectionObserver' in window)){ els.forEach(e=>e.classList.add('is-in')); return; }
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); }
  }),{rootMargin:'0px 0px -8% 0px'});
  els.forEach(e=>io.observe(e));
}

function initAcc(root=document){
  root.querySelectorAll('.acc__hd').forEach(h=>{
    if(h.dataset.wired) return; h.dataset.wired='1';
    h.addEventListener('click',()=>{
      const a=h.closest('.acc'), open=a.classList.toggle('is-open');
      h.setAttribute('aria-expanded',open);
      h.querySelector('.acc__ico').textContent = open ? '\u2013' : '+';
    });
  });
}

/* ---------- Homepage ---------- */
function fillHome(){
  const mega=document.getElementById('megagrid');
  if(mega) mega.innerHTML = CATS.map(c=>{
    const n=PRODUCTS.filter(p=>p.cat===c.slug).length;
    return `<a class="mega__item" href="shop.html?cat=${c.slug}">${art(c.icon,c.name)}<b>${c.name}</b><span class="cap">${n} references</span></a>`;
  }).join('');

  const cat=document.getElementById('catgrid');
  if(cat) cat.innerHTML = CATS.map(c=>{
    const inCat=PRODUCTS.filter(p=>p.cat===c.slug);
    return `<a class="cat" href="shop.html?cat=${c.slug}">${art(c.icon,c.name)}
      <b>${c.name}</b><p class="cap mb0">${inCat.length} references &middot; from ${money(Math.min(...inCat.map(p=>p.price)))}</p></a>`;
  }).join('');

  const arr=document.getElementById('arrivals');
  if(arr) arr.innerHTML=[709403,709376,325699,709380,709386,325705].map(byId).filter(Boolean).map(cardHTML).join('');

  const sc=document.getElementById('scenes');
  if(sc) sc.innerHTML=
    `<figure class="scene scene--wide">${SCENES.facade}
      <figcaption class="scene__cap"><b>Bahnhofstrasse 41</b><span>The Z&uuml;rich salon, open since 1946</span></figcaption></figure>
     <figure class="scene">${SCENES.vitrine}
      <figcaption class="scene__cap"><b>The vitrine</b><span>Haute Horlogerie, viewing by appointment</span></figcaption></figure>
     <figure class="scene">${SCENES.bench}
      <figcaption class="scene__cap"><b>The bench</b><span>Every movement opened before it ships</span></figcaption></figure>`;
}

/* ---------- Shop ---------- */
function initShop(){
  const grid=document.getElementById('pgrid');
  if(!grid) return;
  const preset=new URLSearchParams(location.search).get('cat');
  const box=document.getElementById('catfilters');

  box.innerHTML=CATS.map(c=>{
    const n=PRODUCTS.filter(p=>p.cat===c.slug).length;
    return `<label class="check"><input type="checkbox" value="${c.slug}"${preset===c.slug?' checked':''}>${c.name}<span class="cap">${n}</span></label>`;
  }).join('');

  /* Logarithmic track: 29 of 35 references sit under $19k against a $153k
     ceiling, so a linear slider buries them in the first eighth. */
  const LO=1888.9, HI=153888.9, lg=Math.log10;
  const toVal=pos=>Math.round(Math.pow(10,lg(LO)+(pos/100)*(lg(HI)-lg(LO))));

  const lo=document.getElementById('plo'), hi=document.getElementById('phi'),
        out=document.getElementById('pout'), sort=document.getElementById('sort'),
        stock=document.getElementById('instock'), count=document.getElementById('count'),
        title=document.getElementById('listtitle'), intro=document.getElementById('listintro');

  function render(){
    const picked=[...box.querySelectorAll('input:checked')].map(i=>i.value);
    let a=toVal(+lo.value), b=toVal(+hi.value);
    if(a>b) [a,b]=[b,a];
    out.textContent=money(a)+' \u2014 '+money(b);

    let list=PRODUCTS.filter(p=>
      (!picked.length||picked.includes(p.cat)) && p.price>=a && p.price<=b && (!stock.checked||p.qty>0));

    if(sort.value==='low')  list.sort((x,y)=>x.price-y.price);
    if(sort.value==='high') list.sort((x,y)=>y.price-x.price);
    if(sort.value==='new')  list.sort((x,y)=>y.id-x.id);

    const one=picked.length===1?catOf(picked[0]):null;
    title.textContent = one ? one.name : 'All references';
    if(intro) intro.textContent = one ? one.blurb : 'Thirty-five references across six collections.';
    count.textContent = list.length + (list.length===1?' reference':' references');

    grid.className = list.length ? 'pgrid' : '';
    grid.innerHTML = list.length ? list.map(cardHTML).join('') :
      `<div class="empty"><p class="h3" style="margin-bottom:8px">Nothing in this range</p>
       <p class="cap" style="margin-bottom:24px">Widen the price band or clear a filter.</p>
       <div class="pgrid" style="text-align:left">${PRODUCTS.slice(0,3).map(cardHTML).join('')}</div></div>`;
  }

  [lo,hi,sort,stock].forEach(el=>el.addEventListener('input',render));
  box.addEventListener('change',render);
  document.getElementById('clear')?.addEventListener('click',()=>{
    box.querySelectorAll('input').forEach(i=>i.checked=false);
    lo.value=0; hi.value=100; stock.checked=false; sort.value='new'; render();
  });
  document.addEventListener('catalog:updated',render);
  render();
}

/* ---------- Product page: every reference, not just one ---------- */
function initPDP(){
  const root=document.getElementById('pdp');
  if(!root) return;

  const p=byId(new URLSearchParams(location.search).get('id') || 709403);
  if(!p){
    root.innerHTML=`<div class="notfound"><p class="h1" style="margin-bottom:14px">No such reference</p>
      <p class="lede" style="margin:0 auto 28px">That reference is not in the collection.</p>
      <a class="btn" href="shop.html">Browse all references</a></div>`;
    return;
  }

  document.title=`${p.name} \u2014 Watchino`;
  const c=catOf(p.cat);
  const others=PRODUCTS.filter(x=>x.cat===p.cat && x.id!==p.id);
  const gallery=[p.id, ...others.slice(0,2).map(x=>x.id)];

  root.innerHTML=`
  <p class="crumb"><a href="index.html">Home</a> &nbsp;/&nbsp; <a href="shop.html?cat=${c.slug}">${c.name}</a> &nbsp;/&nbsp; ${p.name}</p>
  <div class="pdp">
    <div class="gal">
      <div class="thumbs">${gallery.map((g,i)=>
        `<button class="thumb${i?'':' is-on'}" aria-label="View ${i+1}">${art(g,p.name+' view '+(i+1))}</button>`).join('')}</div>
      <div class="galmain" id="galmain">${art(p.id,p.name)}</div>
    </div>
    <div class="pinfo">
      <p class="eyebrow eyebrow--blued mb0">${c.name}</p>
      <h1 class="h1">${p.name}</h1>
      <p class="ref">REF. ${p.id} &middot; CALIBER ${p.cal}</p>
      <p class="price" style="font-size:24px;margin:22px 0 0">${money(p.price)}${p.was?`<s>${money(p.was)}</s>`:''}</p>
      <p class="cap" style="margin-top:6px">Duties and taxes calculated at checkout</p>
      <div class="pline"></div>
      <p class="eyebrow mb0" style="margin-bottom:14px">Case &amp; strap</p>
      <div class="swatches" role="radiogroup" aria-label="Case and strap finish">
        <button class="sw is-on" role="radio" aria-checked="true" data-name="Steel on black" style="background:#A9AFB5" aria-label="Steel on black"></button>
        <button class="sw" role="radio" aria-checked="false" data-name="Rose gold on cognac" style="background:#B08D6A" aria-label="Rose gold on cognac"></button>
        <button class="sw" role="radio" aria-checked="false" data-name="Violet and carmine"
          style="background:linear-gradient(135deg,#7B1FA2 50%,#D32F2F 50%)" aria-label="Violet and carmine"></button>
      </div>
      <p class="swname" id="swname">Steel on black</p>
      <p class="stock"><i class="dot"></i> ${p.qty} in stock &middot; ships within 3 working days</p>
      <div class="stack">
        <button class="btn btn--full">Add to bag</button>
        <a class="btn btn--line btn--full" href="#">Speak to a specialist</a>
      </div>
      <p class="cap" style="margin-top:14px">Demonstration storefront &mdash; no order is placed.</p>
      <div style="margin-top:32px">
        <div class="acc is-open">
          <button class="acc__hd" aria-expanded="true">Description <span class="acc__ico">\u2013</span></button>
          <div class="acc__bd"><p class="mt0 mb0">${COPY[p.cat]}</p></div>
        </div>
        <div class="acc">
          <button class="acc__hd" aria-expanded="false">Specifications <span class="acc__ico">+</span></button>
          <div class="acc__bd"><table class="spectable">
            <tr><th>Reference</th><td>${p.id}</td></tr>
            <tr><th>Caliber</th><td>${p.cal}</td></tr>
            <tr><th>Collection</th><td>${c.name}</td></tr>
            <tr><th>Availability</th><td>${p.qty} pieces</td></tr>
          </table></div>
        </div>
        <div class="acc">
          <button class="acc__hd" aria-expanded="false">Shipping &amp; returns <span class="acc__ico">+</span></button>
          <div class="acc__bd"><p class="mt0 mb0">Insured courier, signature required. Returns accepted within 30 days provided seals are intact.</p></div>
        </div>
        <div class="acc" style="border-bottom:1px solid var(--rule)">
          <button class="acc__hd" aria-expanded="false">Authentication <span class="acc__ico">+</span></button>
          <div class="acc__bd"><p class="mt0 mb0">Opened, timed on six positions, and certified by our workshop before dispatch.</p></div>
        </div>
      </div>
    </div>
  </div>`;

  const rt=document.getElementById('reltitle');
  if(rt) rt.textContent='Also in '+c.name;
  const rel=document.getElementById('related');
  if(rel) rel.innerHTML=others.slice(0,3).map(cardHTML).join('');

  root.querySelectorAll('.thumb').forEach(t=>t.addEventListener('click',()=>{
    root.querySelectorAll('.thumb').forEach(x=>x.classList.remove('is-on'));
    t.classList.add('is-on');
    const s=t.querySelector('img')?.src, m=document.querySelector('#galmain img');
    if(s&&m) m.src=s;
  }));

  root.querySelectorAll('.sw').forEach(s=>s.addEventListener('click',()=>{
    root.querySelectorAll('.sw').forEach(x=>{x.classList.remove('is-on');x.setAttribute('aria-checked','false');});
    s.classList.add('is-on'); s.setAttribute('aria-checked','true');
    document.getElementById('swname').textContent=s.dataset.name;
  }));

  initAcc(root);

  const bar=document.querySelector('.buybar');
  if(bar){
    bar.querySelector('.price').textContent=money(p.price);
    bar.querySelector('.cap').textContent=p.qty+' in stock';
    const gal=root.querySelector('.gal');
    if(gal) new IntersectionObserver(([e])=>bar.classList.toggle('is-on',!e.isIntersecting),{threshold:0}).observe(gal);
  }
}

/* ---------- Checkout ---------- */
function initCheckout(){
  const form=document.getElementById('coform');
  if(!form) return;
  form.querySelectorAll('input[required]').forEach(i=>{
    i.addEventListener('blur',()=>{               /* on blur, never while typing */
      i.closest('.fld').classList.toggle('has-err',
        !i.value.trim() || (i.type==='email' && !/^\S+@\S+\.\S+$/.test(i.value)));
    });
  });
  document.querySelector('.promo')?.addEventListener('click',function(){
    const f=document.getElementById('promofield'), on=f.hasAttribute('hidden');
    on ? f.removeAttribute('hidden') : f.setAttribute('hidden','');
    this.textContent = on ? 'Hide discount code' : 'Add a discount code';
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  initHeader(); initRail(); initReveal(); initAcc();
  fillHome(); initShop(); initPDP(); initCheckout();
  hydrate();
});
