/* Watchino — storefront UI.
   Ported from design-reference/app.js. Behaviour is the prototype's; the data
   behind it is live Selldone. A capability demonstration: no order is placed. */

import {
  loadCatalog, money, img, catOf, byId,
  swatchStyle, swatchLabel, isComposite,
  readBag, addToBag, removeFromBag, bagCount, bagLines, bagSubtotal,
  subscribe,
} from "./watchino-data.js";
import { storefrontAuth } from "../shared/auth-client.js";

let CAT = null;

/* ---------- Shared card ---------- */
export function cardHTML(p) {
  return `<a class="pcard" href="product.html?id=${p.id}">
    <div class="pcard__art">
      <img src="${p.image}" alt="${esc(p.name)}" loading="lazy" width="500" height="500">
    </div>
    <p class="eyebrow" style="margin-bottom:6px">${esc(p.catName)}</p>
    <span class="pcard__name">${esc(p.name)}</span>
    <p class="price mb0">${money(p.price)}</p>
  </a>`;
}

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Header, rail, drawers ---------- */
function initHeader() {
  const hdr = document.querySelector(".hdr");
  if (hdr) {
    const s = () => hdr.classList.toggle("is-stuck", scrollY > 120);
    s();
    addEventListener("scroll", s, { passive: true });
  }

  const scrim = document.querySelector(".scrim");
  let lastFocus = null;

  const open = (el) => {
    if (!el) return;
    lastFocus = document.activeElement;
    el.classList.add("is-open");
    scrim?.classList.add("is-on");
    document.documentElement.classList.add("is-locked");
    el.setAttribute("aria-hidden", "false");
    // The first focusable in a panel is its Close button. Where the panel has a
    // field that is the point of opening it, send focus there instead.
    (el.querySelector("[data-autofocus]") || focusables(el)[0])?.focus();
  };
  const closeAll = () => {
    let had = false;
    document.querySelectorAll(".drawer,.cart,.filters,.sheet").forEach((e) => {
      if (e.classList.contains("is-open")) had = true;
      e.classList.remove("is-open");
      if (!e.classList.contains("filters")) e.setAttribute("aria-hidden", "true");
    });
    scrim?.classList.remove("is-on");
    if (!document.querySelector(".lbox.is-open")) document.documentElement.classList.remove("is-locked");
    if (had && lastFocus) { lastFocus.focus(); lastFocus = null; }
  };

  document.querySelector('[data-open="nav"]')?.addEventListener("click", () => open(document.querySelector(".drawer")));
  document.querySelector('[data-open="cart"]')?.addEventListener("click", () => open(document.querySelector(".cart")));
  document.querySelector('[data-open="filters"]')?.addEventListener("click", () => open(document.querySelector(".filters")));
  document.querySelector('[data-open="search"]')?.addEventListener("click", () => open(document.querySelector(".sheet--search")));
  document.querySelector('[data-open="account"]')?.addEventListener("click", () => {
    open(document.querySelector(".sheet--account"));
    renderAccount();   // refetches, so a session that expired while the tab sat open shows as signed out
  });
  document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeAll));
  scrim?.addEventListener("click", closeAll);

  addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeAll(); closeLightbox(); return; }
    if (e.key !== "Tab") return;
    const panel = document.querySelector(".drawer.is-open,.cart.is-open,.lbox.is-open,.sheet.is-open");
    if (!panel) return;
    trapTab(e, panel);
  });

  /* Dev affordance: ?open=nav|cart opens a drawer directly so a panel state can
     be captured without a click. */
  const want = new URLSearchParams(location.search).get("open");
  if (want === "nav") open(document.querySelector(".drawer"));
  if (want === "cart") open(document.querySelector(".cart"));
}

