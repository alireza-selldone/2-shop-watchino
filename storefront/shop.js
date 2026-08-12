/* Watchino — shop listing.
   Ported from design-reference/shop.html + initShop(), extended with the
   brand filter. All data live from XAPI. */

import { loadCatalog, money, catOf } from "./watchino-data.js";
import { cardHTML, esc } from "./app.js";

const lg = Math.log10;

function initShop(cat) {
  const grid = document.getElementById("pgrid");
  if (!grid) return;

  const params = new URLSearchParams(location.search);
  const presetCat = params.get("cat");
  const presetBrand = params.get("brand");

  /* ---- Filter 1: collection ---- */
  const catBox = document.getElementById("catfilters");
  catBox.innerHTML = cat.cats.map((c) => `
    <label class="check">
      <input type="checkbox" value="${c.slug}"${presetCat === c.slug ? " checked" : ""}>
      ${esc(c.name)}<span class="cap">${c.count}</span>
    </label>`).join("");

  /* ---- Filter 4: brand ---- */
  const brandBox = document.getElementById("brandfilters");
  brandBox.innerHTML = cat.brands.map((b) => `
    <label class="check">
      <input type="checkbox" value="${esc(b.name)}"${presetBrand === b.name ? " checked" : ""}>
      ${esc(b.name)}<span class="cap">${b.count}</span>
    </label>`).join("");

  /* ---- Filter 2: price, logarithmic ----
     29 of 35 references sit under $19,000 against a $153,889 ceiling. On a
     linear track they occupy the first eighth and the control is unusable. */
  const LO = cat.lo, HI = cat.hi;
  const toVal = (pos) => Math.pow(10, lg(LO) + (Number(pos) / 100) * (lg(HI) - lg(LO)));

  const lo = document.getElementById("plo");
  const hi = document.getElementById("phi");
  const out = document.getElementById("pout");
  const sort = document.getElementById("sort");
  const stock = document.getElementById("instock");
  const count = document.getElementById("count");
  const title = document.getElementById("listtitle");
  const intro = document.getElementById("listintro");

  function render() {
    const picked = [...catBox.querySelectorAll("input:checked")].map((i) => i.value);
    const brands = [...brandBox.querySelectorAll("input:checked")].map((i) => i.value);
    let a = toVal(lo.value), b = toVal(hi.value);
    if (a > b) [a, b] = [b, a];
    const atFloor = Number(lo.value) === 0, atCeil = Number(hi.value) === 100;
    out.textContent = `${money(Math.floor(a))} — ${money(Math.ceil(b))}`;

    const list = cat.products.filter((p) =>
      (!picked.length || picked.includes(p.cat)) &&
      (!brands.length || brands.includes(p.brand)) &&
      (atFloor || p.price >= a) && (atCeil || p.price <= b) &&
      (!stock.checked || p.qty > 0));

    if (sort.value === "low") list.sort((x, y) => x.price - y.price);
    if (sort.value === "high") list.sort((x, y) => y.price - x.price);
    if (sort.value === "new") list.sort((x, y) =>
      String(y.raw.created_at || "").localeCompare(String(x.raw.created_at || "")) || y.id - x.id);

    const one = picked.length === 1 ? catOf(cat, picked[0]) : null;
    title.textContent = one ? one.name : "All references";
    if (intro) intro.textContent = one ? one.blurb
      : `${cat.products.length} references across ${cat.cats.length} collections.`;
    count.textContent = `${list.length} ${list.length === 1 ? "reference" : "references"}`;
    document.title = `${one ? one.name : "All references"} — Watchino`;

    if (list.length) {
      grid.className = "pgrid";
      grid.innerHTML = list.map(cardHTML).join("");
    } else {
      /* Never a blank page: offer three real references either side of the band. */
      const near = [...cat.products]
        .sort((x, y) => Math.abs(x.price - (a + b) / 2) - Math.abs(y.price - (a + b) / 2))
        .slice(0, 3);
      grid.className = "";
      grid.innerHTML = `<div class="empty">
        <p class="h3" style="margin-bottom:8px">Nothing in this range</p>
        <p class="cap" style="margin-bottom:28px">Widen the price band or clear a filter. These sit closest to what you asked for.</p>
        <div class="pgrid" style="text-align:left">${near.map(cardHTML).join("")}</div>
      </div>`;
    }
  }

  [lo, hi, sort, stock].forEach((el) => el.addEventListener("input", render));
  catBox.addEventListener("change", render);
  brandBox.addEventListener("change", render);
  document.getElementById("clear")?.addEventListener("click", () => {
    catBox.querySelectorAll("input").forEach((i) => (i.checked = false));
    brandBox.querySelectorAll("input").forEach((i) => (i.checked = false));
    lo.value = 0; hi.value = 100; stock.checked = false; sort.value = "new";
    render();
  });

  render();
}

document.addEventListener("catalog:ready", async () => initShop(await loadCatalog()));
