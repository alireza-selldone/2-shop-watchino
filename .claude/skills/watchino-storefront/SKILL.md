---
name: watchino-storefront
description: Work on a Selldone storefront built from the Watchino template — setting one up on a new shop, redesigning it, adding products, pages or blog content, running its verification suite, or deploying it to Cloudflare Workers. Use when the repo contains SETUP.md, PLAYBOOK.md and a storefront/ directory reading from xapi.selldone.com.
---

# Watchino storefront

A static, framework-free Selldone storefront: plain HTML, CSS and ES modules,
deployed to Cloudflare Workers, reading everything live from XAPI.

## Read these rather than guessing

| Task | Document |
|---|---|
| Point this repo at a new shop, meta tags, OAuth client, Workers Builds, custom domain | `SETUP.md` |
| Design tokens, engineering rules, the verification suite, why each decision was made | `PLAYBOOK.md` |
| Blog content on a new shop | `store-pages/BLOG-INSTRUCTION.md` |
| What was decided during the last build and why | `DECISIONS.md` |
| Architecture, OAuth flow, API boundaries | `docs/technical-reference.md` |
| Explaining the shop to a non-technical customer | `docs/what-this-demonstrates.md` |

Do not duplicate their contents into a reply. Read the relevant one and follow it.

## Non-negotiables

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

## The verification suite

```bash
npm run dev:static          # then, in a second terminal:
npm run check               # audit · images · pages · controls · hero
```

Each script also accepts a base URL, so the same checks run against a
deployment. **Run them against production after deploying**, not only locally —
that distinction has caught real bugs twice.

## Deploying

Push to `main`; Cloudflare Workers Builds builds and publishes. Do not run
`wrangler deploy` locally — some networks get bot-challenged by Cloudflare's API
and the failure looks exactly like an expired token.