const focusables = (root) =>
  [...root.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')]
    .filter((el) => el.offsetParent !== null || el === document.activeElement);

function trapTab(e, panel) {
  const f = focusables(panel);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function initRail() {
  const m = document.querySelector(".rail__marker"), t = document.querySelector(".rail__ticks");
  if (!m || !t) return;
  const move = () => {
    const max = document.body.scrollHeight - innerHeight;
    m.style.top = ((max > 0 ? Math.min(1, scrollY / max) : 0) * (t.clientHeight - 2)) + "px";
  };
  move();
  addEventListener("scroll", move, { passive: true });
  addEventListener("resize", move);
}

function initReveal() {
  const els = [...document.querySelectorAll(".reveal")];
  if (!els.length) return;
  // No observer support: leave everything visible, skip the animation entirely.
  if (!("IntersectionObserver" in window)) return;

  // Arm the animation. Everything above was rendered opaque, so reaching this
  // line is what opts the page into hiding-then-revealing.
  document.documentElement.classList.add("js-reveal");
  // Same synchronous task: anything already on screen is marked revealed before
  // the browser paints, so nothing that was visible flashes out.
  els.forEach((e) => {
    if (e.getBoundingClientRect().top < innerHeight) e.classList.add("is-in");
  });

  const io = new IntersectionObserver(
    (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
    { rootMargin: "0px 0px -8% 0px" }
  );
  els.forEach((e) => io.observe(e));
}

export function initAcc(root = document) {
  root.querySelectorAll(".acc__hd").forEach((h) => {
    if (h.dataset.wired) return;
    h.dataset.wired = "1";
    h.addEventListener("click", () => {
      const a = h.closest(".acc"), open = a.classList.toggle("is-open");
      h.setAttribute("aria-expanded", String(open));
      h.querySelector(".acc__ico").textContent = open ? "–" : "+";
    });
  });
}

/* ---------- Mega menu + footer collections ---------- */
function fillNav() {
  const mega = document.getElementById("megagrid");
  if (mega) {
    mega.innerHTML = CAT.cats.map((c) => `
      <a class="mega__item" href="shop.html?cat=${c.slug}">
        <img src="${c.image}" alt="${esc(c.name)} — ${esc(c.heroName)}" loading="lazy" width="200" height="200">
        <b>${esc(c.name)}</b>
        <span class="cap">${c.count} references</span>
      </a>`).join("");
  }

  document.querySelectorAll("[data-collections]").forEach((ul) => {
    ul.innerHTML = CAT.cats.map((c) =>
      `<li><a href="shop.html?cat=${c.slug}">${esc(c.name)}</a></li>`).join("");
  });

  document.querySelectorAll("[data-drawer-nav]").forEach((nav) => {
    nav.innerHTML =
      `<a href="shop.html">All references<small>${CAT.products.length} in the collection</small></a>` +
      CAT.cats.map((c) =>
        `<a href="shop.html?cat=${c.slug}">${esc(c.name)}<small>${c.count} references · from ${money(c.from)}</small></a>`).join("") +
      `<a href="index.html#service">Client care</a>`;
  });
}

/* ---------- Bag drawer ---------- */
function renderBag() {
  const n = bagCount();
  document.querySelectorAll("[data-cart-count]").forEach((e) => {
    e.textContent = String(n);
    e.hidden = n === 0;
  });
  document.querySelectorAll("[data-cart-label]").forEach((e) => {
    e.textContent = `Your bag · ${n}`;
  });
  const btn = document.querySelector('[data-open="cart"]');
  if (btn) btn.setAttribute("aria-label", n === 1 ? "Open bag, 1 item" : `Open bag, ${n} items`);

  const body = document.querySelector("[data-cart-body]");
  const foot = document.querySelector("[data-cart-foot]");
  if (!body) return;

  const lines = bagLines(CAT);
  if (!lines.length) {
    body.innerHTML = `<div style="padding:48px 0;text-align:center">
      <p class="h3" style="margin-bottom:8px">Your bag is empty</p>
      <p class="cap" style="margin-bottom:24px">Nothing selected yet.</p>
      <a class="btn btn--line" href="shop.html">Browse the collection</a></div>`;
    if (foot) foot.hidden = true;
    return;
  }
  if (foot) foot.hidden = false;

  body.innerHTML = lines.map((r) => `
    <div class="cart__row">
      <img src="${r.p.image}" alt="${esc(r.p.name)}" width="64" height="64" loading="lazy">
      <div>
        <b style="font-weight:500;font-size:14px">${esc(r.p.name)}</b>
        <p class="ref mb0" style="margin-top:4px">REF. ${r.p.id} · Qty ${r.qty}</p>
        <button class="cap" data-remove="${r.p.id}" style="margin-top:8px;text-decoration:underline;min-height:44px">Remove</button>
      </div>
      <span class="price">${money(r.p.price * r.qty)}</span>
    </div>`).join("");

  const tot = document.querySelector("[data-cart-total]");
  if (tot) tot.textContent = money(bagSubtotal(CAT));

  body.querySelectorAll("[data-remove]").forEach((b) =>
    b.addEventListener("click", () => removeFromBag(b.dataset.remove)));
}

/* ---------- Gallery lightbox ---------- */
export function openLightbox(src, cap) {
  let box = document.querySelector(".lbox");
  if (!box) return;
  const im = box.querySelector("img");
  im.src = src;
  im.alt = cap || "";
  im.hidden = false;
  box.querySelector(".lbox__cap").textContent = cap || "";
  box.classList.add("is-open");
  box.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("is-locked");
  box.querySelector(".lbox__x")?.focus();
}
export function closeLightbox() {
  const box = document.querySelector(".lbox.is-open");
  if (!box) return;
  box.classList.remove("is-open");
  box.setAttribute("aria-hidden", "true");
  if (!document.querySelector(".drawer.is-open,.cart.is-open")) document.documentElement.classList.remove("is-locked");
}

/* ---------- Newsletter ---------- */
/* The footer Subscribe button had no handler on all seven pages that carry a
   footer. It posts to the Selldone audience stream now. Unlike the rest of the
   storefront this is a write, so it is the one control that needs in-flight
   state and a spoken result — a form that silently does nothing is worse than
   one that is visibly absent. */
function initNewsletter() {
  const box = document.querySelector(".sub");
  if (!box) return;
  const input = box.querySelector("input[type=email]");
  const btn = box.querySelector("button");
  if (!input || !btn) return;

  const say = document.createElement("p");
  say.className = "cap sub__say";
  say.setAttribute("role", "status");        // announced without stealing focus
  say.hidden = true;
  box.after(say);

  const show = (msg, bad) => {
    say.textContent = msg;
    say.hidden = false;
    say.classList.toggle("is-bad", Boolean(bad));
  };

  let busy = false;
  async function send() {
    if (busy) return;
    const email = input.value.trim();
    // Let the browser's own email validation speak first; it is localised.
    if (!email || !input.checkValidity()) {
      show("Enter an email address so we know where to write.", true);
      input.focus();
      return;
    }
    busy = true;
    btn.disabled = true;
    input.disabled = true;
    show("Signing you up…");
    try {
      await subscribe(email);
      show("Thank you — we will write when something arrives.");
      input.value = "";
    } catch (err) {
      show(err.message || "That did not go through. Try again shortly.", true);
      console.error("[watchino] subscribe failed", err);
    } finally {
      busy = false;
      btn.disabled = false;
      input.disabled = false;
    }
  }

  btn.addEventListener("click", send);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); send(); }
  });
}

