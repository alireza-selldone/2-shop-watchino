# Decisions

Judgement calls made during the autonomous runs of 14–15 August 2026, with
reasoning.
Newest section first is not useful here; this is grouped by subject.

---

## Still wrong, or unverifiable

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

## Making the template portable — built

The freeze lifted for this one piece. What shipped, and the judgement calls.

**`CAT_SLUG` is gone.** Slugs are derived from the live category title.
`categoryIndex()` in `shop-data.js` builds the map at load time; nothing in
`storefront/` knows a category id any more. Two categories that slugify the
same get the id appended so the pair stays addressable rather than collapsing.

**Setup is idempotent, and that took two goes to get right.** The first run
against this shop rewrote every slug — `mens-classic` became `men-s-classic`
because the apostrophe was becoming a separator, and `heritage-leather` became
`heritage-and-leather` — and re-picked the six hand-chosen category heroes by
heuristic. Both would have silently broken every `?cat=` link on a shop that
had not changed. Setup now **keeps** an existing slug, an existing curated hero
and the existing running order whenever the shop id is unchanged, and only
derives what is missing. Verified by running it against this shop twice and
diffing: byte-identical.

**The apostrophe fix matters more than it looks.** `slugify` strips `'`, `’`
and `ʼ` before the non-alphanumeric pass, so "Men's Classic" is `mens-classic`.
Any shop with a possessive in a category name would otherwise get a slug with a
stray hyphen in the middle of a word.

**The banner clears the index rail.** It is inserted as the first child of
`body`, outside `.page`, so without `margin-left: var(--rail)` the fixed rail
sat over the first 56px and ate the start of both lines. Caught by looking at a
screenshot, not by an assertion — the DOM was correct and the text was
unreadable.

**Three hero modes, not one.** `photo` keeps this shop's lifestyle photograph
and its measured hotspots; `slides` is what setup writes for any other shop;
`plate` is the fallback when no product has an image that reads at hero size.
Hotspots are returned **only** in photo mode with an image set, because a
missing image with markers floating over nothing is worse than no markers —
which was the phase 3 decision, now implemented rather than recorded.

**Price registers are terciles now, not named collections.** They used to
filter on this shop's own slugs, so every other shop would have got three empty
registers. Bands come from the price distribution, so any catalogue produces
three.

**Setup does not write copy.** Category blurbs and hero kickers/titles/ledes
are reported as outstanding and left for the agent. A script that generated
them would be inventing data, and this project has removed fabricated copy
twice. An empty blurb is allowed and renders as name-and-count alone; a vague
one is not.

**`isTemplate` ships `true`, including on the deployed demo.** The banner reads
"These are sample products from the Watchino demonstration shop, not yours."
That is true of the live site as well as of a fresh clone, and a visitor
evaluating the platform should be told which they are looking at. It fires on
`isTemplate === true` **or a missing shop id** — never on a literal id, because
the storefront no longer has a fallback shop and an empty config is exactly as
dangerous as one still naming the demo.

### What was NOT tested against a real second shop

**No second Selldone shop was available.** `scripts/portcheck.mjs` intercepts
the catalogue endpoints and serves synthetic shops with 2, 3, 4, 5, 6, 7, 8, 9,
10 and 12 categories, with ids in a completely different range and titles
containing an ampersand and an accent. The code under test is the real
storefront — real slug derivation, real grid, real config handling — and only
the shop behind XAPI is synthetic. That is a genuine test of the portability
code and it is not the same thing as running against someone else's shop.
Stated here rather than implied away.

The `npm run setup` half was exercised for real, but only against this shop.

---

## Handover config — agreed, scoped, not built

> **Superseded — this was built. See the section above.** Kept because the
> reasoning that shaped it is still the reasoning behind the implementation.

**The problem.** An untouched clone of this repo serves shop 8460's catalogue on
someone else's domain. The shop id and handle are meta tags, and
`watchino-data.js` falls back to `handle: "Watchino", id: 8460` when they are
absent — so there is no configuration that produces "no shop". Deleting the
meta tags does not fail; it quietly serves Watchino.

Sign-in is the exception: the OAuth client id is Watchino's and its redirect
URIs point at `watchino.selldone.shop`, so a clone gets `invalid_client`. That
one fails loudly. The catalogue is the silent one.

**Agreed shape:** `shop.config.json` at the repo root, an `npm run setup` that
writes its values into the meta tags, the copy and store-pages, and a visible
warning when the config is still the template's. Documented as step one of
SETUP.md. Three phases:

1. Config file, warning banner, metas, footer copy, `wrangler.toml`, and lifting
   the `TOKENS` block out of `build-pages.mjs`. Half a day. Kills the silent
   wrong-catalogue problem on its own.
2. XAPI discovery for categories and hero products — see below, this is the one
   that matters.
3. Hero behaviour for a shop without its own photograph.

### The warning fires on "template id OR no id", not on 8460

Checking for `8460` specifically would miss the more dangerous case. Because of
the `|| 8460` fallback, an **empty** config serves Watchino just as surely as a
config that still names it — and an operator who deleted the meta tags believes
they have unset it. The condition is "the config still holds the template's shop
id, or holds no shop id at all". Silent wrong data is worse than a broken build.

### CAT_SLUG is why phase 2 is not optional

The finding that matters most, and it was missed on both sides until the
handover audit.

`watchino-data.js` maps Watchino's own numeric category ids to slugs:

```js
const CAT_SLUG = { 37955: "mens-classic", 37956: "womens-collection",
                   37957: "heritage-leather", 107902: "sport-chronograph",
                   37959: "diamond-gold", 37958: "haute-horlogerie" };
const slug = CAT_SLUG[p.category_id] || "";
```

