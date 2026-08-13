/* Watchino — storefront data layer.
   Live Selldone data only. No hardcoded catalog, no hardcoded image URLs.

   Rules this file exists to enforce:
   - Storefront reads go browser-direct to XAPI. api.selldone.com is never called.
   - Endpoints come from the storefront-sdk ai-guideline builders, never invented.
   - Images resolve through the central Selldone helper, never string-concatenated.
   - A discount is only real if its date window is currently open.
*/

import { getPublicConfig } from "../shared/runtime-config.js";
import { selldoneImagePathToUrl } from "../dashboard/features/selldone-images.js";

const cfg = getPublicConfig();

export const SHOP = {
  handle: cfg.STOREFRONT_SHOP_HANDLE || "Watchino",
  id: cfg.shopId || 8460,
  xapi: (cfg.STOREFRONT_XAPI_BASE || "https://xapi.selldone.com").replace(/\/+$/, ""),
};

/* Endpoint builders — both are in _generated/api-url-builders.md.
   products/list is used because it is the only one carrying brand and spec. */
const URL_PRODUCTS_LIST = (limit = 250) =>
  `${SHOP.xapi}/shops/@${SHOP.handle}/products/list?limit=${limit}`;
const URL_PRODUCTS_ALL = (limit = 250) =>
  `${SHOP.xapi}/shops/@${SHOP.handle}/products/all?dir=*&limit=${limit}` +
  `&products_only=true&with_category=true&with_total=true`;

/* Audience capture — xapi.stream.audience.submit in the endpoint registry.
   POST /shops/{shop_id}/audience/{access_key}. Takes the numeric shop id, not
   the @handle the catalog builders use. The `newsletter` key is the default web
   audience stream and tags the record automatically. Public: no Authorization
   header, no S-Guest — this is a form a visitor submits before signing in. */
const URL_AUDIENCE = (accessKey = "newsletter") =>
  `${SHOP.xapi}/shops/${SHOP.id}/audience/${encodeURIComponent(accessKey)}`;

