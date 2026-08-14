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

/* ---------- Reviews ----------
   Sample content, labelled as such wherever it renders. This site removed
   invented reviews once already because they were presented as real; the label
   is what makes the difference, exactly as the banner does on the policy pages.

   Deliberately generic rather than watch-specific, so the block survives when
   this repo is imported into a shop selling something else.

   The average and the distribution are DERIVED below, never typed. When
   rate_count stops being zero across the catalogue, replace the sample array in
   loadReviews() with the real source and `sample` becomes false — the label and
   every figure follow automatically. */
const SAMPLE_REVIEWS = [
  { name: "Marta K.",   city: "Rotterdam", rating: 5,
    body: "Ordered on the Thursday, arrived Monday morning. Packaging was sensible rather than excessive, and the item matched the listing photographs closely." },
  { name: "Daniel R.",  city: "Bristol",   rating: 5,
    body: "I asked two questions before ordering and got a straight answer to both, including one that talked me out of the more expensive option." },
  { name: "Priya S.",   city: "Toronto",   rating: 4,
    body: "No complaints about the item itself. Delivery took a day longer than the estimate, though the tracking was accurate the whole way." },
  { name: "Tomás L.",   city: "Lisbon",    rating: 5,
    body: "Second order from here. The first one settled it — returns were handled without an argument when I picked the wrong size." },
  { name: "Anne-Sofie H.", city: "Aarhus", rating: 3,
    body: "The product is good and I would buy it again. The checkout asked me to re-enter my address twice, which was more friction than it needed to be." },
  { name: "Ibrahim O.", city: "Manchester", rating: 4,
    body: "Fair price for the quality. It is not the cheapest available, but nothing about it feels like a compromise after a few months of use." },
];

/* Average and star distribution computed from whatever list is passed in. */
export function summariseReviews(list) {
  const total = list.length;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: list.filter((r) => r.rating === star).length,
  }));
  const sum = list.reduce((n, r) => n + r.rating, 0);
  return {
    total,
    average: total ? sum / total : 0,
    counts: counts.map((c) => ({ ...c, pct: total ? (c.count / total) * 100 : 0 })),
  };
}

/* One place to switch data sources. Real ratings win the moment any exist. */
export function loadReviews(products = []) {
  const rated = products.filter((p) => p.rateCount > 0);
  if (rated.length) {
    const list = rated.map((p) => ({
      name: p.name, city: "", rating: Math.round(p.rate), body: "", productId: p.id,
    }));
    return { ...summariseReviews(list), reviews: list, sample: false };
  }
  return { ...summariseReviews(SAMPLE_REVIEWS), reviews: SAMPLE_REVIEWS, sample: true };
}

/* ---------- Blog ----------
   Registry endpoints, not invented:
     xapi.blogs.list  GET /shops/@{shop}/blogs        (?category, ?limit, ?extra)
     xapi.blogs.get   GET /shops/@{shop}/blogs/{blog_id}

   Two quirks worth knowing, both found by testing rather than reading:

   1. `blog_id` on the detail route is the article's `parent_id` (the shop-blog
      record), NOT the article id. Passing the article id returns "Blog not
      found", which reads like the endpoint is missing.
   2. `?extra=true` returns the category list but an EMPTY `articles` array,
      filling `last_articles` instead. So categories and articles need separate
      calls rather than one combined one.

   The public list carries no category on each article. Rather than fetch the
   detail of every post to find out (an N+1 that grows with the blog), the
   category map is built with one filtered list call per category — bounded by
   the number of categories, which stays small. */
const URL_BLOGS = (q = "") => `${SHOP.xapi}/shops/@${SHOP.handle}/blogs${q}`;
const URL_BLOG = (blogId) => `${SHOP.xapi}/shops/@${SHOP.handle}/blogs/${encodeURIComponent(blogId)}`;

const asJson = async (url) => {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const j = await r.json();
  if (j?.error) throw new Error(j.error_msg || "Blog request failed");
  return j;
};

/* Selldone truncates `description` to 256 characters, which lands mid-word.
   Trim back to the last sentence or word so the card does not end in "Start by co". */
export function excerpt(text, max = 190) {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  if (stop > max * 0.5) return cut.slice(0, stop + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "") + "…";
}

export const articleDate = (a) =>
  a.schedule_at || a.created_at || null;   // schedule_at is cleared once it fires

/* Categories alone — one request. The article page needs a name for one id and
   should not pull the whole listing to get it. */
export async function loadBlogCategories() {
  const extra = await asJson(URL_BLOGS("?extra=true")).catch(() => ({ categories: [] }));
  return (extra.categories || []).map((c) => ({
    id: c.id, name: c.category, count: Number(c.articles) || 0,
  }));
}