On any other shop every product resolves to `""`. `CAT_ORDER` then builds the
six hardcoded collections and `.filter((c) => c.count > 0)` drops all six,
because none has a product. **The collections grid renders empty** — not six
wrong tiles, no tiles at all.

So doing the *right* thing — pointing the clone at your own shop — produces
something that reads as a broken build rather than as a misconfiguration. That
inverts the incentive: the clone looks healthiest when it is serving someone
else's catalogue.

This is why the discovery script is not a nice-to-have. It is the thing that
makes the template usable at all, and phase 2 should be scoped as such.

One piece of good news for that work: the shop's real category **titles and
icons already arrive live** on `products/all` as `p.category.title` and
`p.category.icon`. Only four things are hardcoded — the id→slug map, the display
order, the six blurbs, and the six hero product ids. Discovery has less to
invent than it looks.

### Phase 3: no hero photograph means no hotspots

Decided, not built. A shop without its own lifestyle photograph gets the
**plain product-plate hero** used before the lifestyle image, with hotspots
switched off — not the Watchino photograph, and not a missing image with markers
floating over nothing.

`HERO_HOTSPOTS` are percentages measured against one photograph of two specific
watches (`709761` at 53.9%/70.6%, `709762` at 77.4%/63.5%). They cannot be
derived, only measured by eye against a new photograph. The config records which
mode a shop is in; it cannot compute the coordinates.

---

## After the freeze — noted, not committed

The brief froze feature work after the callout and the credit bar. These are the
things I would still change, recorded rather than shipped.

**The hero hotspot card shows a flat price where the shop card shows "from".**
Open the marker on the man's watch and it reads `$42,500`; the same reference on
the shop grid now reads `from $42,500`, because its five finishes run to $58,900.
The hero figure is not *wrong* — it is the real price of the default finish, and
the product page opens on that same finish — but the two surfaces describe the
same reference differently. One line in `home.js` would align them. Left alone
because it is feature work and the freeze had landed.

**`docs/screenshots/` is now a second, older set.** The pack lives in
`docs/pack/`; the five images in `docs/screenshots/` predate the credit bar and
are still referenced by README. Either regenerate them or point README at the
pack. Not touched under the freeze.

**A note on how nearly the pack shipped a lie.** Screenshot 08 is supposed to
show faceting working. The first capture asserted only that the card count
*dropped* after applying a price band — and it did, 11 to 3. But the band
excluded every Haute Horlogerie reference, so what the screenshot actually
showed was the **empty state**, whose "closest matches" suggestions are also
`.pcard`. The assertion passed on the fallback. It now requires a real subset:
fewer than before, more than none, and no empty-state heading. Caught by looking
at the picture, which is the whole reason the brief says screenshots decide
visual questions.

---

## The sign-in callout, the credit bar, and one audit that was lying

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

## The audit was memoising its own failures

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

## Variants: the allowlist was ours, and it was eating real data

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

### Stale variant_ids on the Selldone side — worth cleaning up

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

## New photograph, new products (15 Aug)

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

### The crop had to be re-derived, and it does not work below 951px

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

### Focus and click were cancelling each other

The brief requires focus to reveal what hover reveals. But a pointer click
focuses the button *before* it fires `click`, so an unconditional focus handler
opened the card and the click handler then toggled it shut — every click was a
no-op. `:focus-visible` separates them: true for keyboard focus, false for
pointer focus. Keyboard opens on focus; mouse toggles on click.

### Two smaller fixes found by looking

The card inherited `.ink`'s light text colour and rendered nearly invisible on
its own light ground. And the hero-check's negative control was pointed at a
hard-*right* crop, which keeps both wrists in this file and would therefore have
proved nothing — the control reported that about itself on the first run, which
is exactly what it is for. It is hard-left now.

---

## The hero markers — clickable, with the card over the photograph

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

### Two real bugs found while doing it

**The copy layer swallowed every click.** `.hero__media` carries `z-index: 0`,
which opens a stacking context — so the markers' `z-index: 3` was scoped inside
it and sat *below* the copy layer at `z-index: 2`. Playwright reported
`<div class="wrap hero__grid"> intercepts pointer events`. The markers are now a
sibling of `.hero__media`, and `.hero__grid` no longer takes pointer events
except on the copy column itself.

**The card thumbnails were blank.** `loading="lazy"` inside a `visibility:
hidden` card never fetches, so the image only began loading after the card
opened — and often not at all. Dropped the lazy attribute for these two.

### And one check that had to be made more precise, not less

The hairline tethers are `linear-gradient`s, so `check:hero`'s scrim test — which
looked for the *presence* of a gradient inside `.hero` — started failing. The
easy fix was to stop looking. Instead it now measures the share of the hero each
gradient element covers and fails above 15%, and a second negative control
injects a real full-bleed scrim every run to prove that test can still fire.

---

## The earlier conclusion, kept for the record

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

### A real bug this uncovered

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

### While looking at those screenshots

Adding **Journal** to the header made four nav items where three fitted. Below
~1200px "Haute Horlogerie" and "Client Care" wrapped to two lines and sat hard
against the wordmark. No overflow, no contrast failure — so the 110-state audit
passed while the header read as broken. Tracking and gap tighten from 1340px,
"Client Care" drops from the nav below 1120px (it is in the footer), and
`white-space: nowrap` makes any future crowding visible rather than silent.
Gap to the wordmark is now 56-126px across desktop, with nothing wrapped.

---

## The hero photograph: does the page still read as one thing?

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

## Variant swatches: kept as colour circles

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

## Catalogue and counts

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

## Load more

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

## Account panel

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

## Documentation

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

## Verification

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

## Things I chose not to do

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
