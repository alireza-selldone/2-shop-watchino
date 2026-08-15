# Working on this codebase

Most of what follows looks like taste. It isn't — each rule is here because the
alternative was tried and produced something worse. Change any of it deliberately
if you like, but change it knowing it was a decision.

---

## The design system

### Tokens are the source of truth

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

### Typefaces

- **Bodoni Moda** for display — Didone lettering, as printed on a watch dial
- **Archivo** for body
- **Azeret Mono** for data, with `tabular-nums` on every price so columns align

Prices render with a wide-looking comma. That is the monospace cell, not a bug.

### Gallery, not funnel

No countdown timers. No urgency banners. No "X people are viewing this". No
discount popups. No exit intent.

Reduced prices appear as a struck-through previous figure in muted grey, **only
on the product page**, never as a badge on a card. A card that shouts SALE is a
different shop from this one.

A discount is only real if its date window is currently open — four references
carried a window that closed in 2024. Reading the raw `discount` field would put
almost the whole catalogue on sale.

### The signature

A fixed **chapter-ring index rail** down the left edge that doubles as scroll
progress, and section dividers made of **minute markers** rather than plain
rules. The page structure literally measures itself.

These are the two things that make the site look like this site. Removing them
leaves a competent generic storefront. Don't.

---

## Engineering rules

### The logarithmic price slider

The catalogue spans $2,089 to $153,889 and is heavily skewed to the low end. On a
**linear** track, 45% of references fall inside the first eighth — the useful
part of the control is a few pixels wide.

The track is logarithmic: `10^(lg(LO) + pos/100 · (lg(HI) − lg(LO)))`. Its
midpoint lands at $17,929 rather than $77,989.

**Bounds are computed from the live catalogue**, never written down. A hardcoded
band makes any product outside it unreachable the moment the shop grows.

### Composite colour variants

Selldone returns a variant colour as a hex — but some are composites like
`#7B1FA2/#D32F2F`. As a raw `background-color` that is invalid CSS and renders
**white**, which reads as a product with no colour.

They render as a hard 135° split gradient. `swatchStyle()` handles both cases;
use it rather than assigning a colour directly.

### Variant swatches are colour circles, for now

Measured against the live catalogue: **12.5%** of products have a variant
carrying its own image (22.9% counting only products that have variants at all).
The threshold for switching to photographs was 30%. Re-measure before changing
this — the measurement is three lines and the decision follows from it.

### Images are contained, never cropped

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

### `.reveal` fails visible

Twelve sections animate in on scroll. They default to `opacity: 1`; the
animation lives behind a `js-reveal` class added **only at the moment the
IntersectionObserver arms**, and elements already on screen are marked revealed
synchronously before the browser paints.

If the script throws, the page is fully readable. An animation that hides content
until JavaScript rescues it is a content-loss bug waiting for a bad deploy.

### Colour is never the only indicator

Variant swatches carry an accessible label plus a visible "Finish 2 of 3"
ordinal. Stock state has words, not just a green dot. Error text has a tone
*and* a sentence.

### The storefront never calls `api.selldone.com`

Customer-facing code talks to `xapi.selldone.com` only. The backoffice host is
for `dashboard/`. This boundary is asserted by the audit.

### No secrets, anywhere

OAuth is a public PKCE client with no secret. The Stripe publishable key is read
at runtime from shop gateway info and appears in no file. If you find yourself
adding a token to a file, something upstream is wrong.

---

## The verification suite

Five scripts under `scripts/`, each runnable against a URL as well as locally.

| Script | Asserts |
|---|---|
| `audit-run.mjs` | 10 checks × every page × 11 widths: contrast, tap targets ≥44px, horizontal overflow, broken images, missing dimensions, console and request errors |
| `imgsweep.mjs` | Containment against the content box, plus aspect-ratio integrity |
| `pagecheck.mjs` | Every footer link resolves to content distinct from the homepage; anchors land clear of the sticky header; token audit |
| `deadctl.mjs` | Every visible button and link is wired, by **observing** listeners |
| `herocheck.mjs` | Both hero hotspots stay inside the cropped frame at three widths; no gradient scrim |

### The rule that matters most

> **A new check must be proven to fail before it is trusted passing.**
> Keep the negative control in the run, not in your memory of having tried it.

`pagecheck.mjs` requests a deliberately unrouted path every time.
`herocheck.mjs` runs its geometry against a knowingly wrong crop every time. If
those controls ever stop reporting a failure, the checks around them have
stopped measuring.

### Why the rule exists

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

## The sign-in callout, and why it is amber

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

## Content rules

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
