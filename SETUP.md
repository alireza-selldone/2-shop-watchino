# Taking this repo to a new shop

A followable sequence from a fresh clone to a deployed storefront. It assumes no
prior knowledge of this project. Every step that has actually gone wrong here is
called out where it happens, and the [troubleshooting](#troubleshooting) section
at the end collects the ones that cost the most time.

---

## 1. Clone and reset history

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

## 2. Install

```bash
npm install                  # wrangler and playwright, both dev-only
npx playwright install chromium
```

`npm install` pulls no runtime dependencies — the storefront ships as plain
HTML, CSS and ES modules. Playwright is only for the verification suite, and its
browser is a separate one-off download because nothing else in the repo needs it.

## 3. The meta tags

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

## 4. Create the OAuth client

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

### Redirect URIs — the step whose absence costs an afternoon

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

## 5. Set the shop email address

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

## 6. Cloudflare Workers Builds

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

## 7. Custom domain

Add the domain to the Worker (**Settings → Domains & Routes**), then — and this
is the step people forget — **add `https://<that-domain>/callback/` to the OAuth
client's redirect URIs**. Sign-in works on the old domain and fails on the new
one otherwise, which looks like a broken deploy rather than a missing URI.

## 8. Run the verification suite

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

## 9. Catalogue expectations

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

## Troubleshooting

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
