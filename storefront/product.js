/* Watchino — product detail. Works for every reference via ?id=.
   Ported from design-reference initPDP(), with three corrections agreed with
   the client: real finishes only, real spec data instead of invented calibers,
   and a reviews block driven by real rating data. */

import {
  loadCatalog, loadProduct, money, byId, catOf,
  finishesOf, swatchStyle, swatchLabel, isComposite,
  CAT_BLURB, addToBag,
} from "./watchino-data.js";
import { cardHTML, esc, initAcc, openLightbox } from "./app.js";

/* Spec keys worth surfacing, in reading order. Only those the record actually
   holds are rendered; nothing is filled in. */
const SPEC_ORDER = [
  "Movement Type", "Movement", "Power Reserve", "Material", "Case Material",
  "Case diameter", "Dial Size", "Dial Color", "Water Resistance",
  "Strap Material", "Band Material", "Band Color", "Band width",
  "Bezel material", "Clasp", "Style", "Model number", "Item weight",
  "Special Features", "Design Style",
];

function specRows(spec) {
  if (!spec) return [];
  const rows = [];
  const seen = new Set();
  SPEC_ORDER.forEach((k) => {
    const v = spec[k];
    if (!v || v === "group" || seen.has(k)) return;
    seen.add(k);
    rows.push([k, Array.isArray(v) ? v.join(", ") : String(v)]);
  });
  Object.entries(spec).forEach(([k, v]) => {
    if (v === "group" || seen.has(k) || !v) return;
    seen.add(k);
    rows.push([k, Array.isArray(v) ? v.join(", ") : String(v)]);
  });
  return rows;
}

function ratingBlock(p) {
  /* rate_count is 0 across the whole catalogue. Say so rather than invent
     owners, stars or quotes. */
  if (!p.rateCount) {
    return `<div class="spot">
      <div>
        <p class="eyebrow eyebrow--onink">Owner reviews</p>
        <p class="display" style="font-size:64px;line-height:1">—</p>
        <p class="cap mb0">No ratings recorded yet</p>
      </div>
      <div class="rateempty">
        <p class="h3">This reference has not been rated</p>
        <p class="cap mb0" style="max-width:38ch">Ratings appear here once verified owners submit them through Selldone. Nothing has been published for REF. ${p.id}.</p>
      </div>
      <div>
        <p class="lede" style="margin-bottom:16px">Every movement is opened, timed on six positions and certified by the workshop before dispatch, whether or not anyone has written about it.</p>
        <p class="ref mb0">Watchino workshop</p>
      </div>
    </div>`;
  }
  const pct = Math.round((p.rate / 5) * 100);
  return `<div class="spot">
    <div>
      <p class="eyebrow eyebrow--onink">Owner reviews</p>
      <p class="display" style="font-size:64px;line-height:1">${p.rate.toFixed(1)}</p>
      <p class="cap mb0">Based on ${p.rateCount} ${p.rateCount === 1 ? "rating" : "ratings"}</p>
    </div>
    <div>
      <div class="ratebar" style="margin-bottom:10px">
        <span class="k" style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--mist)">Average</span>
        <span class="ratebar__track"><span class="ratebar__fill" style="width:${pct}%"></span></span>
        <span class="v">${p.rate.toFixed(1)}</span>
      </div>
      <p class="cap mb0">Aggregated by Selldone from verified purchases.</p>
    </div>
    <div>
      <p class="lede" style="margin-bottom:16px">Individual written reviews are not published for this reference.</p>
      <p class="ref mb0">REF. ${p.id}</p>
    </div>
  </div>`;
}

