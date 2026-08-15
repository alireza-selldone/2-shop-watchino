# The documents, in full

Reproduced verbatim so they can be read here without opening five files. These
are the reference for other shops and none of them had been read by a human at
the time of writing.

Each is linked to its live location; this file is a copy, and the linked file is
the one that gets maintained.

---

## Contents

- [SETUP.md — setting up your own shop from this repo](#setupmd)
- [PLAYBOOK.md — the rules this storefront was built to](#playbookmd)
- [docs/what-this-demonstrates.md — for someone evaluating Selldone](#docswhat-this-demonstratesmd)
- [SKILL.md — the agent skill for the next shop](#skillmd)
- [DECISIONS.md — every judgement call, with reasoning](#decisionsmd)

---


<a id="setupmd"></a>

## SETUP.md — setting up your own shop from this repo

> Source: [`SETUP.md`](../../SETUP.md)

## Taking this repo to a new shop

A followable sequence from a fresh clone to a deployed storefront. It assumes no
prior knowledge of this project. Every step that has actually gone wrong here is
called out where it happens, and the [troubleshooting](#troubleshooting) section
at the end collects the ones that cost the most time.

---

### 1. Clone and reset history

```bash
git clone https://github.com/<you>/<this-repo>.git my-shop
cd my-shop
```

If this is a new shop rather than a contribution back, start its history clean:

```bash
rm -rf .git
git init
git add -A
git commit -m "Initial commit from the Watchino template"
```

> Resetting history is irreversible for the clone. Everything the previous shop
> did is gone, including any orphaned modules. That is usually what you want —
> but note it, because "go and find the old implementation in git history" stops
> being possible the moment you do it.

### 2. Install

```bash
npm install                  # wrangler and playwright, both dev-only
npx playwright install chromium
```

`npm install` pulls no runtime dependencies — the storefront ships as plain
HTML, CSS and ES modules. Playwright is only for the verification suite, and its
browser is a separate one-off download because nothing else in the repo needs it.

### 3. The meta tags

Public runtime config lives in `<meta>` tags, read by `shared/runtime-config.js`.
They appear in **three** files and **every shared value must match across all
three**, or the storefront and the dashboard will disagree about which shop they
are talking to:

- `storefront/index.html`
- `dashboard/index.html`
- `callback/index.html`

| Meta name | What it is | Example |
|---|---|---|
| `shop-name` | Display name used in page titles | `Watchino` |
| `pajulina-shop-id` | Numeric Selldone shop id. Some XAPI routes take this rather than the handle | `8460` |
| `pajulina-shop-name` | Shop display name | `Watchino` |
| `pajulina-storefront-shop-handle` | The `@handle` in XAPI paths — `/shops/@Watchino/...` | `Watchino` |
| `pajulina-shop-domain` | The shop's Selldone-hosted domain | `watchino.myselldone.com` |
| `pajulina-client-id` | OAuth client id from step 4. **No secret ever** | `019ff544-…` |
| `pajulina-app-name` | Name shown on the OAuth consent screen | `Selldone Shop A1` |
| `pajulina-callback-path` | Path the OAuth redirect returns to | `/callback/` |
| `pajulina-dashboard-path` | Where the browser-side admin is served | `/dashboard/` |
| `pajulina-selldone-base` | OAuth host | `https://selldone.com` |
| `pajulina-xapi-base` | Storefront data host | `https://xapi.selldone.com` |
| `pajulina-api-base` | Backoffice host — **dashboard only**, never called from the storefront | `https://api.selldone.com` |
| `pajulina-auth-prompt` | OAuth `prompt` parameter | `consent` |
| `custom-home` | Which view the root serves | `shop` |

The numeric id and the handle are **not interchangeable**. Catalogue routes take
`@handle`; audience capture takes the numeric id. Getting them the wrong way
round produces a 404 that reads like a missing endpoint.

### 4. Create the OAuth client

The storefront signs customers in with **Authorization Code + PKCE as a public
client**. There is no client secret, and there must not be one: the whole flow
runs in the browser, where a secret could not be kept.

In Selldone, create an OAuth client with:

- **Type:** public / PKCE (`token_endpoint_auth_method = none`)
- **PKCE method:** S256
- **Scopes:** `profile`, `phone`, `address`, `user:profile:write`, `buy`,
  `order-history`, `my-gift-cards`
- **Redirect URIs:** one for **every domain the storefront will ever serve from**

Put the client id into `pajulina-client-id` in all three files. Leave any secret
field empty.

#### Redirect URIs — the step whose absence costs an afternoon

The redirect URI is matched **exactly**, character for character, **including
the trailing slash**. `https://shop.example.com/callback` and
`https://shop.example.com/callback/` are different URIs. The storefront builds
its redirect from `window.location.origin` plus `pajulina-callback-path`, so
whatever that produces is what must be registered.

Register all of these before you need them:

```
http://localhost:8788/callback/            local development
https://<shop>.myselldone.com/callback/    the Selldone-hosted domain
https://<your-custom-domain>/callback/     step 6
```

Cloudflare preview deployments get their own hostname per branch
(`https://<branch>-<worker>.<subdomain>.workers.dev`). Those are **not**
registered, so sign-in will be rejected on a preview URL. That is expected —
test sign-in on production, or add the specific preview alias if you need it.

If a redirect URI is missing you get `invalid_client`, and the message does not
tell you which URI it objected to. See [troubleshooting](#troubleshooting) —
there is a second, more misleading cause.

### 5. Set the shop email address

Do this in the same sitting as the OAuth client. The two together are what make
customer sign-in work; the OAuth client alone is not enough.

**Store dashboard → Settings → Email.**

The two states, plainly:

| Shop email | What a customer gets when they tap *Sign in* |
|---|---|
| **Not set** | Redirected to Selldone and asked to create an account **on Selldone**. They end up with a Selldone account, not a session on your shop. Nothing in the storefront can override this. |
| **Set** | Signed in to your shop directly, with their email address. They return to the page they left. |

It is a **shop-level** setting. A visitor cannot change it, and neither can the
storefront — so there is no code fix, only the dashboard.

Because this is invisible until a customer hits it, this storefront ships an
amber callout under the *Sign in* button naming the setting. It renders only
when signed out. **Once your shop is configured, delete it** — it is guidance
for someone evaluating Selldone, not shop copy. One constant, `SIGNIN_NOTE` in
`storefront/app.js`, plus `.setupnote` in `storefront/styles.css`.

> On the Watchino demo shop the contact email is set to `info@watchino.com`
> while `mail_service` is `null`. The callout is left in place deliberately:
> the repo is a reference for people setting up their own shop.

### 6. Cloudflare Workers Builds

Deployment is git-driven: push to `main` and Cloudflare builds and publishes.

**Create the Worker first, then connect the build from inside it.** In the
Cloudflare dashboard:

1. Create a Worker whose name matches the `name` field in `wrangler.toml`
2. Open that Worker → **Settings → Builds → Connect**
3. Pick the repository and branch

Connecting from **Workers & Pages → Create** instead makes Cloudflare generate a
Worker named after the repository. That name will not match `wrangler.toml`, and
the build fails at the deploy step with a name mismatch that is easy to misread
as a permissions problem.

Build settings:

| Field | Value |
|---|---|
| Build command | `npm run build:static` |
| Deploy command | `npx wrangler deploy` |
| Non-production branch deploy command | `npx wrangler versions upload` |
| Production branch | `main` |

`wrangler.toml` itself needs only:

```toml
name = "<your-worker-name>"
compatibility_date = "2026-06-22"

[assets]
directory = "./dist/"
not_found_handling = "single-page-application"
html_handling = "auto-trailing-slash"
```

`html_handling = "auto-trailing-slash"` is what makes `/about-us` serve
`about-us.html`. It also strips `.html` in the other direction: a link to
`/shop.html` answers **307** to `/shop`. Link extensionless to avoid a redirect
on every click.

### 7. Custom domain

Add the domain to the Worker (**Settings → Domains & Routes**), then — and this
is the step people forget — **add `https://<that-domain>/callback/` to the OAuth
client's redirect URIs**. Sign-in works on the old domain and fails on the new
one otherwise, which looks like a broken deploy rather than a missing URI.

### 8. Run the verification suite

Start the dev server, then run the checks:

```bash
npm run dev:static      # http://localhost:8788/
npm run check           # in a second terminal
```

| Script | What it proves |
|---|---|
| `check:audit` | 10 accessibility/layout checks across every page at 11 widths, 1440→390. Contrast, tap targets, horizontal overflow, broken images, console errors |
| `check:images` | No image escapes its container's **content** box, and any element declaring `aspect-ratio` actually renders at it |
| `check:pages` | Every footer link resolves to content that is **not** the homepage, with a deliberately unrouted path kept in the run as a negative control |
| `check:controls` | Every visible button and link does something, detected by instrumenting `addEventListener` — not inferred from class names |
| `check:hero` | The hero crop keeps both watch hotspots in frame at 1440/1280/1024, with a knowingly-wrong crop as the negative control |

Each accepts a base URL, so the same checks run against a deployment:

```bash
node scripts/pagecheck.mjs https://your-shop.example.com
```

**Run them against production after deploying, not only locally.** That
distinction has caught real bugs here twice.

### 9. Catalogue expectations

The storefront reads everything live. For it to work:

- **Every product needs a category.** One uncategorised product does not error —
  it silently vanishes from the filters. Verify with a single call rather than
  assuming
- **Images resolve through the central helper** (`selldoneImagePathToUrl`), never
  by string-concatenating a CDN path
- **The price slider calibrates itself** from the live minimum and maximum. Do
  not write bounds down; a product outside a hardcoded band becomes unreachable
- **Products need variants only if they have them.** Variant swatches fall back
  to colour circles where no variant image exists
- **Ratings may be zero.** The reviews block shows an honest empty state rather
  than inventing anything

`store-pages/BLOG-INSTRUCTION.md` describes what to do about the blog on a new
shop; it runs automatically for an agent working from the skill.

---

### Troubleshooting

**`invalid_client` on sign-in.** Two causes, and the second is far more
misleading than the first.

1. The redirect URI is not registered, or differs by a trailing slash. Compare
   the `redirect_uri` query parameter in the authorize URL against the client's
   registered list, character for character.
2. **A stale browser cache.** A previously-cached copy of the auth module can
   keep sending an old client id long after the config is correct. This produced
   an `invalid_client` here that survived several rounds of checking the
   configuration, because the configuration was already right. Hard-reload, or
   test in a private window, **before** concluding anything about the client.

**A page that does not exist returns 200.** `not_found_handling =
"single-page-application"` serves the homepage for any unmatched path. A link to
a page you never created answers 200 with the wrong content, so a status-code
check proves nothing. Compare the response against the homepage — that is what
`check:pages` does, and why it keeps an unrouted path in the run.

**`wrangler` fails with a 403 and a Cloudflare Ray ID.** Some networks get
bot-challenged by Cloudflare's API, and it looks exactly like an expired token.
This is the main reason deployment goes through Workers Builds rather than a
local `wrangler deploy`.

**The dev server disagrees with production about routing.** `dev-static.mjs`
emulates `html_handling`. If you change routing behaviour in `wrangler.toml`,
change the emulation too, or local checks will stop predicting production.

**Playwright cannot launch.** `npm install` does not fetch browsers. Run
`npx playwright install chromium` once per machine.

---


<a id="playbookmd"></a>

## PLAYBOOK.md — the rules this storefront was built to

> Source: [`PLAYBOOK.md`](../../PLAYBOOK.md)

## Working on this codebase

Most of what follows looks like taste. It isn't — each rule is here because the
alternative was tried and produced something worse. Change any of it deliberately
if you like, but change it knowing it was a decision.

---

### The design system

#### Tokens are the source of truth

Every colour, typeface, spacing step and duration is a custom property in
`:root` at the top of `storefront/styles.css`. Nothing downstream should contain
a literal colour. If you need a new one, add a token.

| Token | Value | Why that value |
|---|---|---|
| `--graphite` | `#16191D` | Cool near-black. **Not** pure black — pure black reads as absence, this reads as ink |
| `--dial` | `#E9ECEE` | Cool dial white. Deliberately not a warm cream; warm greys make the accent look purple |
| `--blued` | `#2F4E8F` | The colour steel turns at 290°C when a watchmaker blues a set of hands. The whole palette hangs off this one fact |
| `--blued-lift` | `#4468AE` | `--blued` is 2.19:1 on graphite and fails contrast. This clears the 3:1 large-text threshold |
| `--mist-text` | `#616870` | `--mist` (`#8A9199`) fails AA as body text on `--dial` at 2.69:1. Same hue family, taken to 4.75:1 |
| `--alert-lift` | `#E39685` | `--alert` is 2.66:1 on graphite. The footer is the only place an error is spoken on a dark surface |
| `--brass` | `#9A7B43` | Haute Horlogerie section only. If brass appears anywhere else it stops meaning anything |
| `--tap` | `44px` | WCAG 2.5.5 minimum target |

Three of those tokens exist **only** because a contrast check failed. Do not
"simplify" them back into one.

#### Typefaces

- **Bodoni Moda** for display — Didone lettering, as printed on a watch dial
- **Archivo** for body
- **Azeret Mono** for data, with `tabular-nums` on every price so columns align

Prices render with a wide-looking comma. That is the monospace cell, not a bug.

#### Gallery, not funnel

No countdown timers. No urgency banners. No "X people are viewing this". No
discount popups. No exit intent.

Reduced prices appear as a struck-through previous figure in muted grey, **only
on the product page**, never as a badge on a card. A card that shouts SALE is a
different shop from this one.

A discount is only real if its date window is currently open — four references
carried a window that closed in 2024. Reading the raw `discount` field would put
almost the whole catalogue on sale.

#### The signature

A fixed **chapter-ring index rail** down the left edge that doubles as scroll
progress, and section dividers made of **minute markers** rather than plain
rules. The page structure literally measures itself.

These are the two things that make the site look like this site. Removing them
leaves a competent generic storefront. Don't.

---

### Engineering rules

#### The logarithmic price slider

The catalogue spans $2,089 to $153,889 and is heavily skewed to the low end. On a
**linear** track, 45% of references fall inside the first eighth — the useful
part of the control is a few pixels wide.

The track is logarithmic: `10^(lg(LO) + pos/100 · (lg(HI) − lg(LO)))`. Its
midpoint lands at $17,929 rather than $77,989.

**Bounds are computed from the live catalogue**, never written down. A hardcoded
band makes any product outside it unreachable the moment the shop grows.

#### Composite colour variants

Selldone returns a variant colour as a hex — but some are composites like
`#7B1FA2/#D32F2F`. As a raw `background-color` that is invalid CSS and renders
**white**, which reads as a product with no colour.

They render as a hard 135° split gradient. `swatchStyle()` handles both cases;
use it rather than assigning a colour directly.

#### Variant swatches are colour circles, for now

Measured against the live catalogue: **12.5%** of products have a variant
carrying its own image (22.9% counting only products that have variants at all).
The threshold for switching to photographs was 30%. Re-measure before changing
this — the measurement is three lines and the decision follows from it.

#### Images are contained, never cropped

Every product image sits inside its box with `object-fit: contain`. Product
photography is shot on white and cropping it removes the object.

`imgsweep.mjs` asserts two things: that no image overflows its container's
**content** box, and that any element declaring `aspect-ratio` **actually
renders at it**. The second assertion exists because the first alone missed a
real bug — the container had stretched, so nothing overflowed and the check
passed while the gallery was visibly broken.

Every `<img>` carries `width`/`height` attributes to reserve layout space. Those
are presentational hints for the CSS properties, so a rule setting only `width`
leaves the height hint in force and the image renders stretched. `img { height:
auto }` in the reset handles it; components wanting an explicit height still win
on specificity.

#### `.reveal` fails visible

Twelve sections animate in on scroll. They default to `opacity: 1`; the
animation lives behind a `js-reveal` class added **only at the moment the
IntersectionObserver arms**, and elements already on screen are marked revealed
synchronously before the browser paints.

If the script throws, the page is fully readable. An animation that hides content
until JavaScript rescues it is a content-loss bug waiting for a bad deploy.

#### Colour is never the only indicator

Variant swatches carry an accessible label plus a visible "Finish 2 of 3"
ordinal. Stock state has words, not just a green dot. Error text has a tone
*and* a sentence.

#### The storefront never calls `api.selldone.com`

Customer-facing code talks to `xapi.selldone.com` only. The backoffice host is
for `dashboard/`. This boundary is asserted by the audit.

#### No secrets, anywhere

OAuth is a public PKCE client with no secret. The Stripe publishable key is read
at runtime from shop gateway info and appears in no file. If you find yourself
adding a token to a file, something upstream is wrong.

---

### The verification suite

Five scripts under `scripts/`, each runnable against a URL as well as locally.

| Script | Asserts |
|---|---|
| `audit-run.mjs` | 10 checks × every page × 11 widths: contrast, tap targets ≥44px, horizontal overflow, broken images, missing dimensions, console and request errors |
| `imgsweep.mjs` | Containment against the content box, plus aspect-ratio integrity |
| `pagecheck.mjs` | Every footer link resolves to content distinct from the homepage; anchors land clear of the sticky header; token audit |
| `deadctl.mjs` | Every visible button and link is wired, by **observing** listeners |
| `herocheck.mjs` | Both hero hotspots stay inside the cropped frame at three widths; no gradient scrim |

#### The rule that matters most

> **A new check must be proven to fail before it is trusted passing.**
> Keep the negative control in the run, not in your memory of having tried it.

`pagecheck.mjs` requests a deliberately unrouted path every time.
`herocheck.mjs` runs its geometry against a knowingly wrong crop every time. If
those controls ever stop reporting a failure, the checks around them have
stopped measuring.

#### Why the rule exists

Five incidents in this project, all the same species — a check that reported
success while measuring nothing:

1. **The audit's contrast check** returned `null` for any element with a
   `background-image` ancestor, silently exempting everything over the hero. It
   passed while a call-to-action sat at 1.00:1 — literally invisible.
2. **The dead-control sweep** inferred "wired" from an allowlist of class names.
   It missed Search and Account entirely, then later reported a correctly-wired
   Subscribe button as dead. An allowlist only encodes the conventions its author
   remembered.
3. **A byte-size check** would have passed against the SPA fallback, because a
   page that does not exist returns 200 with the homepage. Status codes proved
   nothing; comparing against the homepage did.
4. **A string replace silently no-opped** — the pattern assumed LF, the file was
   CRLF. It shipped homepage JavaScript onto four content pages. The fix asserts
   the replace matched.
5. **A screenshot taken before hydration** captured static markup that exists
   before the script runs, so the check measured the wrong moment. The same trap
   made two checkout buttons look unwired.

A sixth nearly happened while writing the hero: a keyboard-order test called
`document.body.focus()`, which is a no-op because `body` is not focusable, so
focus had simply never left the element under test. It reported "reached in 1
tab stop" and was wrong.

---

### The sign-in callout, and why it is amber

Direct customer sign-in only works once the shop owner has set an email address
under **Store dashboard → Settings → Email**. Without it the customer is sent to
Selldone to register there instead of signing in to the shop. It is shop-level,
so no storefront code can work around it.

Because nobody cloning this repo would guess that, the account panel carries an
amber callout under the *Sign in* button naming the setting. Three rules govern
it:

- **It is amber**, the same `#E0A800` on `#FFF8E1` as the demo-content banner on
  the policy pages. One amber across the site means one category of message:
  *this is scaffolding, not the shop speaking.* It is deliberately unlike the
  rest of the palette, which is graphite, dial white and blued steel.
- **It renders only when signed out.** Setup instructions inside an account
  someone already has are clutter. `SIGNIN_NOTE` appears in the two signed-out
  branches of `renderAccount()` and nowhere else.
- **A real shop deletes it.** This is guidance for someone evaluating Selldone,
  not shop copy. One constant in `storefront/app.js` and one `.setupnote` block
  in `styles.css` — removing both leaves no trace.

Checkout does not carry it: checkout on this storefront is guest-only, with an
email field and no sign-in offer, so there is nothing for the callout to attach
to. If a sign-in affordance is ever added there, it gets the same treatment.

### Content rules

**Never invent data.** No fabricated reviews, calibers, colour names, contact
details or API paths. Where real data does not exist, show an honest empty
state — the reviews block does exactly this when every rating is zero.

Sample content is allowed **only when it is visibly labelled as sample**. The
homepage reviews carry a line saying so; the policy pages carry a demo banner.
Remove the label and it becomes a false claim.

**Endpoints come from the registry**, never from a guess. Three real traps found
by testing rather than reading:

- The blog detail route's `{blog_id}` is the article's `parent_id`, not the
  article id. Passing the article id returns "Blog not found"
- `?extra=true` on the blog list returns categories but an **empty** `articles`
  array
- Audience capture takes the **numeric** shop id; catalogue routes take `@handle`

**Article dates cannot be backdated.** `created_at` is ignored by the upsert, and
a past `schedule_at` fires immediately, clears itself, and resets `created_at` to
the publish moment. Show the real date.

---


<a id="docswhat-this-demonstratesmd"></a>

## docs/what-this-demonstrates.md — for someone evaluating Selldone

> Source: [`docs/what-this-demonstrates.md`](../../docs/what-this-demonstrates.md)

## What this storefront demonstrates

This is a working online shop built on Selldone. It sells nothing — no order is
ever placed — but everything you see is real software reading real data from a
real Selldone shop.

It exists to answer one question: **if I put my products into Selldone, what can
the shop actually look like, and what can it do?**

---

### Everything on the page comes from the shop

Nothing here is typed into the website by hand. Open the Selldone dashboard,
change a price, and the site shows the new price. Add a product and it appears.
The site is a window onto the shop, not a copy of it.

That includes:

**The catalogue.** Sixty-four watches across six collections. Names,
descriptions, prices, photographs, stock levels and specifications all come from
the shop record.

**Collections.** The six groups on the homepage are the shop's own categories.
Rename one in the dashboard and the site follows.

**Variants.** Where a watch comes in more than one finish, the choices shown are
the ones set up on the product.

**Prices and discounts.** Reduced prices show the old figure struck through — but
only while the discount's date window is actually open. An expired sale stops
showing as a sale on its own.

**Stock.** Sold-out references say so rather than letting someone try to buy them.

**Search and filtering.** Customers can filter by collection, maker, price and
availability, and search the catalogue by name.

**The basket and checkout.** A five-step checkout with delivery details, address
and payment. It runs the real flow up to the point of payment.

**Customer accounts.** Customers sign in with their email address and see their
own order history. Sign-in uses a modern, secure standard — the site never sees
or stores a password.

**A blog.** Four articles with categories, cover images and dates, written and
published from the dashboard.

**Content pages.** About Us, Terms, Privacy and Contact.

---

### The design is entirely yours

This particular look — the near-black ink, the blued-steel accent, the ruled
markers down the side — is one choice among endless others. It is not what
Selldone looks like. It is what *this shop* was designed to look like.

To prove that, two completely different designs were built from the same data:

**The Index** — Swiss systematic, circa 1970. No serif type at all, one signal
colour, everything numbered, collections laid out as a table rather than a grid
of cards.

**Night Vitrine** — the boutique after closing. Fully dark, warm blacks, light
used as the only accent, each product sitting in its own pool of light.

Same products, same prices, same shop. Three entirely different shops to look at.
Your designer can do the same with yours.

---

### Being straight with you about what this is

**It is a demonstration, not a trading business.** Watchino is not a real
company. No order is ever placed, no payment is ever taken, and nothing ships.

**Some content is sample content, and it says so.** The customer reviews on the
homepage carry a line stating they are samples shown to demonstrate the layout.
The About, Terms, Privacy and Contact pages carry a visible banner marking them
as placeholder text. Contact details appear as obvious placeholders rather than
invented addresses — an invented address looks exactly like a real one, and
that is the problem with inventing it.

**Where there is no data, the site says so.** No product has been reviewed yet,
so the reviews area on each product page says exactly that instead of showing
made-up stars. That is the honest behaviour, and it is what your shop would do
on its first day too.

---

### What it would take for your shop

Your products, your categories and your photographs go into Selldone. The
storefront reads them. The design is then a separate question, answered by
whoever you want to answer it.

The technical work is already done and is reusable: this repository is a
template, with written instructions for pointing it at a different shop. What
changes per shop is the content and the design — not the plumbing.

---


<a id="skillmd"></a>

## SKILL.md — the agent skill for the next shop

> Source: [`.claude/skills/watchino-storefront/SKILL.md`](../../.claude/skills/watchino-storefront/SKILL.md)

---
name: watchino-storefront
description: Work on a Selldone storefront built from the Watchino template — setting one up on a new shop, redesigning it, adding products, pages or blog content, running its verification suite, or deploying it to Cloudflare Workers. Use when the repo contains SETUP.md, PLAYBOOK.md and a storefront/ directory reading from xapi.selldone.com.
---

## Watchino storefront

A static, framework-free Selldone storefront: plain HTML, CSS and ES modules,
deployed to Cloudflare Workers, reading everything live from XAPI.

### Read these rather than guessing

| Task | Document |
|---|---|
| Point this repo at a new shop, meta tags, OAuth client, Workers Builds, custom domain | `SETUP.md` |
| Design tokens, engineering rules, the verification suite, why each decision was made | `PLAYBOOK.md` |
| Blog content on a new shop | `store-pages/BLOG-INSTRUCTION.md` |
| What was decided during the last build and why | `DECISIONS.md` |
| Architecture, OAuth flow, API boundaries | `docs/technical-reference.md` |
| Explaining the shop to a non-technical customer | `docs/what-this-demonstrates.md` |

Do not duplicate their contents into a reply. Read the relevant one and follow it.

### Non-negotiables

These hold regardless of what is being asked.

**The storefront calls `xapi.selldone.com` only.** Never `api.selldone.com` from
customer-facing code — that host belongs to `dashboard/`. The audit asserts this.

**No secrets in any file.** OAuth is a public PKCE client with no secret. The
Stripe publishable key is read at runtime from shop gateway info. If you are
about to write a token into a file, something upstream is wrong.

**Never invent data.** No fabricated reviews, specifications, colour names,
contact details or API paths. Where real data does not exist, render an honest
empty state. Sample content is permitted **only when visibly labelled as
sample** — remove the label and it becomes a false claim.

**Customer sign-in needs a shop email address.** Set it under Store dashboard →
Settings → Email before expecting direct sign-in to work; without it customers
are redirected to Selldone to register there instead. It is a shop-level setting
no storefront code can override, so configure it when setting up a new shop, and
delete the amber `SIGNIN_NOTE` callout from `storefront/app.js` once it is done.

**Endpoints come from the registry.** Use the Selldone MCP endpoint search and
describe tools. Do not guess a REST path. Three verified traps: the blog detail
route takes the article's `parent_id` and not its id; `?extra=true` on the blog
list returns categories with an empty `articles` array; audience capture takes
the numeric shop id while catalogue routes take `@handle`.

**A check must be proven to fail before it is trusted passing.** Write the
negative control into the run, not into your memory of having tried it once.
Five checks in this project reported success while measuring nothing —
`PLAYBOOK.md` lists them. Before believing a green result, ask what input would
turn it red, and feed it that input.

**Selldone writes are additive unless deletion is explicitly requested.** Read
freely. Before any write, assert `selldone_current_connection` returns the shop
you intend — more than one connector may be loaded.

**Run the blog instruction automatically on a new shop.** `store-pages/BLOG-INSTRUCTION.md`
is standing policy, not a request that needs raising.

### The verification suite

```bash
npm run dev:static          # then, in a second terminal:
npm run check               # audit · images · pages · controls · hero
```

Each script also accepts a base URL, so the same checks run against a
deployment. **Run them against production after deploying**, not only locally —
that distinction has caught real bugs twice.

### Deploying

Push to `main`; Cloudflare Workers Builds builds and publishes. Do not run
`wrangler deploy` locally — some networks get bot-challenged by Cloudflare's API
and the failure looks exactly like an expired token.

---


<a id="decisionsmd"></a>

## DECISIONS.md — every judgement call, with reasoning

> Source: [`DECISIONS.md`](../../DECISIONS.md)

## Decisions

Judgement calls made during the autonomous runs of 14–15 August 2026, with
reasoning.
Newest section first is not useful here; this is grouped by subject.

---

### Still wrong, or unverifiable

Nothing is known-broken. Two things are **unverified rather than verified**, and
you should treat them as open:

**1. Order history has never been seen with real data.** The account panel now
calls `GET /shops/@{shop}/basket/orders-PHYSICAL` with the customer token. I
verified the request is formed correctly, that the code path renders, and that
the empty and error states are honest — but I cannot sign in (entering a password
is not something I will do), so the populated state has never rendered against a
real account. **Sign in on production and open the account panel.** If orders
appear, it is done. If the call 4xxs, the panel says "Your orders could not be
loaded just now" and logs the reason to the console.

**2. The hero's leader-line markers could not be built as briefed.** There is no
off-subject label position for the woman's watch anywhere in the photograph —
measured, not guessed. Both watches now carry an 8px dot and both references
appear as cards below. Full reasoning in the hero section.

**3. The hero photograph is a different register from the rest of the site.**
It is not a bug, but it is the thing most likely to make you say "put it back".

**4. The two unshipped design directions no longer exist.** README claimed The
Index and Night Vitrine were "complete four-page prototypes, kept for
reference". They are not in the repo, not in git history, and not on disk.
`design-reference/` is an earlier snapshot of the shipped Blued Steel direction —
same graphite/dial palette, not the Swiss-systematic `#D8341C` one and not the
dark one. Screenshots 21 and 22 of the pack therefore do not exist. README has
been corrected to describe them as history rather than as runnable prototypes.

**5. Screenshot 15 (signed-in account panel) uses a simulated session.** OAuth
sign-in needs a password, which I will not enter, so the token was injected into
localStorage directly and the profile call stubbed. The *code path* is real — the
panel reaches the signed-in branch, renders Sign out, and omits the callout — but
the identity in that screenshot is not a real account, and order history still
shows its error state. This is the same gap as item 1, seen from the other side.

**6. The duplicate Cloudflare account's build now fails.** `2-shop-watchino` on
account `9fcd11cc…` failed on the final commit while `watchino` succeeded. You
told me to ignore that account, and I have — production is unaffected and serves
the current build. But it has gone from silently duplicating every deploy to
failing on every deploy, so its check will now show red on the repo whatever you
push. Disconnecting it is a dashboard action.

---

### The sign-in callout, the credit bar, and one audit that was lying

**The callout is not on checkout.** The brief said to give sign-in the same
treatment "anywhere else sign-in is offered, including checkout". Checkout here
is guest-only: an email field, no account panel, no sign-in affordance anywhere
on the page. Adding an amber note about signing in, to a page that does not
offer signing in, would be noise. Nothing was invented to hold it. If a sign-in
affordance is ever added there, it gets the callout.

**The amber is the site's existing amber, not the mockup's.** The mockup used
`#FFF6DC`; the policy pages already use `#FFF8E1` with the same `#E0A800` border.
One amber across the site reads as one category of message. The difference is
imperceptible and the consistency is not.

**The callout keeps the hex-free copy.** No colour names, no invented specifics —
it names one setting and one path, both verifiable.

**The credit bar sits outside the sticky header.** Putting it inside would have
changed the stuck-header height, which `.filters` and `.pinfo` offset from at
`top:120px`. Outside, it scrolls away and those offsets stay correct. Verified at
1440, 1024 and 390: 35px tall, page top 0, above the announcement bar, rail still
starting at 0, header still pinning to 0 when scrolled.

**A 40px bar cannot hold a 44px tap target.** The brief caps the bar under 40px;
the site's own rule is 44px targets. Those cannot both hold. The link is padded
out to 73x38 — as large as a 35px bar allows — and the audit now holds `.sdbar`
links to the WCAG 2.5.8 AA minimum of 24x24 instead of the site's 44. That is a
**lower floor, not an exemption**: a control that strips the padding confirms the
natural 51x12 is still caught. Everything outside `.sdbar` still needs 44.

---

### The audit was memoising its own failures

Worth writing down, because it is the seventh instance of the same family.

The matrix caches third-party responses so eleven widths do not refetch the fonts
and the catalogue. It cached **every** response, including failures. One
throttled font fetch got stored as a 404 and replayed into all 110 states — the
whole matrix red while the site was healthy, and blaming a **different font each
run**, because a different request lost the race each time. Successes only now;
a miss costs one refetch, a poisoned entry cost the run.

Two things fell out of fixing it:

**`document.fonts.check()` returns true when nothing matches.** "Usable via
fallback" counts as a pass, so the font check would have stayed green if the
stylesheet itself 404'd and every heading silently rendered in Times. Found by a
control that blocked the stylesheet and watched the check shrug. It now requires
a registered `FontFace` that actually reached `loaded`.

**The stricter check needed `document.fonts.ready`.** Reading `FontFace.status`
without waiting measures the race, not the page — which is why the first fixed
run still looked flaky against production. Bounded at 5s so a genuinely missing
font fails rather than hanging the matrix.

Controls kept in the run: a transient failure must not poison later states, a
real font-file failure must still be caught, and a missing stylesheet must be
caught.

**A note on request volume.** Running four browser jobs at once against
production drove response times to 18s and started closing connections, and
XAPI throttled to the point where the catalogue stopped loading locally too. The
suites are cheap to run but not free — run them one at a time.

---

### Variants: the allowlist was ours, and it was eating real data

`products/list` carries **two** variant arrays. `variants` is a distinct-values
summary — colour, image, nothing else. `product_variants` is the real thing:
id, sku, colour, image, and its own price, discount and stock. We were reading
the summary, but that was not the bug.

The bug was a hardcoded `FINISH` allowlist in `watchino-data.js`, written for an
earlier catalogue. On 709761 it kept **1 of 5** real variants — one lost purely
to case, `#b76e79` in the list against `#B76E79` in the data — so the page
announced "a single finish is recorded" for a reference sold in five. Seven
products were affected. It is deleted, not replaced with a smarter filter: a
colour that looks wrong is shop data to fix in Selldone, not something the
storefront should hide.

**The serious consequence was the price.** 709761 ranges $42,500–$58,900 and we
showed $42,500 flat — a figure the customer would not be charged, understated by
**$16,400**. Two products are affected, both hero references. Cards now show
"from $42,500" when variants differ, and the product page shows the selected
variant's real price, stock and SKU.

**Swatches: image where available, colour circle otherwise.** Re-measured at
**15.2%** of the catalogue carrying variant images — under the 30% threshold on
paper, but those ten references are the ones customers reach from the hero, so
the middle band's behaviour is what ships.

**No colour names exist.** There is no `name`, `title` or `label` on either
array. Selldone's own storefront generates "Dark purple" from the hex at render
time. Using one here would mean shipping a hex→name mapping, which is invented
data, so the accessible label stays the hex and the visible "Finish 2 of 5"
ordinal keeps colour from being the only indicator.

#### Stale variant_ids on the Selldone side — worth cleaning up

`images[]` carries a `variant_id` that would be the natural way to swap the
gallery. On 709761 those ids point at a variant set that no longer exists:

```
images[].variant_id   1399688, 1399689, 1399690, 1399691
product_variants[].id 1399696, 1399697, 1399698, 1399699, 1399700
```

Not one matches. They are left over from an earlier variant set, and trusting
them would silently show the wrong photograph for a finish — the kind of fault
that looks fine until someone compares the picture to the name. The gallery
matches on **image URL** instead. Worth re-linking the images to the live
variants in Selldone; the storefront will keep working either way.

---

### New photograph, new products (15 Aug)

**Both watches changed to steel rectangles, so every coordinate was re-derived.**
The previous purple-dial pixel search does not apply to a steel case, so the new
positions came from cropping each wrist region and reading the case box off the
crop: man's dial **53.9%, 70.6%**; woman's **77.4%, 63.5%**. Dots sit on the
bracelet below each case, per the mockup.

**The product images match the photograph.** 709761 Molex Rectangular Regent is
a steel square case on a screw-link steel bracelet with a Roman dial and blue
hands — that is the man's watch. 709762 Bonin Petite Classic is the same idiom,
noticeably smaller, on a Panthère-style link bracelet — hers. One correction to
the brief: **neither the photograph nor the product image shows a diamond-set
bezel.** Hers has a polished steel bezel with corner screws. The pairing is
right; the description was slightly off.

**Categories are correct now, and that resolves last round's complaint.** The
new references sit in Men's Classic and Women's Collection respectively, so the
cards no longer both read "Women's Collection". The earlier pair genuinely both
sat in Women's Collection in Selldone — that was shop data, and it is moot now.

#### The crop had to be re-derived, and it does not work below 951px

Two constraints fight: the copy must clear the man, and the woman's wrist at
77.4% must stay in frame. In this photograph the couple sits further left than
in the previous one, so the old 60/68% crops ran the copy straight onto him.

Sweeping object-position at each width:

| Width | Feasible crop |
|---|---|
| 1440 | comfortable |
| 1280 | comfortable |
| 1024 | 43–45% only, after narrowing the copy |
| 901 | a single value, 47% |
| below | **none** |

So the hero stacks below **951px**, not the mockup's 900. The mockup guessed;
this is where the geometry actually fails for this file. Above it, one crop
value serves 951–1199 and the copy narrows in two steps to buy the room.

#### Focus and click were cancelling each other

The brief requires focus to reveal what hover reveals. But a pointer click
focuses the button *before* it fires `click`, so an unconditional focus handler
opened the card and the click handler then toggled it shut — every click was a
no-op. `:focus-visible` separates them: true for keyboard focus, false for
pointer focus. Keyboard opens on focus; mouse toggles on click.

#### Two smaller fixes found by looking

The card inherited `.ink`'s light text colour and rendered nearly invisible on
its own light ground. And the hero-check's negative control was pointed at a
hard-*right* crop, which keeps both wrists in this file and would therefore have
proved nothing — the control reported that about itself on the first run, which
is exactly what it is for. It is hard-left now.

---

### The hero markers — clickable, with the card over the photograph

Superseded the earlier conclusion. The blocker was that a **hover** label needs
empty frame: it appears under a moving cursor, so it must not land on a subject.
A card opened by a deliberate **click** carries no such constraint — which is
the point I had missed. Each watch now has:

- a 44px button whose only visible part is an 8px dot, sitting 2.2% clear of a
  dial measured at 1.14% x 2.34% of the frame, so the control points at the
  product instead of covering it
- a 1px tether from the dot back to the dial it refers to
- a card that opens on click, floats over the photograph, and closes on a second
  click, on Escape, or on a click anywhere else. Only one opens at a time

"Worn above" stays at every width: the whole interaction on touch, and the
fallback if a card ever cannot fit.

#### Two real bugs found while doing it

**The copy layer swallowed every click.** `.hero__media` carries `z-index: 0`,
which opens a stacking context — so the markers' `z-index: 3` was scoped inside
it and sat *below* the copy layer at `z-index: 2`. Playwright reported
`<div class="wrap hero__grid"> intercepts pointer events`. The markers are now a
sibling of `.hero__media`, and `.hero__grid` no longer takes pointer events
except on the copy column itself.

**The card thumbnails were blank.** `loading="lazy"` inside a `visibility:
hidden` card never fetches, so the image only began loading after the card
opened — and often not at all. Dropped the lazy attribute for these two.

#### And one check that had to be made more precise, not less

The hairline tethers are `linear-gradient`s, so `check:hero`'s scrim test — which
looked for the *presence* of a gradient inside `.hero` — started failing. The
easy fix was to stop looking. Instead it now measures the share of the hero each
gradient element covers and fails above 15%, and a second negative control
injects a real full-bleed scrim every run to prove that test can still fire.

---

### The earlier conclusion, kept for the record

You asked for a dot on the watch, a leader line out to empty space, and the
interactive label at the end of that line: man down-left, woman right past her
shoulder. **The man's works. The woman's has nowhere to go.**

I measured the photograph rather than eyeballing it. At her wrist height:

```
x 78-79%   dark (the corridor between the couple)
x 80-95%   continuously lit, mean 36-148 — her arm, her dress, then candlelight
x 96-99%   dark, but object-fit crops it away entirely at 1280 and at 1024
```

Then I searched the whole frame for any 23%×8.5% label box containing no pixel
brighter than 45, at any distance from her dial. Six positions exist, all along
the top edge, ~27% away — and a leader to the nearest of them samples 151, 170,
162, 164, 173 along its path. It runs straight across her head and shoulder.

Down-left into the lower band fails too: every candidate box there contains a
highlight of 206-238, which is the man's cuff or the candle.

So there is **exactly one** clean off-subject label position in this
photograph — (51%, 74%) — and it serves the man's watch.

Your rule for this case was explicit: *"say so rather than cramming it in… drop
hotspots and show the two product cards below, the way mobile already does."*
That is what I did, at every width rather than at some widths, because the
constraint is the photograph and not the viewport. A label on the man alone
would read as a bug on the woman.

**What shipped:** an 8px dot on each watch — marking without covering, which was
your original complaint — non-interactive and `aria-hidden`, with
`pointer-events: none`. Both references appear as ordinary product cards
directly beneath the photograph at every width, captioned "The two references in
the photograph". Accessible by default, no hover, nothing over the couple.

**If you want the leader-line design**, the photograph has to change: the woman
needs empty dark frame beside her, which means either more space at the right of
the composition or her wrist further from her body. It is a shot-list note, not
a CSS one.

#### A real bug this uncovered

The old 44px pins were positioned with CSS percentages on an overlay the size of
the element box. The coordinates are percentages of the *photograph*, and
`object-fit: cover` crops the two apart — so the woman's pin sat **68px off her
wrist at 1024**. It looked right at 1440 by luck of the crop, and `check:hero`
did not catch it because that check does the projection maths itself and
compares against the same numbers, rather than reading where the marker actually
landed. The dots now project image space into box space in JS, and a dot cropped
out of frame is not drawn at all. Verified at 0px offset at 1440, 1280 and 1024.

That is a seventh instance of the same species, and the most instructive one:
the check and the code shared an assumption, so the check could not see the bug.
Only screenshotting and looking found it — which is exactly why you asked for
screenshots.

#### While looking at those screenshots

Adding **Journal** to the header made four nav items where three fitted. Below
~1200px "Haute Horlogerie" and "Client Care" wrapped to two lines and sat hard
against the wordmark. No overflow, no contrast failure — so the 110-state audit
passed while the header read as broken. Tracking and gap tighten from 1340px,
"Client Care" drops from the nav below 1120px (it is in the footer), and
`white-space: nowrap` makes any future crowding visible rather than silent.
Gap to the wordmark is now 56-126px across desktop, with nothing wrapped.

---

### The hero photograph: does the page still read as one thing?

Partly, and no more than that.

The old hero was a product plate on graphite with a soft halo — quiet,
gallery-like, and of a piece with the six collection tiles, the three price
registers and the salon section below it. Those are all *object* photography on
flat ground.

The new hero is a lifestyle photograph with human models, which is a different
genre. It is advertising, and advertising is the register the rest of the site
deliberately avoids — `PLAYBOOK.md` records "gallery, not funnel" as a rule, and
a couple in evening dress is closer to funnel than gallery.

Three things hold it together: the frame is near-black so it shares the graphite
ground; the copy, type and running-seconds detail are unchanged; and the markers
are now 8px dots rather than badges, so nothing shouts. What does not hold: it
is the only photograph on the site containing a person, and the eye goes to a
face rather than to a watch. Scrolling from the hero into the collection grid is
a genre change and you feel it.

My honest read: **the hero is now the best-looking thing on the page and the
least like the rest of it.** If the goal is stopping a shop owner mid-scroll, it
wins. If the goal is the coherent gallery the rest of the site argues for, the
old plate was more correct. I would keep it and add one more photograph of this
kind further down — the salon section is the obvious place — so it reads as a
deliberate second voice rather than a single outlier. I did not do that
unprompted because it changes the design rather than implementing it.

The two product cards now sitting under the photograph help more than I
expected, incidentally: they pull the eye back to objects on flat ground
immediately after the models, which softens the transition into the grid.

---

---

### Variant swatches: kept as colour circles

The rule was to measure, then act. Measured against the live catalogue:

| Measure | Value (re-measured 15 Aug, 66 products) |
|---|---|
| Products total | 66 |
| Products with variants | 37 (56.1%) |
| Products with at least one variant image | **10 (15.2% of all products)** |
| — as a share of products that *have* variants | **27.0%** |

Both figures rose with the two new references and both are still under the 30%
threshold, so the decision stands. It is closer than it was — 27.0% against 30%
on the narrower denominator — so this is worth re-measuring rather than assuming
next time the catalogue grows.

Both readings fall under the 30% threshold, so the swatches stay as colour
circles. The generous denominator was used deliberately: I counted variants with
*any* image, not "distinct" images as the rule says, so the true figure can only
be lower.

The accessibility contract is unchanged — hex as the accessible label, visible
"Finish 2 of 3" ordinal, composite hexes rendered as a 135° split gradient.

Re-run the measurement before revisiting; it is three lines against
`products/all` and the decision follows from it mechanically.

---

### Catalogue and counts

**Counts are now read at runtime rather than written down.** The homepage CTA,
the shop listing header and the mobile drawer all derive from the loaded
catalogue. The only hand-written counts left in the repository are in
`README.md`, which is documentation and cannot read the API.

This is why: the brief asked me to fix every stale number, and the same request
will arrive again the next time the catalogue grows. Making the site compute them
removes the class of problem rather than this instance of it.

**Meta descriptions lost their number** rather than gaining a new one —
`shop.html`'s description now says "every Watchino reference" instead of a total,
because a static `<meta>` cannot be computed and would go stale again.

**The price slider needed no recalibration.** Its bounds were already computed
from `Math.min`/`Math.max` over the live catalogue. The new range is $2,088.90 –
$153,888.90; the old floor of $1,888.90 belonged to a product that is no longer
the cheapest. Nothing was unreachable, but I verified rather than assumed.

**Brand count: six strings, arguably five makers.** The catalogue contains both
`Bonin` (5 products) and `Bonin & Co.` (1). These are almost certainly the same
maker entered two ways. I did **not** normalise them — that is shop data and
merging it is a write I was not asked to make. The README says "six maker names",
which is true of the data as it stands. Worth tidying in the dashboard.

---

### Load more

**24 items, then a button.** Not infinite scroll, per the brief. Two details the
brief did not specify:

- **Filters run over the whole catalogue, always.** Only the number of cards
  painted is paged. A test asserts this by filtering to Haute Horlogerie, whose
  references sit mostly beyond card 24, and checking the count matches the full
  set rather than the loaded page.
- **Changing a filter resets to page 1.** Staying on page 3 of a set the reader
  just narrowed would hide results they had explicitly asked to see. Clicking
  "Load more" moves focus to the first newly-revealed card so the keyboard does
  not jump back to the top.

---

### Account panel

All three bugs fixed as specified. Two choices the brief left open:

**"Create account" is a second control on the same sign-in flow**, not a separate
route. Selldone's OAuth screen handles both, so a distinct link would promise a
different destination and deliver the same one.

**"Selldone" was removed from customer copy but kept in the demo banners.** The
policy pages say "placeholder text in a Selldone demo store" and the honest
answer is that this *is* a Selldone demo — the banner's whole job is to say what
the thing is. The brand rule was about sign-in wording, where a customer is
signing in to Watchino. If you want it gone from the banners too, it is one edit
in `store-pages/*.md`.

---

### Documentation

**`store-pages/BLOG-INSTRUCTION.md` did not exist and now does.** It was asked
for in the previous round and I did not create it — an outright miss on my part,
not a decision. It is committed verbatim as written, plus one appended section
recording the verified platform limitation that publication dates cannot be
backdated.

**`docs/what-this-demonstrates.md` states the catalogue size as sixty-four** and
otherwise avoids numbers, so it ages gracefully.

**The skill file points rather than duplicates.** Everything in it is either a
pointer to `SETUP.md` / `PLAYBOOK.md` / `BLOG-INSTRUCTION.md`, or a
non-negotiable stated inline. Duplicating the documents into the skill would
guarantee they drift apart.

---

### Verification

**Two new checks, both with negative controls in the run.**

`herocheck.mjs` computes where each measured dial lands after `object-fit: cover`
at three widths, and runs the same maths against a knowingly wrong crop
(`object-position: 0%`) every time. That control currently reports the wrists at
102% and 126% — off-frame — which is what proves the check can fail.

`imgsweep.mjs` gained the control it was missing: it injects a 400px image into a
120px box and a `div` declaring `aspect-ratio: 1/1` rendered at 3:1, and **aborts
the whole run** if either assertion fails to notice. A sweep that cannot go red
is worse than no sweep, because it produces confidence.

**The audit could not run against production, and now can.** `_audit.js` is
deliberately excluded from the build so it is not publicly reachable, which meant
`audit-run.mjs` could only ever import it locally — the one place the brief said
not to stop at. It now reads the file from disk and injects the source into the
page instead. Same checks, any deployment, harness still not shipped. Production
is verified at 110/110 on that basis, not on the local run.

**A sixth "check that couldn't fail" nearly shipped during this run.** My
keyboard-order test called `document.body.focus()` to reset focus before tabbing.
`body` is not focusable, so that is a no-op — focus had simply never left the
hotspot under test, and the check reported "reached in 1 tab stop". Reloading the
page instead gives the real answer: 10 stops, after the skip link, nav and header
actions. It is in `PLAYBOOK.md` with the other five.

---

### Things I chose not to do

**Did not merge `Bonin` and `Bonin & Co.`** — shop data, and a write I was not
asked for.

**Did not touch the four blog posts, their images, dates or categories.** As
instructed. The one Selldone write this run was nothing: no writes were made.

**Did not add a second lifestyle photograph** to balance the hero's register,
though I think it is the right answer. It changes the design rather than
implementing it, so it is a recommendation rather than a fait accompli.

**Did not remove the `wiring-check@watchino.invalid` audience record** from the
earlier round — you said you would, and deleting Selldone data was off-limits
this run regardless.

---
