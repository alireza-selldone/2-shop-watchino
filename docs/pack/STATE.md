# State of the project

Read from the live shop and the deployed site on **15 August 2026**, not from
memory. Every figure below was queried, not recalled.

- **Live site** — https://watchino.selldone.shop
- **Repository** — https://github.com/alireza-selldone/2-shop-watchino
- **Selldone shop** — Watchino, id `8460`, handle `watchino`, `watchino.myselldone.com`
- **Currency** — USD (EUR and AUD enabled on the shop, storefront prices in USD)

---

## Anything still broken, unverified, or knowingly imperfect

Put first, deliberately.

**1. Order history has never rendered against a real account.** The panel calls
`GET /shops/@{shop}/basket/orders-PHYSICAL` with the customer token. The request
is correctly formed, the code path renders, and the empty and error states are
honest — but signing in requires entering a password, which I will not do, so the
populated state has never been seen. Sign in on production and open the account
panel. If orders appear, it is done.

**2. Screenshot 15 uses a simulated session.** For the same reason. The token was
injected into `localStorage` and the profile call stubbed. What the screenshot
demonstrates is real — the panel reaches the signed-in branch, shows Sign out,
and omits the amber callout — but the identity is not a real account and order
history shows its error state in that frame. Labelled as such in the pack README.

**3. Screenshots 21 and 22 do not exist.** The Index and Night Vitrine are not in
the repo, not in git history, and not on disk. `design-reference/` is an earlier
snapshot of the shipped Blued Steel direction — same graphite/dial palette, not
the Swiss-systematic `#D8341C` one and not the dark one. README claimed they were
"kept for reference"; that claim has been corrected. They are described from the
record and nothing was faked to fill the gap.

**4. The shop's data has two spellings of one maker.** `Bonin` (6 products) and
`Bonin & Co.` (1 product) are the same maker. Not changed — Selldone writes are
additive only on this project. The storefront reports six maker strings rather
than silently merging them.

**5. The duplicate Cloudflare account's build fails on every push.**
`2-shop-watchino` on account `9fcd11cc…` fails while `watchino` succeeds.
Production is unaffected and serves the current build, but the repo's checks show
red. Disconnecting it is a dashboard action.

**6. Stale `variant_id`s on product 709761.** `images[].variant_id` points at
variants `1399688–91`; the live variants are `1399696–1700`. The storefront
matches on image URL instead, so it renders correctly, but the underlying links
are still wrong on the Selldone side.

Nothing else is known-broken.

---

## Catalogue — exact counts from live data

| | |
|---|---|
| **Products** | **66** |
| **Categories** | **6** |
| **Maker strings** | **6** (five real makers — see item 4) |
| **Price range** | **$1,888.90 – $153,888.90** |
| Products carrying variants | 37 of 66 |
| Total variant rows | 136 |
| Products whose variants are individually priced | 2 |
| Products with per-variant images | 10 (15.2%) |
| Blog articles | 4 |
| Blog categories | 4 |

### Categories

| Category | Slug | Products |
|---|---|---|
| Men's Classic | `mens-classic` | 12 |
| Women's Collection | `womens-collection` | 11 |
| Heritage & Leather | `heritage-leather` | 12 |
| Sport & Chronograph | `sport-chronograph` | 10 |
| Diamond & Gold | `diamond-gold` | 10 |
| Haute Horlogerie | `haute-horlogerie` | 11 |

Sums to 66.

### Makers

| Maker | Products |
|---|---|
| Rexin | 21 |
| Molex | 14 |
| Molino | 13 |
| Lonino | 11 |
| Bonin | 6 |
| Bonin & Co. | 1 |

### The two individually-priced references

| Product | Shown on card | Actual range | Variants |
|---|---|---|---|
| 709761 Molex Rectangular Regent | from $42,500 | $42,500 – $58,900 | 5 |
| 709762 Bonin Petite Classic | from $28,900 | $28,900 – $38,200 | 5 |

Before this was fixed both showed a flat lowest price — understating 709761 by
**$16,400** against a figure the customer would have been charged.

### Blog articles, as they stand on the shop

All four dated 14 August 2026 — see GAPS.md item 1 for why the dates cannot be
set to anything else.

| Category | Title |
|---|---|
| Trends & Collections | The Luxury Watch Trends Defining Modern Collections |
| Watchmaking & Movements | Automatic vs. Quartz: What Is Really Inside Your Watch? |
| Care & Maintenance | How to Care for a Luxury Watch and Keep It Beautiful for Years |
| Watch Guides | How to Choose a Luxury Watch That Truly Fits You |

---

## Every page that exists

| Route | Source | What it is |
|---|---|---|
| `/` | `storefront/index.html` | Homepage — hero with hotspots, six collections, price registers, salon, reviews |
| `/shop.html` | `storefront/shop.html` | Full catalogue, faceted, 24 per page with Load more |
| `/product.html?id=…` | `storefront/product.html` | Product page — gallery, variants, price, stock, SKU, bag |
| `/checkout.html` | `storefront/checkout.html` | Guest checkout — no order is ever placed |
| `/blog` | `storefront/blog.html` | The shop's four real articles |
| `/article.html?id=…` | `storefront/article.html` | One article |
| `/about-us` | `storefront/about-us.html` | Brand page — demonstration content |
| `/terms` | `storefront/terms.html` | Policy page — demonstration content |
| `/privacy` | `storefront/privacy.html` | Policy page — demonstration content |
| `/contact-us` | `storefront/contact-us.html` | Contact — demonstration content |
| `/dashboard/` | `dashboard/` | Browser-side admin, separate from the storefront |
| `/callback/` | `callback/` | OAuth PKCE landing |

The account panel is a drawer available from the header on every storefront page,
not a route of its own. `.html` is stripped by Workers `html_handling`, so
`/about-us.html` 307s to `/about-us`.

**One caveat on routes:** `not_found_handling` is
`single-page-application`, so the Worker returns the homepage with **HTTP 200**
for any unmatched path. A broken link does not 404 — it silently serves the
homepage. `deadctl.mjs` exists partly because of this.

---

## Verification, as run against production on 15 August 2026

| Suite | Scope | Result |
|---|---|---|
| `audit-run.mjs` | 10 pages × 11 widths = 110 states | see final report |
| `imgsweep.mjs` | 823 images against their container boxes | 0 overflowing |
| `deadctl.mjs` | every interactive control, clicked | 0 dead |
| `pagecheck.mjs` | every route, real navigation | all pass |
| `herocheck.mjs` | hero framing and marker placement | pass |

Every suite carries at least one negative control that is **proven to fail**
against a known-bad input in the same run. The controls added this round:

- the audit's third-party cache must not replay a transient failure into later
  states, while a real font-file failure and a missing stylesheet must both still
  be caught
- the `.sdbar` tap-target floor must still catch the link at its natural 51×12
- the credit bar's background assertion must reject a transparent bar

---

## The four documents

`SETUP.md`, `PLAYBOOK.md`, `docs/what-this-demonstrates.md` and
`.claude/skills/watchino-storefront/SKILL.md` are reproduced in full in
[`DOCS.md`](DOCS.md) in this folder, alongside the complete text of
[`DECISIONS.md`](DECISIONS.md).
