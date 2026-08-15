# Platform gaps

Everything below was hit while building Watchino, a real storefront on a real
shop. Each item is stated as found, with the evidence that established it.
Nothing here is a complaint and nothing here is speculative — where a cause is
unknown, it says so.

Ordered roughly by how much time each one cost.

---

## 1. Blog articles have no writable publication date

**What happens.** `created_at` is ignored by the article upsert — sending it
changes nothing. `schedule_at` looks like the alternative, but a past
`schedule_at` fires immediately, clears itself, and **resets `created_at` to the
moment it fired**.

**How it was found.** Attempting to backdate four posts to their intended
publication dates. The write appeared to succeed; the dates did not move.

**What it cost.** The four posts' `created_at` moved from 09:08 to 10:15 — an
hour of real publication timestamps, destroyed by a write that looked safe. That
is the origin of this project's "additive only, never touch the blog again" rule.

**Consequence for a storefront.** An imported archive cannot preserve its
original publication dates. Watchino reads `created_at` and displays it
truthfully rather than hiding a date it cannot control.

---

## 2. Variants carry a colour hex but no colour name

**What happens.** A variant row has `color: "#B76E79"`. There is no `name`,
`title` or `label` field on it, nor on the `variants` summary array, nor
anywhere else in the product payload.

**How it was found.** Searching the full payload for any name-like field on
every product that has variants. Selldone's own storefront generates strings
like "Dark purple" from the hex **at render time** — the name is never stored.

**Consequence for a storefront.** An accessible label for a colour swatch has to
be either the raw hex or a hex-to-name mapping invented by the storefront.
Watchino uses the hex, plus a visible "Finish 2 of 5" ordinal so colour is never
the only indicator. A shipped hex-to-name table would be fabricated data that
drifts from whatever Selldone renders.

**What would fix it.** An optional `name` on the variant row, authored by the
shop owner.

---

## 3. `variant_id` on gallery images can go stale against the live variant set

**What happens.** `images[]` carries a `variant_id` intended to link a photograph
to a variant. On product 709761 those ids point at a variant set that no longer
exists:

```
images[].variant_id     1399688, 1399689, 1399690, 1399691
product_variants[].id   1399696, 1399697, 1399698, 1399699, 1399700
```

Not one matches. Editing the variants left the image links pointing at the
deleted rows, and nothing flagged it.

**Consequence for a storefront.** Trusting `variant_id` silently shows the wrong
photograph for a finish — a fault that looks fine until someone compares the
picture to the name. Watchino matches gallery images to variants on **image
URL** instead. The stale ids are still there on the Selldone side.

**What would fix it.** Re-point or null the image links when a variant is
deleted.

---

## 4. `?extra=true` on the blog list returns categories but an empty articles array

**What happens.** The parameter is documented as returning extra data. It does
return the category list — and an `articles` array with zero entries, where the
same call without it returns the articles.

**Consequence.** A caller who adds `extra=true` to get categories in one request
loses the articles and has to make two calls anyway.

---

## 5. The single-article endpoint takes `parent_id`, not the article id

**What happens.** The blog detail route's `{blog_id}` segment is the article's
`parent_id`. Passing the article's own id returns "Blog not found".

**How it was found.** By testing the registry's documented route against a known
article, not by reading. The naming gives no hint.

**Consequence.** A storefront rendering one article per URL has to carry the
parent id through, or fall back to fetching the list and filtering — which is
what Watchino does, at the cost of an N+1 when detail fields are needed.

---

## 6. Customer sign-in silently redirects to Selldone until a shop email is set

**What happens.** Direct customer sign-in requires the shop owner to have set an
email address under **Store dashboard → Settings → Email**. Until then, a
customer who taps *Sign in* is sent to Selldone and asked to create an account
**on Selldone** — they end up with a Selldone account, not a session on the shop.

**Why it is a gap rather than a setting.** Nothing surfaces the prerequisite. The
OAuth client can be correctly configured, the redirect URIs correct, the scopes
granted, and sign-in still behaves this way with no error, no warning, and no
field marked required. It is shop-level, so no storefront code can detect or work
around it.

**On shop 8460 as of 15 August 2026:** `info.email` is set to `info@watchino.com`
and `mail_service` is `null`. `login_modes` includes `email`. The behaviour
matches an unconfigured mail service rather than a missing contact address, but
the dashboard does not distinguish the two states to the shop owner.

**Consequence.** Watchino ships an amber callout under the Sign in button naming
the setting, because the alternative is every person cloning this repo losing an
afternoon to it.

**What would fix it.** Flag the prerequisite in the dashboard where sign-in is
configured, or return a distinguishable error the storefront can render.

---

## 7. The shop's own article content did not match its products

**What happens.** The four articles seeded on the shop were about unrelated
subjects — they did not reference the catalogue they sat beside.

**Consequence.** Not a platform defect so much as a demo-data one, but it matters
for anyone evaluating: the sample content does not demonstrate the join between
blog and catalogue, so a storefront has to either write new content or show the
mismatch. Watchino shows the shop's real posts as they are.

---

## 8. Two spellings of the same maker exist in product data

**What happens.** `Bonin` and `Bonin & Co.` both appear as maker strings across
the catalogue, and the shop's own filter config lists only `Bonin & Co.` and
`Rexin` — neither matching the six distinct maker strings actually present on
products.

**Consequence.** A brand facet built from product data and one built from the
shop's filter config disagree. Watchino derives brands from the products, and
reports six strings for five real makers rather than silently merging them —
merging would be the storefront inventing an equivalence the data does not state.

---

## 9. `products/list` rejects `limit` above its cap without saying so

**What happens.** Requesting `limit=300` returns 404, not a 422 or a clamped
page. The response does not name the parameter or the cap.

**Consequence.** Easy to misread as "the endpoint is down" — it was, here, for
about twenty minutes.

---

## 10. XAPI throttling is silent at the storefront

**What happens.** Under sustained automated load (a verification matrix hitting
88 page loads, each making two XAPI calls), catalogue requests begin failing.
The page renders with an empty catalogue and **no console error** — the fetch
resolves, the data is empty, the grid is blank.

**Consequence.** A storefront cannot distinguish "throttled" from "shop has no
products". Watchino's audit caches the catalogue partly for speed and partly so
the matrix measures layout against identical data rather than against whatever
the shop returned that minute.

**What would fix it.** A distinguishable status on throttle.

---

## 11. The shop-level variant asset library is empty and unused

**What happens.** `product_variant_asset_list` returns zero assets for shop 8460,
while 37 products carry variants and 10 carry per-variant images. The asset
mechanism exists but is not what variant images actually use.

**Consequence.** A storefront reading the asset library to build swatches finds
nothing and concludes the shop has no variant imagery, which is wrong. The images
live on the variant rows themselves.

---

## Not gaps, but worth knowing

- **`variants` and `product_variants` are different arrays.** The first is a
  seven-field distinct-values summary; the second is the full rows with id, sku,
  price, quantity, image and a `pricing` flag. Only the second can price a
  variant. `products/list` already carries both — no extra request is needed.
- **`pricing: true/false`** decides whether a variant overrides the product
  price. A variant with `pricing: false` and a non-zero `price` is not a price.
- **Catalogue routes take `@handle`; audience capture takes the numeric shop id.**
  The two are not interchangeable and the error does not say which is wanted.