export async function subscribe(email, { accessKey = "newsletter", tags } = {}) {
  const res = await fetch(URL_AUDIENCE(accessKey), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(tags ? { email, tags } : { email }),
  });
  // Selldone returns business errors inside a 200 as {error:true,error_msg},
  // so an ok status alone does not mean the address was accepted.
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Subscribe failed (${res.status})`);
  if (body?.error) {
    const msg = body.error_msg;
    throw new Error(typeof msg === "string" ? msg : "That address was not accepted.");
  }
  return body;
}

/* ---------- Images ---------- */
export function img(path, size) {
  return selldoneImagePathToUrl(path, { shopId: SHOP.id, scope: "products", size });
}

/* ---------- Money ---------- */
export const money = (n) =>
  "$" + Number(n).toLocaleString("en-US", {
    minimumFractionDigits: Number(n) % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });

/* ---------- Discounts ----------
   `discount` on its own is not enough: four Haute Horlogerie references carry a
   dis_start/dis_end window that closed on 2024-11-27. Reading the raw field
   would advertise a reduction that no longer exists and would put nearly the
   whole catalogue on sale. Validated against the server's own final_price:
   agrees on 35/35. */
export function activeDiscount(p, now = Date.now()) {
  if (!(Number(p.discount) > 0)) return 0;
  if (p.dis_start && now < Date.parse(p.dis_start)) return 0;
  if (p.dis_end && now > Date.parse(p.dis_end)) return 0;
  return Number(p.discount);
}
export const finalPrice = (p) => Number(p.price) - activeDiscount(p);
export const wasPrice = (p) => (activeDiscount(p) > 0 ? Number(p.price) : null);

/* ---------- Variants ----------
   Selldone returns a colour hex and nothing else: no variant name. Rather than
   invent finish names, a swatch is labelled with its literal hex plus a visible
   ordinal, so colour is never the only indicator.

   Composite colours such as "#7B1FA2/#D32F2F" are not valid CSS colours and are
   rendered as a hard 135deg split. 13 of the 35 references carry one. */
export const isComposite = (c) => typeof c === "string" && c.includes("/");

export function swatchStyle(color) {
  if (!color) return "";
  if (isComposite(color)) {
    const [a, b] = color.split("/").map((s) => s.trim());
    return `background-image:linear-gradient(135deg,${a} 50%,${b} 50%)`;
  }
  return `background-color:${color}`;
}

export function swatchLabel(color) {
  if (!color) return "Unnamed finish";
  return isComposite(color)
    ? color.split("/").map((s) => s.trim()).join(" and ")
    : color;
}

export const variantColors = (p) =>
  (p.variants || []).map((v) => v && v.color).filter(Boolean);

/* Which colours are plausible watch finishes.
   The catalogue carries 126 variant instances: 86 real finishes, 11 arguable,
   15 junk (deep purple, magenta) and 14 two-tone composites. Rather than invent
   finish names or silently show a lime watch, the swatch row is filtered to
   this curated set. Hand-authored, deliberately conservative, easy to override. */
export const FINISH = new Set([
  "#000000", // black
  "#FFFFFF", // white
  "#C0C0C0", // steel
  "#383838", // gunmetal
  "#616161", // grey
  "#5D4037", // brown leather
  "#BEA994", // tan leather
  "#D6BEA6", // light tan
  "#FFD700", // yellow gold
  "#FFA000", // amber gold
  "#b76e79", // rose gold
  "#303F9F", // navy dial
  "#1976D2", // blue dial
]);
const norm = (c) => String(c || "").trim();
export const isFinish = (c) => !isComposite(c) && FINISH.has(norm(c));
/* Real finishes for a product, de-duplicated and in catalogue order. */
export const finishesOf = (p) => [...new Set(variantColors(p).filter(isFinish))];

/* ---------- Categories ----------
   Titles and membership are live. The representative image for each collection
   tile is a product photograph, as in the approved prototype. */
export const CAT_BLURB = {
  "mens-classic": "Round cases, printed dials, nothing shouting.",
  "womens-collection": "Smaller cases, set indices, quartz and automatic.",
  "heritage-leather": "Alligator and calf, stitched by hand.",
  "sport-chronograph": "Tachymeter bezels and screw-down crowns.",
  "diamond-gold": "Set stones and solid cases, finished by hand.",
  "haute-horlogerie": "Six references. Months of finishing per piece.",
};

const CAT_SLUG = {
  37955: "mens-classic",
  37956: "womens-collection",
  37957: "heritage-leather",
  107902: "sport-chronograph",
  37959: "diamond-gold",
  37958: "haute-horlogerie",
};

const CAT_ORDER = [
  "mens-classic", "womens-collection", "heritage-leather",
  "sport-chronograph", "diamond-gold", "haute-horlogerie",
];

/* Representative photograph for each collection tile. Chosen by eye from the
   references actually in each collection, not by price rank. */
const CAT_HERO = {
  "mens-classic": 325648,
  "womens-collection": 709386,
  /* 325699 Luxe Heritage is on a gold bracelet — no leather in frame.
     709381 has the most legible strap in the collection: tan alligator
     grain with visible stitching. */
  "heritage-leather": 709381,
  "sport-chronograph": 709380,
  /* 709376 photographs as steel with a blue bezel and reads as neither
     diamond nor gold. 709373 is a gold bracelet set with stones throughout. */
  "diamond-gold": 709373,
  "haute-horlogerie": 709403,
};

/* ---------- Shop context ----------
   Loaded before checkout renders. The Stripe publishable key lives at
   shop.gateways[].public.key and is read at runtime — never written into a
   file, never committed. Publishable keys are client-side by design; the
   secret key is not exposed by this endpoint and is never handled here. */
const URL_SHOP_INFO = () => `${SHOP.xapi}/shops/@${SHOP.handle}/info`;
let _shop = null;

export async function loadShop() {
  if (_shop) return _shop;
  const r = await fetch(URL_SHOP_INFO(), { mode: "cors", headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`shop info ${r.status}`);
  const j = await r.json();
  const gateways = (j.shop && j.shop.gateways ? j.shop.gateways : []).filter((g) => g.enable);
  const stripe = gateways.find((g) => /stripe/i.test(g.code));
  _shop = {
    raw: j.shop,
    title: j.shop?.title || "Watchino",
    currency: j.shop?.currency || "USD",
    currencies: j.shop?.currencies || ["USD"],
    gateways,
    stripeKey: stripe?.public?.key || "",
    stripeKeyResolved: Boolean(stripe?.public?.key),
  };
  return _shop;
}

/* ---------- Catalog ---------- */
let _cache = null;

export async function loadCatalog() {
  if (_cache) return _cache;

  const [listRes, allRes] = await Promise.all([
    fetch(URL_PRODUCTS_LIST(), { mode: "cors", headers: { Accept: "application/json" } }),
    fetch(URL_PRODUCTS_ALL(), { mode: "cors", headers: { Accept: "application/json" } }),
  ]);
  if (!listRes.ok) throw new Error(`products/list ${listRes.status}`);
  const listJson = await listRes.json();
  const allJson = allRes.ok ? await allRes.json() : { products: [] };

  const catTitle = new Map();
  (allJson.products || []).forEach((p) => {
    if (p.category && p.category.id) catTitle.set(p.category.id, p.category.title);
  });

  const products = (listJson.products || []).map((p) => {
    const slug = CAT_SLUG[p.category_id] || "";
    return {
      id: p.id,
      name: p.title,
      slug: p.slug || String(p.id),
      brand: p.brand || "",
      cat: slug,
      catName: catTitle.get(p.category_id) || "",
      price: finalPrice(p),
      was: wasPrice(p),
      qty: Number(p.quantity) || 0,
      rate: Number(p.rate) || 0,
      rateCount: Number(p.rate_count) || 0,
      spec: p.spec && typeof p.spec === "object" ? p.spec : null,
      colors: variantColors(p),
      icon: p.icon || "",
      image: img(p.icon),
      variantImages: (p.variants || []).map((v) => (v && v.image ? img(v.image) : "")).filter(Boolean),
      raw: p,
    };
  });

  const cats = CAT_ORDER.map((slug) => {
    const inCat = products.filter((p) => p.cat === slug);
    const heroId = CAT_HERO[slug];
    const hero = products.find((p) => p.id === heroId) || inCat[0];
    return {
      slug,
      name: inCat[0]?.catName || slug,
      blurb: CAT_BLURB[slug] || "",
      count: inCat.length,
      from: inCat.length ? Math.min(...inCat.map((p) => p.price)) : 0,
      image: hero ? hero.image : "",
      heroName: hero ? hero.name : "",
    };
  }).filter((c) => c.count > 0);

  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))]
    .map((b) => ({ name: b, count: products.filter((p) => p.brand === b).length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  _cache = {
    products,
    cats,
    brands,
    lo: Math.min(...products.map((p) => p.price)),
    hi: Math.max(...products.map((p) => p.price)),
    onSale: products.filter((p) => p.was).length,
  };
  return _cache;
}

/* Per-reference detail. products/{id}/info is the only source of the real
   image gallery; the list endpoints carry a single icon.
   NOTE: article_pack.article.body on these records is mismatched demo copy
   (the watch 709403 returns text about a portable monitor), so it is not used. */
const URL_PRODUCT_INFO = (id) => `${SHOP.xapi}/shops/@${SHOP.handle}/products/${id}/info`;

export async function loadProduct(id) {
  const r = await fetch(URL_PRODUCT_INFO(id), { mode: "cors", headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`products/${id}/info ${r.status}`);
  const p = (await r.json()).product;
  if (!p) throw new Error("no product in response");
  const gallery = [];
  const seen = new Set();
  const push = (path, alt, w, h) => {
    const u = img(path);
    if (u && !seen.has(u)) { seen.add(u); gallery.push({ src: u, alt: alt || "", w: w || 1000, h: h || 1000 }); }
  };
  push(p.icon, `${p.title}, main view`);
  (p.images || []).forEach((im, i) => push(im.path, im.alt || `${p.title}, view ${i + 2}`, im.width, im.height));
  return { raw: p, gallery };
}

export const byId = (cat, id) => cat.products.find((p) => p.id === Number(id));
export const catOf = (cat, slug) => cat.cats.find((c) => c.slug === slug) || null;

/* ---------- Bag ----------
   Client-side only. This storefront is a capability demonstration: it never
   writes a basket to the shop and never places an order. */
const BAG_KEY = "watchino_bag_v1";

export function readBag() {
  try { return JSON.parse(localStorage.getItem(BAG_KEY)) || []; }
  catch { return []; }
}
export function writeBag(rows) {
  localStorage.setItem(BAG_KEY, JSON.stringify(rows));
  document.dispatchEvent(new CustomEvent("bag:changed", { detail: rows }));
}
export function addToBag(id, qty = 1) {
  const rows = readBag();
  const hit = rows.find((r) => r.id === Number(id));
  if (hit) hit.qty += qty; else rows.push({ id: Number(id), qty });
  writeBag(rows);
  return rows;
}
export function removeFromBag(id) {
  writeBag(readBag().filter((r) => r.id !== Number(id)));
}
export const bagCount = () => readBag().reduce((n, r) => n + r.qty, 0);
export function bagLines(cat) {
  return readBag()
    .map((r) => ({ ...r, p: byId(cat, r.id) }))
    .filter((r) => r.p);
}
export const bagSubtotal = (cat) =>
  bagLines(cat).reduce((n, r) => n + r.p.price * r.qty, 0);