/* ---------- Search ---------- */
/* Client-side over the catalogue already in memory, matching the reference app.
   35 references do not justify a network round-trip per keystroke, and the
   storefront has the whole list loaded before the button can be clicked. */
function initSearch() {
  const sheet = document.querySelector(".sheet--search");
  if (!sheet) return;
  const input = sheet.querySelector("[data-search-input]");
  const out = sheet.querySelector("[data-search-results]");
  const count = sheet.querySelector("[data-search-count]");

  const norm = (v) => String(v ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

  function run() {
    if (!CAT) { count.textContent = "Loading the collection…"; return; }
    const q = norm(input.value).trim();
    if (!q) {
      out.innerHTML = "";
      count.textContent = `${CAT.products.length} references in the collection`;
      return;
    }
    // Every term must appear somewhere in the record, so "molino gold" narrows
    // rather than widening the way an OR match would.
    const terms = q.split(/\s+/);
    const hits = CAT.products.filter((p) => {
      const hay = norm([p.name, p.brand, p.catName, p.id].join(" "));
      return terms.every((t) => hay.includes(t));
    });

    count.textContent = hits.length === 1 ? "1 reference" : `${hits.length} references`;
    out.innerHTML = hits.length
      ? hits.map((p) => `<a class="sres" href="product.html?id=${p.id}">
          <span class="sres__art"><img src="${p.image}" alt="" loading="lazy" width="56" height="56"></span>
          <span><b>${esc(p.name)}</b><span class="cap">${esc(p.catName)}${p.brand ? " · " + esc(p.brand) : ""}</span></span>
          <span class="price">${money(p.price)}</span>
        </a>`).join("")
      : `<div class="sempty">
           <p class="h3" style="margin-bottom:6px">Nothing matches “${esc(input.value.trim())}”</p>
           <p class="cap">Try a maker, a collection, or part of a reference name.</p>
         </div>`;
  }

  input.addEventListener("input", run);
  // The catalogue may still be loading when the sheet is first opened.
  document.addEventListener("catalog:ready", run);
  run();
}

/* ---------- Account ---------- */
/* Authorization Code + PKCE against selldone.com/oauth, public client. The
   session is read through storefrontAuth directly: the /api/storefront/* shim
   only ever translated a fake path into this call. */
async function renderAccount() {
  const body = document.querySelector("[data-account-body]");
  if (!body) return;
  body.innerHTML = `<p class="cap" style="padding:24px 0">Checking your session…</p>`;

  let s;
  try {
    s = await storefrontAuth.session();
  } catch (err) {
    console.error("[watchino] session lookup failed", err);
    body.innerHTML = `<div class="acct">
      <p class="lede" style="margin-bottom:20px">Your session could not be checked just now.</p>
      <button class="btn btn--full" type="button" data-signin>Sign in</button>
    </div>`;
    wire(body);
    return;
  }

  if (!s.authenticated) {
    body.innerHTML = `<div class="acct">
      <p class="lede" style="margin-bottom:8px">Sign in to see your orders and saved addresses.</p>
      <p class="cap" style="margin-bottom:24px">Watchino uses your Selldone account. This is a demonstration storefront — no order is ever placed.</p>
      <button class="btn btn--full" type="button" data-signin>Sign in with Selldone</button>
    </div>`;
    wire(body);
    return;
  }

  const u = s.user || {};
  body.innerHTML = `<div class="acct">
    <div class="acct__id">
      ${u.avatar ? `<img class="acct__av" src="${esc(u.avatar)}" alt="" width="52" height="52">` : `<span class="acct__av"></span>`}
      <span>
        <span class="acct__nm">${esc(u.name || "Signed in")}</span>
        ${u.email ? `<span class="cap" style="display:block">${esc(u.email)}</span>` : ""}
      </span>
    </div>
    ${u.email ? `<div class="acct__row"><span>Email</span><span>${esc(u.email)}</span></div>` : ""}
    <div class="acct__row"><span>Shop</span><span>${esc(s.shop || "Watchino")}</span></div>
    <p class="cap" style="margin:22px 0">Order history is not part of this demonstration.</p>
    <button class="btn btn--line btn--full" type="button" data-signout>Sign out</button>
  </div>`;
  wire(body);

  function wire(root) {
    root.querySelector("[data-signin]")?.addEventListener("click", (e) => {
      e.currentTarget.disabled = true;
      storefrontAuth.startLogin(location.pathname + location.search);
    });
    root.querySelector("[data-signout]")?.addEventListener("click", () => storefrontAuth.logout(location.pathname));
  }
}

/* Reflect the signed-in state on the header button without opening the sheet,
   so the control is not silent about state it already knows. */
async function markAccountState() {
  const btn = document.querySelector('[data-open="account"]');
  if (!btn) return;
  try {
    const s = await storefrontAuth.session();
    if (s.authenticated) btn.setAttribute("aria-label", `Account — signed in as ${s.user?.name || s.user?.email || "you"}`);
  } catch { /* the button still opens the sheet, which reports the failure */ }
}

/* ---------- Deep-link re-anchor ---------- */
/* The browser jumps to a #hash before the web fonts have loaded. Bodoni and
   Archivo are metrically different from the fallbacks, so the document reflows
   underneath the jump — on a cold load /terms#delivery landed 62px high, which
   put the heading behind the sticky header. Re-anchor once metrics are final,
   but never fight a reader who has already started scrolling. */
function initDeepLink() {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (!target || !document.fonts) return;

  let moved = false;
  const release = () => { moved = true; };
  const opts = { passive: true, once: true };
  ["wheel", "touchstart", "keydown"].forEach((e) => addEventListener(e, release, opts));

  document.fonts.ready.then(() => {
    if (!moved) target.scrollIntoView(); // honours scroll-margin-top
    ["wheel", "touchstart", "keydown"].forEach((e) => removeEventListener(e, release, opts));
  });
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  initHeader();
  initRail();
  initReveal();
  initAcc();
  initDeepLink();
  initNewsletter();
  initSearch();
  markAccountState();
  document.querySelector(".lbox__x")?.addEventListener("click", closeLightbox);
  document.querySelector(".lbox")?.addEventListener("click", (e) => {
    if (e.target.classList.contains("lbox")) closeLightbox();
  });

  try {
    CAT = await loadCatalog();
  } catch (err) {
    document.querySelectorAll("[data-catalog-error]").forEach((e) => {
      e.hidden = false;
      e.textContent = "The collection could not be loaded from Selldone. Refresh to try again.";
    });
    console.error("[watchino] catalog load failed", err);
    return;
  }

  window.__WATCHINO__ = CAT; // inspection handle for verification
  fillNav();
  renderBag();
  document.addEventListener("bag:changed", renderBag);
  document.dispatchEvent(new Event("catalog:ready"));
});

export { CAT };