export async function loadBlog() {
  const [listing, extra] = await Promise.all([
    asJson(URL_BLOGS("?limit=100")),
    asJson(URL_BLOGS("?extra=true")).catch(() => ({ categories: [] })),
  ]);

  const cats = (extra.categories || []).map((c) => ({
    id: c.id, name: c.category, count: Number(c.articles) || 0,
  }));

  // One filtered call per category gives every post its category without an
  // N+1 over articles. Posts in no category simply never appear in a map entry.
  const owners = new Map();
  await Promise.all(cats.map(async (c) => {
    try {
      const r = await asJson(URL_BLOGS(`?category=${c.id}&limit=100`));
      (r.articles || []).forEach((a) => owners.set(a.id, c));
    } catch { /* a failing filter must not blank the whole listing */ }
  }));

  const posts = (listing.articles || []).map((a) => ({
    id: a.id,
    blogId: a.parent_id,          // the detail route wants this, not a.id
    slug: a.slug,
    title: a.title,
    image: a.image,
    excerpt: excerpt(a.description),
    date: articleDate(a),
    category: owners.get(a.id) || null,
  }));

  posts.sort((x, y) => Date.parse(y.date || 0) - Date.parse(x.date || 0));
  return { posts, cats, total: Number(listing.total) || posts.length };
}

export async function loadArticle({ blogId, slug }) {
  let id = blogId;
  if (!id && slug) {
    const listing = await asJson(URL_BLOGS("?limit=100"));
    id = (listing.articles || []).find((a) => a.slug === slug)?.parent_id;
    if (!id) return null;
  }
  if (!id) return null;
  const r = await asJson(URL_BLOG(id)).catch(() => null);
  if (!r?.article) return null;
  const a = r.article;
  return {
    id: a.id, blogId: id, slug: a.slug, title: a.title, body: a.body,
    image: a.image, excerpt: excerpt(a.description, 240),
    date: articleDate(a), categoryId: r.category ?? null,
    author: a.user?.name || "",
  };
}

/* ---------- Order history ----------
   xapi.checkout.order_history.list — GET /shops/@{shop}/basket/orders-{type}
   with the order-history scope, which the storefront client already holds.
   This shop is physical-only, so the type is PHYSICAL. */
export async function loadOrders(accessToken, { type = "PHYSICAL", limit = 10 } = {}) {
  if (!accessToken) return null;
  const url = `${SHOP.xapi}/shops/@${SHOP.handle}/basket/orders-${type}?offset=0&limit=${limit}`;
  const r = await fetch(url, {
    headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error(`orders ${r.status}`);
  const j = await r.json();
  if (j?.error) throw new Error(j.error_msg || "Order history unavailable");
  const rows = j.baskets || j.orders || j.data || [];
  return rows.map((o) => ({
    id: o.id,
    date: o.created_at || o.reserved_at || null,
    status: o.status || o.delivery_state || "",
    total: Number(o.price ?? o.total ?? 0),
    currency: o.currency || "USD",
    items: Number(o.items_count ?? (o.items || []).length ?? 0),
  }));
}

/* ---------- Hero ----------
   One constant, so swapping the photograph is a one-line change.

   The dial coordinates were MEASURED off the file, not eyeballed: the purple
   dials are the only strongly purple pixels in an otherwise black-and-warm
   frame, so locating them is a pixel search rather than a guess.
     man's wrist   65.4% across, 57.5% down   dial is 1.14% x 2.34% of the frame
     woman's wrist 80.7% across, 54.6% down   dial is 1.08% x 1.81%

   709740 Bonin Amethyst Crown is the watch on the MAN's wrist. Both references
   sit in Women's Collection in Selldone — that is the shop's own categorisation,
   not a mislabelled card. */
export const HERO_IMAGE = "assets/hero-couple.png";

export const HERO_HOTSPOTS = [
  /* dial   — measured centre of the purple dial, used to draw the tether
     marker — where the button sits: 2.2% clear of a dial that is only ~1.1%
               wide, so the control never covers the product it points at
     side   — which way the card opens, so it never lands on the couple */
  { id: 709740, dial: { x: 65.4, y: 57.5 }, marker: { x: 63.2, y: 60.6 }, side: "left" },
  { id: 709734, dial: { x: 80.7, y: 54.6 }, marker: { x: 78.5, y: 57.7 }, side: "left" },
];

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
   agrees on every reference. */
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
   rendered as a hard 135deg split; a large minority of references carry one. */
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
