/* Storefront homepage.
   Ported from design-reference/index.html + app.js fillHome().
   Every image resolves from live XAPI through the central Selldone helper;
   the prototype's hardcoded CDN URLs are gone (5 of its 6 were 404). */

import { loadCatalog, money, byId, catOf, loadReviews, heroOf } from "./shop-data.js";
import { isUnconfigured } from "./shop-config.js";
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

  /* ---- Hero ----------------------------------------------------------
     Three modes, all driven by shop.config.json. `photo` is a lifestyle
     photograph with measured hotspots and cannot be generated for another
     shop; `slides` and `plate` are the portable ones. */
  const hero = heroOf(cat.cfg);
  const heroImg = document.querySelector("[data-hero-img]");
  const heroRef = hero.linkProductId ? byId(cat, hero.linkProductId) : null;
  const fallback = heroRef || highestPriced(cat.products);

  if (heroImg) {
    if (hero.mode === "photo" && hero.image) {
      heroImg.src = hero.image;
      heroImg.alt = cat.cfg?.hero?.alt || "";
    } else if (fallback) {
      // Product plate. Contained, never cropped — the photography is shot on
      // white and cropping it removes the object.
      heroImg.src = fallback.image;
      heroImg.alt = fallback.name;
      heroImg.classList.add("hero__plate");
    }
  }
  const heroLink = document.querySelector("[data-hero-link]");
  if (heroLink && fallback) heroLink.href = `product.html?id=${fallback.id}`;
  fillHeroCopy(hero, fallback);
  fillHotspots(cat, hero);

  // Counts come from the catalogue so they cannot drift when it grows.
  document.querySelectorAll("[data-all-refs]").forEach((a) => {
    a.textContent = `All ${cat.products.length} references →`;
  });

  /* ---- Collections — the heart of the page ----
     Any number from 3 to 10. The column count follows from how many there
     are, so the grid never leaves an orphan tile on its own row. Below three
     `cat.cats` is empty and the whole section is dropped rather than showing
     a lonely tile. */
  const grid = document.getElementById("catgrid");
  const gridSection = grid?.closest("section");
  if (gridSection) gridSection.hidden = cat.cats.length === 0;
  if (grid) grid.dataset.n = String(cat.cats.length);
  if (grid) grid.innerHTML = cat.cats.map((c) => `
    <a class="cat" href="shop.html?cat=${c.slug}">
      <img src="${c.image}" alt="${esc(c.name)} — ${esc(c.heroName)}" loading="lazy" width="400" height="400">
      <b>${esc(c.name)}</b>
      ${c.blurb ? `<p class="cap" style="margin-bottom:4px">${esc(c.blurb)}</p>` : ""}
      <p class="cap mb0">${c.count} references &middot; from ${money(c.from)}</p>
    </a>`).join("");

  /* ---- Three price registers ----
     Terciles over the live catalogue, not named collections. The old version
     listed this shop's own slugs, which meant every other shop got three empty
     registers. Bands come from the data, so any catalogue produces three. */
  const sorted = [...cat.products].sort((a, b) => a.price - b.price);
  const third = Math.ceil(sorted.length / 3) || 1;
  const bands = [sorted.slice(0, third), sorted.slice(third, third * 2), sorted.slice(third * 2)];
  const tiers = [
    { sel: "[data-tier-1]", list: bands[0] },
    { sel: "[data-tier-2]", list: bands[1] },
    { sel: "[data-tier-3]", list: bands[2] },
  ].map((t) => ({ ...t, hero: highestPriced(t.list) }));
  tiers.forEach(({ sel, list, hero }) => {
    const root = document.querySelector(sel);
    if (!root || !list.length) return;
    const r = range(list);
    const img = root.querySelector("img");
    if (img && hero) { img.src = hero.image; img.alt = hero.name; }
    const out = root.querySelector("[data-tier-range]");
    if (out) out.textContent = `${money(r.lo)} — ${money(r.hi)} · ${r.n} references`;
  });

  /* ---- Single-reference spotlight ----
     Resolved at runtime from the config's mode. No stored product id: the
     highest-priced reference is whatever the shop currently sells. */
  const spot = resolveSpotlight(cat);
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
  // A mid-priced reference stands in for the workbench photograph.
  setImg("[data-service-img]", cat.products[Math.floor(cat.products.length / 2)], "");
}

/* ---------- Hero markers ----------
   Ported from the approved mockup. Behaviour is the mockup's; the tokens and
   markup conventions are this codebase's.

   Dots sit on the bracelet below each case so they never cover the product.
   Click opens a card anchored to the dot and floating over the photograph; one
   at a time; click-outside and Escape close and return focus to the dot. The
   card measures its own height and flips below the dot when there is no room
   above, instead of leaving the frame. */
const highestPriced = (list) =>
  list && list.length ? list.reduce((a, b) => (b.price > a.price ? b : a)) : null;

function resolveSpotlight(cat) {
  const mode = cat.cfg?.spotlight?.mode || "highest-price";
  if (mode === "product" && cat.cfg?.spotlight?.productId) {
    return byId(cat, cat.cfg.spotlight.productId) || highestPriced(cat.products);
  }
  return highestPriced(cat.products);
}

/* Hero copy comes from the config where a slide supplies it, and is simply
   omitted where it does not. A placeholder headline is worse than a shorter
   hero: it reads as finished copy that nobody wrote. */
function fillHeroCopy(hero, product) {
  const slide = (hero.slides && hero.slides[0]) || null;
  const set = (sel, text) => {
    const el = document.querySelector(sel);
    if (!el) return;
    if (text) { el.textContent = text; el.hidden = false; }
    else el.hidden = true;
  };
  if (!slide) return;                       // photo mode keeps the authored copy
  set("[data-hero-kicker]", slide.kicker);
  set("[data-hero-title]", slide.title);
  set("[data-hero-lede]", slide.lede);
}

