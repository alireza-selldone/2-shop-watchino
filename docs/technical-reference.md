# Technical reference

Architecture notes carried over from the reference project's README, corrected
for Watchino. The root README covers the shop, the catalogue and the design
language; this file covers how the thing is built, configured and shipped.

## Project layout

- `storefront/` - public storefront source served at `/`
- `dashboard/` - dashboard source served at `/dashboard/`
- `callback/` - Selldone OAuth callback page served at `/callback/`
- `shared/` - shared browser modules used by storefront, dashboard, and callback
- `scripts/build-static.mjs` - creates the Workers Static Assets output in `dist/`
- `scripts/dev-static.mjs` - local static file server for development only
- `wrangler.toml` - Cloudflare Workers Static Assets config

## Runtime configuration

Public browser-safe configuration is stored in the `<meta>` tags at the top of:

- `storefront/index.html`
- `dashboard/index.html`
- `callback/index.html`

Do not put secrets in HTML, JavaScript, docs, or examples. This static app must never contain client secrets, API tokens, refresh tokens, MCP credentials, or private Cloudflare tokens.

## Local development

```bash
npm install
npm run dev:static
```

Default local URL:

```text
http://localhost:8788/
```

For port `5173`:

```powershell
$env:STATIC_DEV_PORT="5173"
npm run dev:static
```

Open:

- `http://localhost:5173/`
- `http://localhost:5173/dashboard/`
- `http://localhost:5173/callback/`

## Static build

```bash
npm run build:static
```

The deployable output is written to `dist/`. Do not commit `dist/`; Cloudflare/GitHub builds it from source.

## Cloudflare Workers

Cloudflare Workers Builds settings:

- Build command: `npm run build:static`
- Deploy command: `npx wrangler deploy`
- Non-production branch deploy command: `npx wrangler versions upload`
- Path: `/`
- Production domain: `watchino.selldone.shop`
- OAuth callback URL: `https://watchino.selldone.shop/callback/`
- Also registered on the OAuth client: `https://watchino.myselldone.com/callback/`
  (the Selldone subdomain). Redirect matching is exact, including the trailing slash.

`wrangler.toml` deploys `dist/` with Workers Static Assets as the Worker `watchino`. `/dashboard/` and `/callback/` are real directory index pages, and unknown client routes fall back to the SPA shell.

## API model

- Storefront reads and writes directly to `https://xapi.selldone.com` from the browser.
- Dashboard/backoffice calls go directly to `https://api.selldone.com` from the browser.
- OAuth authorize/token calls use `https://selldone.com/oauth` with public-client PKCE.
- Storefront and dashboard tokens are stored separately in browser localStorage.

## Deploy from GitHub through Cloudflare

Use Cloudflare Workers Builds connected to this GitHub repository. The Cloudflare build form should use:

```text
Project name: watchino
Build command: npm run build:static
Deploy command: npx wrangler deploy
Non-production branch deploy command: npx wrangler versions upload
Path: /
```

See `docs/static-cloudflare-pages.md`.

## Verification tooling

Checks used while building the storefront. They live outside the repo at the
workspace root and need Playwright, which is a devDependency here.

- `audit-run.mjs` - ten-point audit (overflow, 44px tap targets, console and
  network errors, no `api.selldone.com`, broken images, explicit image
  dimensions, palette, card shadows, fonts, AA contrast) across four pages at
  eleven viewport widths.
- `imgsweep.mjs` - asserts no `<img>` exceeds its container's content box, and
  that any box declaring `aspect-ratio` renders at that ratio. Covers all 35
  product pages plus home, shop, cart drawer and checkout.
- `capture.mjs` - screenshot capture, including scroll-linked before/after pairs.

Both checks were validated by running them against a known-broken build first:
a check that has only ever passed proves nothing.
