# Decisions

Judgement calls made during the autonomous run of 14 August 2026, with reasoning.
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

**2. The hero photograph is a different register from the rest of the site.**
Covered in its own section below. It is not a bug, but it is the thing most
likely to make you say "no, put it back".

---

## The hero

**Kept the photograph, no scrim.** The image's left ~40% is genuinely near-black,
measured rather than assumed, so the copy sits on it unaided. `herocheck.mjs`
fails the build if any gradient appears inside `.hero`, because a scrim would be
a symptom of a bad crop rather than a fix for one.

**Hotspot coordinates were measured, not taken from the brief.** The purple dials
are the only strongly purple pixels in an otherwise black-and-warm frame, so
locating them was a pixel search: man **65.4%, 57.5%**; woman **80.7%, 54.6%**.
Your estimates (66/57, 81/54) were within a percent — I used the measured values
because the check depends on them being right.

**`object-position` steps across three breakpoints** — 60% at ≥1440, 68% at
≥1024, 72% below. The woman's wrist at 80.7% is the constraint: as the viewport
narrows, `cover` crops the sides and hers leaves first. At 1024 it sits at 88% of
the frame, still inside with room. This is the thing that will break if the image
is ever swapped, which is why `check:hero` exists and runs at all three widths.

**Mobile drops the hotspots entirely**, as instructed, and shows the same two
references as ordinary cards under a 4:5 crop. Nothing clever was attempted.

**The register question, honestly.** The old hero was a product plate on
graphite with a soft halo: quiet, gallery-like, and of a piece with the six
collection tiles, the three price registers and the salon section below it. Those
are all *object* photography on flat ground.

The new hero is a **lifestyle photograph with human models**, which is a
different genre — it is advertising, and advertising is a register the rest of
the site deliberately avoids. `PLAYBOOK.md` records "gallery, not funnel" as a
rule, and a couple in evening dress is closer to funnel than gallery.

Does the page still read as one thing? **Partly.** Three things hold it together:
the frame is near-black so it shares the graphite ground; the copy, type and
running-seconds detail are unchanged; and the hotspots are quiet, which keeps it
from feeling like a banner ad. What does *not* hold: it is the only photograph on
the site with a person in it, and the eye now goes to a face rather than to a
watch. Scrolling from the hero into the collection grid is a genre change, and
you feel it.

My honest read: **the hero is now the best-looking thing on the page and the
least like the rest of it.** If the goal is a demo that stops a shop owner
scrolling, it wins. If the goal is the coherent gallery the rest of the site
argues for, the old plate was more correct. I would keep it and bring one more
photograph of this kind further down the page — the salon section is the obvious
place — so it reads as a deliberate second voice rather than a single outlier.
I did not do that unprompted because it is a design decision, not a fix.

---

## Variant swatches: kept as colour circles

The rule was to measure, then act. Measured against the live catalogue:

| Measure | Value |
|---|---|
| Products total | 64 |
| Products with variants | 35 (54.7%) |
| Products with at least one variant image | **8 (12.5% of all products)** |
| — as a share of products that *have* variants | **22.9%** |

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