function fillHotspots(cat, hero) {
  const layer = document.querySelector("[data-hero-spots]");
  const mob = document.querySelector("[data-hero-mob]");
  const mobList = document.querySelector("[data-hero-mob-list]");
  const img = document.querySelector("[data-hero-img]");
  if (!layer || !img) return;

  const found = (hero?.hotspots || [])
    .map((h) => ({ ...h, p: byId(cat, h.id) }))
    .filter((h) => h.p);            // a delisted reference simply drops out

  if (!found.length) { layer.hidden = true; if (mob) mob.hidden = true; return; }

  layer.hidden = false;
  layer.innerHTML = found.map((h, i) => `
    <button class="hspot" type="button" data-spot="${i}" aria-expanded="false"
            aria-label="${esc(h.p.name)}, ${money(h.p.price)}. Open details.">
      <i aria-hidden="true"></i>
    </button>
    <div class="hcard" data-card="${i}" role="dialog" aria-label="${esc(h.p.name)}">
      <button class="hcard__x" type="button" aria-label="Close">&times;</button>
      <div class="hcard__row">
        <img src="${h.p.image}" alt="" width="152" height="152">
        <div>
          <p class="hcard__k">${esc(h.p.catName)}</p>
          <b>${esc(h.p.name)}</b>
          <span class="price">${money(h.p.price)}</span>
        </div>
      </div>
      <a class="hcard__go" href="product.html?id=${h.p.id}">View the reference →</a>
    </div>`).join("");

  const spots = [...layer.querySelectorAll(".hspot")];
  const cards = [...layer.querySelectorAll(".hcard")];

  /* Image space -> box space. object-fit:cover crops, so a percentage of the
     FILE is not a percentage of the BOX. Taken from the mockup rather than
     re-derived: this is the maths both the code and its check got wrong. */
  const project = (xPct, yPct) => {
    const box = img.getBoundingClientRect();
    const nat = hero.natural;
    const scale = Math.max(box.width / nat.w, box.height / nat.h);
    const dw = nat.w * scale, dh = nat.h * scale;
    const op = getComputedStyle(img).objectPosition.split(" ");
    const ox = parseFloat(op[0]) / 100, oy = parseFloat(op[1] ?? "50%") / 100;
    return {
      x: (box.width - dw) * ox + dw * xPct / 100,
      y: (box.height - dh) * oy + dh * yPct / 100,
      box,
    };
  };

  const CARD_W = 300, GAP = 26;
  const place = () => {
    if (!img.naturalWidth) return;
    found.forEach((h, i) => {
      const pt = project(h.dot.x, h.dot.y);
      if (!pt.box.width) return;
      spots[i].style.left = `${pt.x}px`;
      spots[i].style.top = `${pt.y}px`;
      const onScreen = pt.x > 16 && pt.x < pt.box.width - 16 && pt.y > 16 && pt.y < pt.box.height - 16;
      spots[i].hidden = !onScreen;

      // keep the card inside the frame, and point its arrow back at the dot
      let cx = pt.x - 34;
      if (cx + CARD_W > pt.box.width - 16) cx = pt.box.width - CARD_W - 16;
      if (cx < 16) cx = 16;
      cards[i].style.left = `${cx}px`;
      cards[i].style.setProperty("--ax", `${pt.x - cx - 5}px`);

      // above by default; below only when there is no room above
      const cardH = cards[i].offsetHeight || 148;
      if (pt.y - GAP - cardH > 12) {
        cards[i].dataset.side = "above";
        cards[i].style.top = "";
        cards[i].style.bottom = `${pt.box.height - pt.y + GAP}px`;
      } else {
        cards[i].dataset.side = "below";
        cards[i].style.bottom = "";
        cards[i].style.top = `${pt.y + GAP}px`;
      }
    });
  };

  const close = (i, refocus) => {
    cards[i].classList.remove("is-in");
    spots[i].setAttribute("aria-expanded", "false");
    setTimeout(() => cards[i].classList.remove("is-on"), 220);
    if (refocus) spots[i].focus();
  };
  const open = (i) => {
    found.forEach((_, j) => { if (j !== i) close(j); });
    cards[i].classList.add("is-on");
    place();                       // now it has a height, so it can be placed properly
    requestAnimationFrame(() => cards[i].classList.add("is-in"));
    spots[i].setAttribute("aria-expanded", "true");
  };
  spots.forEach((btn, i) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      btn.getAttribute("aria-expanded") === "true" ? close(i, true) : open(i);
    });
    /* Focus must reveal what hover reveals, or the feature is invisible to a
       keyboard. But a mouse click focuses the button before it fires click — so
       an unconditional focus handler opened the card and the click then toggled
       it straight back shut. :focus-visible is true for keyboard focus and
       false for pointer focus, which separates the two cleanly. */
    btn.addEventListener("focus", () => {
      if (btn.matches(":focus-visible")) open(i);
    });
    cards[i].addEventListener("click", (e) => e.stopPropagation());
    cards[i].querySelector(".hcard__x").addEventListener("click", () => close(i, true));
  });
  addEventListener("click", () => found.forEach((_, i) => close(i)));
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    found.forEach((_, i) => {
      if (spots[i].getAttribute("aria-expanded") === "true") close(i, true);
    });
  });

  if (img.complete && img.naturalWidth) place();
  img.addEventListener("load", place);
  addEventListener("resize", place);

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
