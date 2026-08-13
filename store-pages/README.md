# Store pages

Starting content for the four pages Selldone provides on every shop:

| File | Page |
|---|---|
| `about-us.md` | `/about-us` |
| `terms.md` | `/terms` |
| `privacy.md` | `/privacy` |
| `contact-us.md` | `/contact-us` |

These files keep their `{{PLACEHOLDER}}` tokens on purpose. They travel with the
repository so the next shop built from it starts with content rather than four
blank pages. Fill the tokens in, do not edit them out of the source files.

## Not legal advice

**Terms and Privacy here are a reasonable starting point, not reviewed legal
documents.** Nobody with a legal qualification has read them. They are written
to be plain and sensible, and they are structured the way a real policy is
structured, but they have not been checked against the law of any jurisdiction.

Before a shop takes real money from real customers, someone qualified should
read both. Consumer law, distance-selling rules, statutory return periods,
warranty obligations and data-protection duties all vary by country, and several
clauses here assert positions — governing law, liability limits, the returns
window — that only a lawyer should confirm.

The same applies to the Privacy Policy. It describes an honest, conventional set
of practices, but "we describe it accurately" and "it complies with GDPR, UK
GDPR, CCPA or anything else" are different claims, and only the first is made.

## The demo banner

Every page opens with a yellow banner marking it as demonstration content.

**Do not remove it from a demo shop.** It is what separates a demonstration from
a false claim: without it, invented policies read as real commitments from a real
business. Remove it only as part of replacing the content with policies that a
real business actually stands behind.

## Tokens

| Token | Watchino value |
|---|---|
| `{{SHOP_NAME}}` | Watchino |
| `{{SHOP_DOMAIN}}` | watchino.selldone.shop |
| `{{FOUNDED_YEAR}}` | 1946 |
| `{{COUNTRY}}` | Switzerland |
| `{{CURRENCY}}` | USD |
| `{{LAST_UPDATED}}` | 13 August 2026 |
| `{{RETURN_DAYS}}` | 30 |
| `{{REFUND_DAYS}}` | 14 |
| `{{DAMAGE_WINDOW}}` | 7 |
| `{{RECORD_YEARS}}` | 10 |
| `{{SUPPORT_RETENTION}}` | 3 |
| `{{LOG_RETENTION}}` | 90 |
| `{{RESPONSE_DAYS}}` | 30 |
| `{{OPENING_HOURS}}` | Mon–Fri, 09:00–17:00 CET |

### Deliberately left unfilled

`{{SHOP_EMAIL}}` · `{{SHOP_PHONE}}` · `{{SHOP_ADDRESS}}` · `{{COMPANY_REGISTRATION}}`

Watchino is a demonstration shop with no real contact details. A visible
placeholder is better than an invented address: an invented one looks like a
fact and cannot be distinguished from a real one by anybody reading the page.

Note that the Selldone shop record does carry contact values
(`shop.info.address`, `.phone`, `.email`), but they are demo seed data —
a Los Angeles address and a US phone number on a shop whose stated country is
Switzerland — so they are not used here.

## Anchors

`terms.md` carries three anchor ids so the footer can link to a section instead
of dropping the reader at the top of a long document:

- `#delivery` — section 6, Delivery
- `#returns` — section 7, Returns and cancellation
- `#warranty` — section 8, Faulty items and warranty

These are written as raw `<h2 id="…">` rather than Markdown headings, because
Markdown has no syntax for an id and the renderer does not generate them.
