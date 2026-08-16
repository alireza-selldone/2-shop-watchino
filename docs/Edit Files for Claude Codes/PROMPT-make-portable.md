# MAKE THE TEMPLATE PORTABLE

The freeze lifts for this one piece of work. Everything else stays as it is.

## The problem, stated plainly

Right now an untouched clone of this repository serves **this** shop's catalogue on
someone else's domain. Worse, a clone correctly pointed at its own shop renders an
**empty** collections grid, because `CAT_SLUG` hardcodes this shop's numeric
category ids and `cats` filters out anything with a zero count.

So doing the right thing produces a worse result than doing nothing. That is the
bug.

This work makes the repository usable by **any watch shop**, in one step, without
anyone editing code.

---

## The target experience

A shop owner connects the Selldone MCP connector to their own shop, clones this
repo, runs it, and sees the Watchino catalogue with a visible notice that these
are sample products. Then they say one sentence to their agent:

> Add my products, categories and blog.

And the site becomes theirs. That sentence is the whole interface. Everything
below exists to make it work.

---

## 1. `shop.config.json` at the repo root

One file holding every shop-specific value. Ships with Watchino's values so a
fresh clone runs and looks finished.

```json
{
  "shop": { "id": 8460, "handle": "Watchino", "name": "Watchino" },
  "isTemplate": true,
  "brand": {
    "foundedYear": 1946,
    "cities": "Zürich and London",
    "tagline": "Fine watches, sold by people who repair them."
  },
  "categories": [
    { "id": 37955, "slug": "mens-classic", "blurb": "…" }
  ],
  "hero": { "slides": [ { "productId": 709403, "kicker": "…", "title": "…", "lede": "…" } ] },
  "spotlight": { "mode": "highest-price" },
  "contact": { "email": null, "phone": null, "address": null }
}
```

**`isTemplate` is the safety flag.** It stays `true` until a shop's own values are
written. While it is true, a **visible amber banner** sits above everything:

> These are sample products from the Watchino demonstration shop, not yours.
> Ask your agent to add your products to make this site your own.

Use the existing scaffolding amber. Silent wrong data is worse than a broken
build — someone who sees a plausible shop and does not realise whose products
they are showing is the failure mode this whole piece of work exists to prevent.

**Trigger the banner on `isTemplate === true` OR a missing shop id**, not on the
literal value 8460. Because of the `|| 8460` fallback, an empty config serves
Watchino just as surely as one that names it, and an operator who deleted the
meta tags believes they have unset something.

---

## 2. `npm run setup` — the one sentence, implemented

A script the agent runs. It reads the connected shop through MCP and writes
`shop.config.json`, then propagates it into the meta tags and copy.

**It must not ask which shop.** `selldone_current_connection` already knows —
the user chose the shop when they connected the connector. Asking again is a step
that does not need to exist.

### Categories

Read the shop's live categories. **Accept any number from 3 to 10** — do not
require six. The grid adapts:

| Categories | Desktop grid |
|---|---|
| 3 | 3 across |
| 4 | 4 across |
| 5 or 6 | 3 across, two rows |
| 7 or 8 | 4 across, two rows |
| 9 or 10 | 5 across, two rows |

Below 3, drop the section rather than render a lonely tile. Above 10, take the
ten with the most products and say so in the run report.

Category `title` and `icon` already arrive live on `products/all` via
`p.category.title` and `p.category.icon` — the storefront reads them today. Only
the id-to-slug map, the order and the blurbs need generating.

**Delete `CAT_SLUG` entirely.** Derive slugs from titles. Never carry another
shop's integers.

### Blurbs — write them

One short line per category, from what the category actually contains: its name
and a sample of its products. Concrete and specific — "Round cases, printed
dials, nothing shouting" rather than "Our classic collection". No superlatives.

If the products in a category are too varied to characterise honestly, write
nothing and let the tile show name and count alone. An empty blurb is better than
a vague one.

### Hero slides — choose them

Three slides. Pick products that will read at hero size: prefer ones with a
transparent or clean-background image, then by price. Do not pick three from the
same category.

Write a kicker, a headline and a one-sentence lede for each, **based only on what
the product data and photograph actually support**. No invented specifications, no
claims about materials or movements that are not in the record. This project has
removed fabricated copy twice; do not reintroduce it.

**If no product has a usable hero image, say so and fall back** to the plain
product-plate hero with no slider, rather than a broken photograph.

### Spotlight

`mode: "highest-price"`, resolved at runtime. No hardcoded id.

### Blog

If the shop has articles, use them. If it has none, follow
`store-pages/BLOG-INSTRUCTION.md` but in **quick mode**: four posts of about 100
words each — enough that the listing and the article page both look complete,
fast enough not to stall setup.

Reuse this repository's existing article images as placeholders and **say so in
the run report**, so nobody mistakes them for their own.

Add a line to the run report: *"Ask your agent to add your real blog whenever you
have one."*

### Brand copy

`foundedYear`, `cities` and `tagline` come from the config and appear wherever
Watchino's currently do. Where the shop has no equivalent, leave the field null
and **omit the sentence** rather than printing a placeholder.

### Contact

Leave null. The four policy pages already render `{{TOKEN}}` visibly when a value
is missing, which is the honest behaviour.

---

## 3. What must be true when it finishes

Verify these, do not assert them:

- `shop.config.json` holds the connected shop's real values and `isTemplate` is
  `false`
- The amber template banner is gone
- The collections grid shows **that shop's** categories with non-zero counts
- Every meta tag in all three `index.html` files matches the config
- No Watchino category id, product id or copy string survives anywhere in
  `storefront/`
- The homepage, shop, product, blog and checkout pages all render
- `npm run check` passes

Then run it twice more as a real test: **once against a shop with three
categories, once against a shop with ten.** If you have no second shop available,
say so plainly rather than claiming it was tested.

---

## 4. Also fix, while you are here

The README currently says The Index and Night Vitrine do not survive and there is
no runnable copy. That was true when written. Both now exist as self-contained
files and will be added to `directions/`. Correct that section — they exist, they
run, and they read the same catalogue. Keep the honesty about `design-reference/`
being an earlier Blued Steel snapshot rather than either of them.

---

## 5. Report

- Every file you changed and why
- The full contents of `shop.config.json` as shipped
- What `npm run setup` printed on the Watchino shop
- Anything you could not make work, stated plainly rather than worked around

Update `SETUP.md` so step one is *connect the MCP connector*, step two is *clone
and run*, step three is *`npm run setup`* — and everything currently described as
manual meta-tag editing is gone.
