# Watchino — evidence pack

A luxury watch storefront built on Selldone: static, framework-free, zero runtime
dependencies, deployed on Cloudflare Workers from a git push. Every product,
price, stock figure, variant, blog post and category on it is live from a real
Selldone shop.

| | |
|---|---|
| **Live site** | https://watchino.selldone.shop |
| **Repository** | https://github.com/alireza-selldone/2-shop-watchino |
| **Selldone shop** | `watchino` — shop id `8460`, `watchino.myselldone.com` |
| **Products / categories / makers** | **66 / 6 / 6 strings** (five real makers) |
| **Price range** | **$1,888.90 – $153,888.90** |

Read [`STATE.md`](STATE.md) for the full live-data state and everything still
open. Read [`GAPS.md`](GAPS.md) for the platform limitations hit while building
it. Read [`DOCS.md`](DOCS.md) for SETUP, PLAYBOOK, what-this-demonstrates, the
agent skill and DECISIONS in full.

---

## Design tokens

The palette is horological instrumentation rather than generic luxury. The accent
is the colour steel turns at 290°C when a watchmaker blues a set of hands.

### Ink

| Token | Hex | Use |
|---|---|---|
| `--graphite` | `#16191D` | Body ink, dark surfaces. Never pure black. |
| `--slate` | `#3D444C` | Secondary text |
| `--mist` | `#8A9199` | Rules, decorative marks. **Not for text** — 2.69:1 on dial. |
| `--mist-text` | `#616870` | The same hue at 4.75:1 on `--dial`, for text |
| `--whisper` | `#C3C8CC` | Faint marks on dark |

### Surfaces

| Token | Hex | Use |
|---|---|---|
| `--dial` | `#E9ECEE` | Page ground. Cool, deliberately not warm cream. |
| `--dial-pure` | `#FFFFFF` | Cards, the Selldone credit bar |
| `--rule` | `#D3D8DC` | Hairlines on light |
| `--rule-dark` | `#2A2F35` | Hairlines on graphite |

### Accent and state

| Token | Hex | Use |
|---|---|---|
| `--blued` | `#2F4E8F` | The accent. Heat-blued steel. |
| `--blued-lift` | `#4468AE` | Hover on dark |
| `--brass` | `#9A7B43` | Haute Horlogerie tier only |
| `--stock` | `#3F6B54` | In stock |
| `--alert` | `#8C4A3F` | Errors on light |
| `--alert-lift` | `#E39685` | Errors on graphite — `--alert` is 2.69:1 there |

### Scaffolding amber

One amber across the site, meaning one category of message: *this is
demonstration scaffolding, not the shop speaking.*

| | Hex |
|---|---|
| Border | `#E0A800` |
| Ground | `#FFF8E1` |
| Key line | `#6E4E00` |
| Body | `#4A3600` |

### Type

| Role | Family |
|---|---|
| Display | Bodoni Moda |
| Body | Archivo |
| Data — prices, SKUs, references | Azeret Mono |

Other tokens: `--radius: 2px`, `--rail: 56px`, `--maxw: 1440px`, `--pad: 48px`,
`--tap: 44px` (WCAG 2.5.5 minimum interactive target).

---

## The screenshots

Captured after deployment, from the live site, at 1440 wide unless noted. No
browser chrome. Each caption says what the frame demonstrates rather than what it
depicts.

| File | What it demonstrates |
|---|---|
| `01-homepage-full.png` | That a storefront assembled entirely from live Selldone data can carry a designed identity end to end, not a template with products dropped in. |
| `02-hero.png` | Editorial photography as the entry point, with the catalogue reachable from inside the image rather than beside it. |
| `03-hero-hotspot-open.png` | Products identified inside a photograph — the marker sits on the watch, the card sits clear of both subjects, and it is keyboard-reachable. |
| `04-collections-grid.png` | Six live categories with their real product counts, not a fixed set of tiles. |
| `05-salon.png` | That a shop can carry brand narrative in the same surface as its catalogue without a separate CMS. |
| `06-reviews.png` | Honest handling of absent data: six clearly-labelled sample reviews, because the shop has no real ratings. Remove the label and it becomes a false claim. |
| `07-shop-listing.png` | 66 live products, 24 per page with Load more, each card priced from live data. |
| `08-shop-filtered.png` | Faceting across a live catalogue — Haute Horlogerie plus a price band, 11 references down to 5 — resolved client-side with no extra API calls. |
| `09-product.png` | A reference with five real variants: gallery, finish swatches, live stock and SKU. |
| `10-product-variant.png` | A different finish selected — price, stock, SKU and photograph all change together. This is the fix for a bug that showed $42,500 on a reference that runs to $58,900. |
| `11-blog.png` | The shop's four real articles with their real categories and real dates. |
| `12-article.png` | A single article rendered from the shop's own content. |
| `13-checkout.png` | A complete guest checkout against live pricing. No order is ever placed. |
| `14-account-signedout.png` | The amber callout naming the setting that makes direct sign-in work — the prerequisite nobody cloning the repo would guess. |
| `15-account-signedin.png` | The same panel signed in, with the callout absent. **Simulated session** — see the note below. |
| `16-page-terms.png` | Policy pages carrying a visible demonstration-content banner rather than pretending to be real terms. |
| `17-mobile-home.png` | 390 — the same identity at phone width, not a stripped-down variant. |
| `18-mobile-shop.png` | 390 — faceted catalogue on a phone. |
| `19-mobile-product.png` | 390 — variants, price and the buy action within thumb reach. |
| `20-selldone-bar.png` | The platform credit above the shop's own announcement bar, light against dark so the two never read as one block. |

### Two notes on honesty

**`15-account-signedin.png` uses a simulated session.** OAuth sign-in requires
entering a password, which I will not do, so the token was injected into
`localStorage` and the profile call stubbed. The code path is real — the panel
reaches the signed-in branch, renders Sign out, and omits the callout, which is
what the frame is there to show. The identity is not a real account and order
history shows its error state in that frame.

**`21-direction-index.png` and `22-direction-night-vitrine.png` do not exist.**
The Index and Night Vitrine were built, but they are not in the repo, not in git
history and not on disk. `design-reference/` is an earlier snapshot of the
shipped direction, not either of them. Rather than substitute something else and
call it evidence, the two files are absent and this is the note explaining why.

---

## What is real and what is demonstration content

The distinction matters more than any screenshot here.

### Live from Selldone

- **The catalogue** — all 66 products, their names, makers and specifications
- **Prices** — including per-variant pricing where the shop sets it
- **Stock** — per product and per variant
- **Variants** — 136 rows across 37 products, with their colours, SKUs and images
- **Categories** — all six, with their live membership
- **The blog** — four articles, their categories, their bodies and their dates
- **Shop identity** — name, currency, gateway configuration

### Written for the demonstration

- **Reviews** — six, each visibly labelled as a sample, because the shop has no
  real ratings
- **The salon illustrations** and the brand narrative around them
- **Brand history** — "Est. 1946" and everything attached to it
- **Contact details** — address, phone, hours
- **Policy page content** — terms, privacy, returns, each carrying a visible
  demonstration banner
- **Editorial copy** — collection blurbs and section headings

No review, specification, colour name, contact detail or API path was invented
beyond the labelled samples above. Where real data does not exist, the storefront
shows an honest empty state.
