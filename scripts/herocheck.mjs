/* Hero verification.

   The constraint that breaks first is the crop: object-fit:cover discards the
   sides, and the woman's wrist sits at 80.7% across, so it leaves the frame
   before anything else does. This computes where each measured dial actually
   lands on screen after cover-cropping, and fails if either is outside the
   visible box or too close to its edge to be usable.

   NEGATIVE CONTROL: the same maths is run against a deliberately wrong
   object-position (0% — hard left). If that does not fail, the check is not
   measuring anything and the run aborts. This exists because five checks in
   this project have "passed" while measuring nothing.

   usage: node scripts/herocheck.mjs [baseUrl]
*/
import { chromium } from "playwright";

const B = (process.argv[2] || "http://localhost:8788").replace(/\/+$/, "");
const SPOTS = [
  { name: "man's wrist", x: 65.4, y: 57.5 },
  { name: "woman's wrist", x: 80.7, y: 54.6 },
];
const EDGE = 1.5; // % of the box a dial must stay clear of the edge by

/* Where does a point at (px,py) in the natural image land inside the element,
   after object-fit:cover with the given object-position? Returns percentages of
   the element box, or null if the point is cropped away. */
function project({ natW, natH, boxW, boxH, posX, posY }, px, py) {
  const scale = Math.max(boxW / natW, boxH / natH);
  const dispW = natW * scale, dispH = natH * scale;
  const offX = (boxW - dispW) * (posX / 100);
  const offY = (boxH - dispH) * (posY / 100);
  const x = offX + (px / 100) * dispW;
  const y = offY + (py / 100) * dispH;
  return { xPct: (x / boxW) * 100, yPct: (y / boxH) * 100 };
}

const b = await chromium.launch();
let fails = 0;
const fail = (m) => { fails++; console.log(`  FAIL  ${m}`); };
const pass = (m) => console.log(`  ok    ${m}`);

console.log("\nHero crop — both wrists must stay in frame");
for (const w of [1440, 1280, 1024]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage();
  await p.goto(B + "/", { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => {
    const i = document.querySelector("[data-hero-img]");
    return i && i.complete && i.naturalWidth > 0;
  }, null, { timeout: 30000 });
  await p.waitForTimeout(250);

  const geo = await p.evaluate(() => {
    const img = document.querySelector("[data-hero-img]");
    const r = img.getBoundingClientRect();
    const cs = getComputedStyle(img);
    const [ox, oy] = cs.objectPosition.split(" ");
    const pc = (v, px) => v.endsWith("%") ? parseFloat(v) : (parseFloat(v) / px) * 100;
    return {
      natW: img.naturalWidth, natH: img.naturalHeight,
      boxW: Math.round(r.width), boxH: Math.round(r.height),
      posX: pc(ox, r.width), posY: pc(oy || "50%", r.height),
      fit: cs.objectFit,
      /* A scrim is a gradient that COVERS the photograph. Presence alone is the
         wrong test: the 1px hairline tethers from each marker back to its dial
         are gradients too, and flagging them would have forced the check to be
         switched off — which is how a check stops meaning anything. Measure the
         share of the hero each gradient element covers instead. */
      scrims: (() => {
        const hero = document.querySelector(".hero").getBoundingClientRect();
        const area = hero.width * hero.height;
        return [...document.querySelectorAll(".hero *")].filter((el) => {
          if (!/gradient/.test(getComputedStyle(el).backgroundImage)) return false;
          const r = el.getBoundingClientRect();
          return (r.width * r.height) / area > 0.15;
        }).length;
      })(),
    };
  });

  console.log(`\n  ${w}px — box ${geo.boxW}x${geo.boxH}, object-fit:${geo.fit}, object-position ${geo.posX}% ${geo.posY}%`);
  for (const s of SPOTS) {
    const r = project(geo, s.x, s.y);
    const inside = r.xPct > EDGE && r.xPct < 100 - EDGE && r.yPct > EDGE && r.yPct < 100 - EDGE;
    const msg = `${s.name.padEnd(14)} lands at ${r.xPct.toFixed(1)}% , ${r.yPct.toFixed(1)}%`;
    inside ? pass(msg) : fail(`${msg} — outside the visible frame`);
  }
  if (geo.scrims) fail(`${geo.scrims} gradient overlay(s) inside .hero — the brief forbids a scrim`);
  else pass("no gradient scrim over the photograph");
  await p.close();
}

/* ---- negative control: the scrim test --------------------------------------
   Inject a real full-bleed gradient and confirm the check reports it. Without
   this, relaxing the rule from "any gradient" to "a gradient covering 15% of the
   hero" could have quietly disabled it — the hairline tethers are gradients too,
   and the easy fix would have been to stop looking. */
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto(B + "/", { waitUntil: "domcontentloaded" });
  await p.waitForSelector(".hero", { timeout: 20000 });
  const caughtScrim = await p.evaluate(() => {
    const hero = document.querySelector(".hero");
    const el = document.createElement("div");
    el.style.cssText = "position:absolute;inset:0;background:linear-gradient(90deg,#000,transparent);";
    hero.appendChild(el);
    const a = hero.getBoundingClientRect();
    const n = [...document.querySelectorAll(".hero *")].filter((x) => {
      if (!/gradient/.test(getComputedStyle(x).backgroundImage)) return false;
      const r = x.getBoundingClientRect();
      return (r.width * r.height) / (a.width * a.height) > 0.15;
    }).length;
    el.remove();
    return n;
  });
  console.log(String.fromCharCode(10) + "Negative control — a real full-bleed scrim");
  if (caughtScrim > 0) pass(`an injected full-bleed gradient IS reported (${caughtScrim}) — the scrim test can fail`);
  else fail("an injected full-bleed scrim was NOT caught; the scrim test proves nothing");
  await p.close();
}

/* ---- negative control ---------------------------------------------------- */
console.log("\nNegative control — the same maths against a knowingly wrong crop");
const bad = { natW: 1672, natH: 941, boxW: 1024, boxH: 900, posX: 0, posY: 50 };
const badResults = SPOTS.map((s) => project(bad, s.x, s.y));
const caught = badResults.some((r) => !(r.xPct > EDGE && r.xPct < 100 - EDGE));
badResults.forEach((r, i) => console.log(`  object-position 0%: ${SPOTS[i].name.padEnd(14)} -> ${r.xPct.toFixed(1)}%`));
if (caught) pass("a hard-left crop IS reported as cropping a wrist — the check can fail");
else { fail("a hard-left crop was NOT caught; this check proves nothing"); }

await b.close();
console.log(fails ? `\n${fails} FAILURE(S)\n` : "\nHero checks passed.\n");
process.exit(fails ? 1 : 0);