async function initPDP(cat) {
  const root = document.getElementById("pdp");
  if (!root) return;

  const id = new URLSearchParams(location.search).get("id");
  const p = byId(cat, id);

  if (!p) {
    root.innerHTML = `<div class="notfound">
      <p class="h1" style="margin-bottom:14px">No such reference</p>
      <p class="lede" style="margin:0 auto 28px">${id ? `REF. ${esc(id)} is not in the collection.` : "No reference was requested."}</p>
      <a class="btn" href="shop.html">Browse all references</a></div>`;
    document.title = "Reference not found — Watchino";
    return;
  }

  document.title = `${p.name} — Watchino`;
  const c = catOf(cat, p.cat);
  const others = cat.products.filter((x) => x.cat === p.cat && x.id !== p.id);

  /* Real gallery from products/{id}/info; falls back to the list icon. */
  let gallery = [{ src: p.image, alt: `${p.name}, main view`, w: 1000, h: 1000 }];
  try {
    const detail = await loadProduct(p.id);
    if (detail.gallery.length) gallery = detail.gallery;
  } catch (e) {
    console.warn("[watchino] gallery fallback to icon", e);
  }

  const finishes = finishesOf(p.raw);
  const showSwatches = finishes.length >= 2;
  const rows = specRows(p.spec);
  const railRef = document.querySelector("[data-rail-ref]");
  if (railRef) railRef.textContent = `REF ${p.id}`;

  root.innerHTML = `
  <p class="crumb"><a href="index.html">Home</a> &nbsp;/&nbsp; <a href="shop.html?cat=${c.slug}">${esc(c.name)}</a> &nbsp;/&nbsp; ${esc(p.name)}</p>
  <div class="pdp">
    <div class="gal">
      <div class="thumbs" role="group" aria-label="Gallery views"${gallery.length < 2 ? ' hidden' : ''}>
        ${gallery.map((g, i) => `
          <button class="thumb${i ? "" : " is-on"}" type="button" data-i="${i}" aria-label="View ${i + 1} of ${gallery.length}">
            <img src="${g.src}" alt="" width="120" height="120" loading="lazy">
          </button>`).join("")}
      </div>
      <button class="galmain" id="galmain" type="button" aria-label="Enlarge image">
        <img src="${gallery[0].src}" alt="${esc(gallery[0].alt)}" width="${gallery[0].w}" height="${gallery[0].h}" fetchpriority="high">
      </button>
    </div>

    <div class="pinfo">
      <p class="eyebrow eyebrow--blued mb0">${esc(c.name)}</p>
      <h1 class="h1">${esc(p.name)}</h1>
      <p class="ref">REF. ${p.id}${p.brand ? ` &middot; ${esc(p.brand.toUpperCase())}` : ""}</p>

      <p class="price" style="font-size:24px;margin:22px 0 0">${money(p.price)}${p.was ? `<s>${money(p.was)}</s>` : ""}</p>
      <p class="cap" style="margin-top:6px">Duties and taxes calculated at checkout</p>

      <div class="pline"></div>

      ${showSwatches ? `
      <p class="eyebrow mb0" style="margin-bottom:14px">Case &amp; strap</p>
      <div class="swatches" role="radiogroup" aria-label="Case and strap finish">
        ${finishes.map((col, i) => `
          <button class="sw${i ? "" : " is-on"}" type="button" role="radio"
                  aria-checked="${i ? "false" : "true"}"
                  data-i="${i}" data-hex="${esc(col)}"
                  style="${swatchStyle(col)}"
                  aria-label="Finish ${i + 1} of ${finishes.length}, ${esc(swatchLabel(col))}"></button>`).join("")}
      </div>
      <p class="swname mb0">Finish <span class="swhex" data-sw-hex>${esc(finishes[0])}</span></p>
      <p class="swpos" data-sw-pos>Finish 1 of ${finishes.length}</p>
      ` : `
      <p class="eyebrow mb0" style="margin-bottom:8px">Case &amp; strap</p>
      <p class="cap" style="margin-bottom:4px">A single finish is recorded for this reference.</p>
      `}

      <p class="stock"><i class="dot"></i> ${p.qty > 0 ? `${p.qty} in stock &middot; ships within 3 working days` : "Currently unavailable"}</p>

      <div class="stack">
        <button class="btn btn--full" type="button" data-add="${p.id}">Add to bag</button>
        <a class="btn btn--line btn--full" href="index.html#service">Speak to a specialist</a>
      </div>
      <p class="cap" style="margin-top:14px">Demonstration storefront &mdash; no order is placed.</p>

      <div style="margin-top:32px">
        <div class="acc is-open">
          <button class="acc__hd" type="button" aria-expanded="true">Description <span class="acc__ico">–</span></button>
          <div class="acc__bd">
            <p class="mt0">${esc(CAT_BLURB[p.cat] || "")}</p>
            <p class="cap mb0">Collection description. Selldone holds no per-reference description for this product.</p>
          </div>
        </div>
        <div class="acc">
          <button class="acc__hd" type="button" aria-expanded="false">Specifications <span class="acc__ico">+</span></button>
          <div class="acc__bd">
            ${rows.length ? `<table class="spectable"><tbody>
              ${rows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}
              <tr><th scope="row">Reference</th><td>${p.id}</td></tr>
            </tbody></table>` : `<p class="mt0 mb0">No specifications are recorded for REF. ${p.id}.</p>`}
          </div>
        </div>
        <div class="acc">
          <button class="acc__hd" type="button" aria-expanded="false">Shipping &amp; returns <span class="acc__ico">+</span></button>
          <div class="acc__bd"><p class="mt0 mb0">Insured courier, signature required. Returns accepted within 30 days provided seals are intact.</p></div>
        </div>
        <div class="acc" style="border-bottom:1px solid var(--rule)">
          <button class="acc__hd" type="button" aria-expanded="false">Authentication <span class="acc__ico">+</span></button>
          <div class="acc__bd"><p class="mt0 mb0">Opened, timed on six positions, and certified by our workshop before dispatch.</p></div>
        </div>
      </div>
    </div>
  </div>`;

  /* Reviews */
  const rev = document.getElementById("reviews");
  if (rev) rev.innerHTML = ratingBlock(p);

  /* Related */
  const rt = document.getElementById("reltitle");
  if (rt) rt.textContent = others.length ? `Also in ${c.name}` : "Elsewhere in the collection";
  const rel = document.getElementById("related");
  if (rel) rel.innerHTML = (others.length ? others : cat.products.filter((x) => x.id !== p.id))
    .slice(0, 3).map(cardHTML).join("");

  /* Gallery interaction */
  const main = document.querySelector("#galmain img");
  let current = 0;
  const show = (i) => {
    current = i;
    const g = gallery[i];
    main.src = g.src; main.alt = g.alt;
    root.querySelectorAll(".thumb").forEach((t, n) => t.classList.toggle("is-on", n === i));
  };
  root.querySelectorAll(".thumb").forEach((t) =>
    t.addEventListener("click", () => show(Number(t.dataset.i))));
  document.getElementById("galmain")?.addEventListener("click", () =>
    openLightbox(gallery[current].src, gallery[current].alt));

  /* Swatches — hex label plus a visible ordinal, so colour is never alone */
  root.querySelectorAll(".sw").forEach((s) =>
    s.addEventListener("click", () => {
      root.querySelectorAll(".sw").forEach((x) => { x.classList.remove("is-on"); x.setAttribute("aria-checked", "false"); });
      s.classList.add("is-on"); s.setAttribute("aria-checked", "true");
      const i = Number(s.dataset.i);
      const hexEl = root.querySelector("[data-sw-hex]");
      const posEl = root.querySelector("[data-sw-pos]");
      if (hexEl) hexEl.textContent = s.dataset.hex;
      if (posEl) posEl.textContent = `Finish ${i + 1} of ${finishes.length}`;
    }));

  initAcc(root);

  /* Add to bag */
  root.querySelector("[data-add]")?.addEventListener("click", (e) => {
    addToBag(Number(e.currentTarget.dataset.add), 1);
    document.querySelector('[data-open="cart"]')?.click();
  });

  /* Mobile sticky buy bar */
  const bar = document.querySelector(".buybar");
  if (bar) {
    bar.querySelector(".price").innerHTML = `${money(p.price)}${p.was ? `<s>${money(p.was)}</s>` : ""}`;
    bar.querySelector(".cap").textContent = p.qty > 0 ? `${p.qty} in stock` : "Unavailable";
    bar.querySelector("button").addEventListener("click", () => {
      addToBag(p.id, 1);
      document.querySelector('[data-open="cart"]')?.click();
    });
    const gal = root.querySelector(".gal");
    if (gal) {
      const sync = () => bar.classList.toggle("is-on", gal.getBoundingClientRect().bottom < 0);
      new IntersectionObserver(([en]) => bar.classList.toggle("is-on", !en.isIntersecting), { threshold: 0 }).observe(gal);
      /* Scroll fallback: the observer does not fire in environments where
         rendering updates are suspended, and the bar is the only way to buy
         on mobile. */
      addEventListener("scroll", sync, { passive: true });
      sync();
    }
  }
}

document.addEventListener("catalog:ready", async () => initPDP(await loadCatalog()));
