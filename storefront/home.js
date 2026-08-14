/* Watchino — homepage.
   Ported from design-reference/index.html + app.js fillHome().
   Every image resolves from live XAPI through the central Selldone helper;
   the prototype's hardcoded CDN URLs are gone (5 of its 6 were 404). */

import { loadCatalog, money, byId, catOf, loadReviews, HERO_IMAGE, HERO_HOTSPOTS } from "./watchino-data.js";
import { cardHTML, esc } from "./app.js";

/* ==========================================================================
   Boutique scenes. Engraved line illustrations standing in for photography —
   no salon photography exists, and none is invented.
   Ported verbatim from the approved prototype.
   ========================================================================== */
const SCENES = {
facade:`<svg viewBox="0 0 760 620" role="img" aria-label="The Watchino shopfront at dusk, drawn as an engraved line illustration">
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

vitrine:`<svg viewBox="0 0 620 470" role="img" aria-label="Watches on stands inside a lit display case, drawn as an engraved line illustration">
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

bench:`<svg viewBox="0 0 620 470" role="img" aria-label="A watchmaker's bench with a movement under a loupe, drawn as an engraved line illustration">
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

/* Pull a handful of real spec rows for the spotlight. The prototype invented
   "612 components / 67 jewels / Platinum 950"; Selldone holds real values. */
const SPOT_KEYS = ["Movement Type", "Power Reserve", "Water Resistance", "Dial Size", "Case Material"];
function specRows(p, keys = SPOT_KEYS) {
  if (!p || !p.spec) return [];
  return keys
    .map((k) => {
      const v = p.spec[k];
      if (!v || v === "group") return null;
      return { k, v: Array.isArray(v) ? v.join(", ") : String(v) };
    })
    .filter(Boolean);
}

const range = (list) => ({
  lo: Math.min(...list.map((p) => p.price)),
  hi: Math.max(...list.map((p) => p.price)),
  n: list.length,
});

function fillHome(cat) {
  const setImg = (sel, p, alt) => {
    const el = document.querySelector(sel);
    if (el && p) { el.src = p.image; el.alt = alt || p.name; }
  };

  /* ---- Hero ---------------------------------------------------------- */
  const heroImg = document.querySelector("[data-hero-img]");
  if (heroImg) {
    heroImg.src = HERO_IMAGE;
    heroImg.alt = "A couple in evening dress, each wearing a rose gold watch with a purple dial";
  }
  const heroLink = document.querySelector("[data-hero-link]");
  const heroRef = byId(cat, 709403);
  if (heroLink && heroRef) heroLink.href = `product.html?id=${heroRef.id}`;
  fillHotspots(cat);

  // Counts come from the catalogue so they cannot drift when it grows.
  document.querySelectorAll("[data-all-refs]").forEach((a) => {
    a.textContent = `All ${cat.products.length} references →`;
  });

  /* ---- Six collections — the heart of the page ---- */
  const grid = document.getElementById("catgrid");
  if (grid) grid.innerHTML = cat.cats.map((c) => `
    <a class="cat" href="shop.html?cat=${c.slug}">
      <img src="${c.image}" alt="${esc(c.name)} — ${esc(c.heroName)}" loading="lazy" width="400" height="400">
      <b>${esc(c.name)}</b>
      <p class="cap mb0">${c.count} references &middot; from ${money(c.from)}</p>
    </a>`).join("");

  /* ---- Three price registers, computed live so they cannot drift ---- */
  const collections = cat.products.filter((p) =>
    ["mens-classic", "womens-collection", "heritage-leather", "sport-chronograph"].includes(p.cat));
  const signature = cat.products.filter((p) => p.cat === "diamond-gold");
  const haute = cat.products.filter((p) => p.cat === "haute-horlogerie");

  const tiers = [
    { sel: "[data-tier-1]", list: collections, hero: byId(cat, 709380) },
    { sel: "[data-tier-2]", list: signature,   hero: byId(cat, 709373) },
    { sel: "[data-tier-3]", list: haute,       hero: byId(cat, 709403) },
  ];
  tiers.forEach(({ sel, list, hero }) => {
    const root = document.querySelector(sel);
    if (!root || !list.length) return;
    const r = range(list);
    const img = root.querySelector("img");
    if (img && hero) { img.src = hero.image; img.alt = hero.name; }
    const out = root.querySelector("[data-tier-range]");
    if (out) out.textContent = `${money(r.lo)} — ${money(r.hi)} · ${r.n} references`;
  });

  /* ---- Single-reference spotlight ---- */
  const spot = byId(cat, 709401);
  if (spot) {
    setImg("[data-spot-img]", spot, `${spot.name}, front view`);
    const nm = document.querySelector("[data-spot-name]"); if (nm) nm.textContent = spot.name;
    const pr = document.querySelector("[data-spot-price]");
    if (pr) pr.innerHTML = `${money(spot.price)}${spot.was ? `<s>${money(spot.was)}</s>` : ""}`;
    const lk = document.querySelector("[data-spot-link]"); if (lk) lk.href = `product.html?id=${spot.id}`;
    const ul = document.querySelector("[data-spot-specs]");
    if (ul) {
      const rows = specRows(spot);
      ul.innerHTML = rows.length
        ? rows.map((r) => `<li><span class="k">${esc(r.k)}</span><span class="v">${esc(r.v)}</span></li>`).join("")
        : `<li><span class="k">Reference</span><span class="v">${spot.id}</span></li>`;
    }
    const rf = document.querySelector("[data-spot-ref]");
    if (rf) rf.textContent = `REF. ${spot.id}`;
  }

  /* ---- New arrivals: live, newest first ---- */
  const arr = document.getElementById("arrivals");
  if (arr) {
    const newest = [...cat.products].sort((a, b) => {
      const d = String(b.raw.created_at || "").localeCompare(String(a.raw.created_at || ""));
      return d !== 0 ? d : b.id - a.id;
    }).slice(0, 8);
    arr.innerHTML = newest.map(cardHTML).join("");
  }

  /* ---- The salon ---- */
  const sc = document.getElementById("scenes");
  if (sc) sc.innerHTML =
    `<figure class="scene scene--wide">${SCENES.facade}
       <figcaption class="scene__cap"><b>Bahnhofstrasse 41</b><span>The Z&uuml;rich salon, open since 1946</span></figcaption></figure>
     <figure class="scene">${SCENES.vitrine}
       <figcaption class="scene__cap"><b>The vitrine</b><span>Haute Horlogerie, viewing by appointment</span></figcaption></figure>
     <figure class="scene">${SCENES.bench}
       <figcaption class="scene__cap"><b>The bench</b><span>Every movement opened before it ships</span></figcaption></figure>`;

  /* ---- Client care editorial ---- */
  setImg("[data-service-img]", byId(cat, 709384), "Leather-strap wristwatch on the workbench");
}

/* ---------- Hero markers ----------
   A 44px button whose only visible part is an 8px dot, sitting 2.2% clear of a
   dial that is 1.1% wide — so the control never covers the product it sells.
   A hairline tether runs from the dot back to the dial it refers to.

   The card opens on CLICK and floats over the photograph. That is why the empty
   space this frame lacks does not matter: a card summoned deliberately may sit
   over the couple, where a hover label appearing under the cursor may not.

   The two references also appear as ordinary cards below the photograph. That is
   the whole interaction on touch, and the fallback everywhere else. */
function fillHotspots(cat) {
  const layer = document.querySelector("[data-hero-spots]");
  const mob = document.querySelector("[data-hero-mob]");
  const mobList = document.querySelector("[data-hero-mob-list]");
  if (!layer) return;

  const found = HERO_HOTSPOTS
    .map((h) => ({ ...h, p: byId(cat, h.id) }))
    .filter((h) => h.p);            // a delisted reference simply drops out

  if (!found.length) { layer.hidden = true; if (mob) mob.hidden = true; return; }

  layer.hidden = false;
  layer.removeAttribute("aria-hidden");
  layer.innerHTML = found.map((h, i) => `
    <span class="hero__tether" data-tether="${i}" aria-hidden="true"></span>
    <div class="hero__spot" data-spot="${i}">
      <button class="hero__pin" type="button" aria-expanded="false"
              aria-label="${esc(h.p.name)}, ${money(h.p.price)} — show details">
        <span class="hero__dot" aria-hidden="true"></span>
      </button>
      <span class="hero__card hero__card--${h.side}" role="group" aria-label="${esc(h.p.name)}">
        <a class="hero__card__in" href="product.html?id=${h.p.id}">
          <span class="hero__card__art"><img src="${h.p.image}" alt="" width="120" height="120"></span>
          <span class="hero__card__txt">
            <span class="hero__card__cat">${esc(h.p.catName)}</span>
            <span class="hero__card__name">${esc(h.p.name)}</span>
            <span class="price">${money(h.p.price)}</span>
            <span class="hero__card__cta">View reference →</span>
          </span>
        </a>
      </span>
    </div>`).join("");

  /* Coordinates are percentages of the PHOTOGRAPH; the overlay is the size of
     the element box, and object-fit:cover crops the two apart. Project rather
     than position by percentage — that error put a marker 68px off a wrist. */
  const img = document.querySelector("[data-hero-img]");
  const spots = [...layer.querySelectorAll(".hero__spot")];
  const tethers = [...layer.querySelectorAll(".hero__tether")];
  const place = () => {
    if (!img.naturalWidth) return;
    const r = img.getBoundingClientRect();
    if (!r.width) return;
    const cs = getComputedStyle(img);
    const [ox, oy = "50%"] = cs.objectPosition.split(" ");
    const pc = (v, px) => (v.endsWith("%") ? parseFloat(v) : (parseFloat(v) / px) * 100);
    const scale = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
    const dW = img.naturalWidth * scale, dH = img.naturalHeight * scale;
    const offX = (r.width - dW) * (pc(ox, r.width) / 100);
    const offY = (r.height - dH) * (pc(oy, r.height) / 100);
    const at = (pt) => ({ x: offX + (pt.x / 100) * dW, y: offY + (pt.y / 100) * dH });

    found.forEach((h, i) => {
      const m = at(h.marker), d = at(h.dial);
      const inside = m.x > 22 && m.x < r.width - 22 && m.y > 22 && m.y < r.height - 22;
      spots[i].style.left = `${m.x}px`;
      spots[i].style.top = `${m.y}px`;
      spots[i].hidden = !inside;
      // hairline from the dot back to the dial it points at
      const dx = d.x - m.x, dy = d.y - m.y;
      tethers[i].style.left = `${m.x}px`;
      tethers[i].style.top = `${m.y}px`;
      tethers[i].style.width = `${Math.hypot(dx, dy)}px`;
      tethers[i].style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
      tethers[i].hidden = !inside;
    });
  };
  if (img.complete && img.naturalWidth) place();
  img.addEventListener("load", place);
  addEventListener("resize", place);

  /* Click to open, click again or Escape or click-away to close. Only one card
     at a time, so two cards can never overlap each other. */
  const closeAll = (except) => spots.forEach((s) => {
    if (s === except) return;
    s.classList.remove("is-on");
    s.querySelector(".hero__pin").setAttribute("aria-expanded", "false");
  });
  spots.forEach((spot) => {
    const btn = spot.querySelector(".hero__pin");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = !spot.classList.contains("is-on");
      closeAll(spot);
      spot.classList.toggle("is-on", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });
  addEventListener("click", () => closeAll(null));
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(null); });

  if (mob && mobList) {
    mobList.innerHTML = found.map((h) => cardHTML(h.p)).join("");
    mob.hidden = false;
  }
}

/* ---------- Reviews ----------
   Every figure here is computed by summariseReviews() from the review list.
   Nothing is typed in: change the six entries and the average, the bars and the
   counts all follow. The label renders whenever the source is sample data. */
function fillReviews(cat) {
  const listEl = document.querySelector("[data-review-list]");
  const sumEl = document.querySelector("[data-review-summary]");
  const noteEl = document.querySelector("[data-review-note]");
  if (!listEl) return;

  const { reviews, average, total, counts, sample } = loadReviews(cat.products);

  if (!total) {
    listEl.innerHTML = `<p class="cap">No reviews yet.</p>`;
    return;
  }

  if (sample && noteEl) {
    noteEl.hidden = false;
    noteEl.textContent = "Sample reviews, shown to demonstrate the layout. Not from real customers.";
  }

  sumEl.innerHTML = `
    <div class="revsum__score">
      <p class="revsum__avg">${average.toFixed(1)}<span>/5</span></p>
      <p class="cap mb0">${stars(average)} · ${total} reviews</p>
    </div>
    <div class="revbars">
      ${counts.map((c) => `
        <div class="revbar">
          <span class="revbar__n">${c.star}</span>
          <span class="revbar__track"><span class="revbar__fill" style="width:${c.pct.toFixed(1)}%"></span></span>
          <span class="revbar__c">${c.count}</span>
        </div>`).join("")}
    </div>`;

  listEl.innerHTML = reviews.map((r) => `
    <figure class="rev">
      <p class="rev__stars" aria-label="${r.rating} out of 5">${stars(r.rating)}</p>
      <blockquote>${esc(r.body)}</blockquote>
      <figcaption class="cap">${esc(r.name)}${r.city ? " · " + esc(r.city) : ""}</figcaption>
    </figure>`).join("");
}

/* Filled and empty stars, with the numeric value carried in an aria-label at
   the call site — the glyphs are decoration, never the only indicator. */
function stars(n) {
  const full = Math.round(n);
  return `<span class="stars" aria-hidden="true">${"★".repeat(full)}${"☆".repeat(5 - full)}</span>`;
}

document.addEventListener("catalog:ready", async () => {
  const cat = await loadCatalog();
  fillHome(cat);
  fillReviews(cat);
});
