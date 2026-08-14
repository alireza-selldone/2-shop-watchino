import { chromium } from "playwright";
/* Base URL is argv[2], so this runs against a preview or the live site
   as well as the local dev server: node scripts/audit-run.mjs https://… */

const BASE = (process.argv[2] || "http://localhost:8788").replace(/\/+$/, "");
const PAGES=[["home","/","#catgrid .cat"],["shop","/shop.html","#pgrid .pcard"],
             ["product","/product.html?id=709403","#pdp h1"],["checkout","/checkout.html","#sumrows .sum__row"],
             ["about","/about-us",".prose h2"],["terms","/terms",".prose h2"],
             ["privacy","/privacy",".prose h2"],["contact","/contact-us",".prose h2"],
             ["blog","/blog",".post"],["article","/article.html?id=31528","[data-article-body] p"]];
const WIDTHS=[1440,1024,1000,950,900,860,850,820,800,768,390];
const BAG=JSON.stringify([{id:709403,qty:1},{id:325648,qty:2}]);
const b=await chromium.launch();
let allPass=true; const rows=[];

/* Each BrowserContext starts with an empty HTTP cache, so every third-party
   response was refetched for all eleven widths and the run crawled — over an
   hour. Two offenders: the four Google Font families, and the catalogue, since
   each of the 88 page loads calls XAPI twice and Selldone throttles ~176
   requests in a few minutes. Both are replayed from an in-process cache.

   Caching the catalogue also makes the matrix deterministic: the first request
   is real, and every width afterwards measures layout against identical data
   rather than against whatever the shop returned that minute. */
const fontCache=new Map();
async function cacheThirdParty(ctx){
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|xapi\.selldone\.com/,async(route)=>{
    const url=route.request().url();
    if(!fontCache.has(url)){
      const res=await route.fetch();
      const headers={...res.headers()};
      // body() is already decoded; leaving these would describe it wrongly.
      delete headers["content-encoding"]; delete headers["content-length"];
      fontCache.set(url,{status:res.status(),headers,body:await res.body()});
    }
    await route.fulfill(fontCache.get(url));
  });
}

for(const w of WIDTHS){
  // one context per width, so no scroll/localStorage state leaks between them
  const ctx=await b.newContext({viewport:{width:w,height:w===390?844:w===768?1024:900}});
  await cacheThirdParty(ctx);
  await ctx.addInitScript(v=>localStorage.setItem("watchino_bag_v1",v),BAG);
  for(const [name,url,ready] of PAGES){
    const p=await ctx.newPage();
    const errs=[]; p.on("console",m=>{if(m.type()==="error")errs.push(m.text());});
    p.on("requestfailed",r=>errs.push("REQFAIL "+r.url()));
    await p.goto(BASE+url,{waitUntil:"domcontentloaded"});
    await p.waitForSelector(ready,{timeout:20000,state:"attached"});
    // networkidle can never settle if a third-party font/XAPI socket lingers;
    // it defaults to 30s per page, which wedges an 88-state matrix.
    await p.waitForLoadState("networkidle",{timeout:6000}).catch(()=>{});
    await p.evaluate(async()=>{const s=Math.round(innerHeight*.6);
      for(let y=0;y<document.documentElement.scrollHeight;y+=s){scrollTo(0,y);await new Promise(r=>setTimeout(r,110));}
      scrollTo(0,0);await new Promise(r=>setTimeout(r,300));});
    await p.waitForTimeout(300);
    const r=await p.evaluate(async()=>(await import("/_audit.js?v=pw2")).audit());
    if(errs.length) r.failures.push({check:"console-or-request-error",detail:errs.slice(0,3)});
    r.pass=r.failures.length===0;
    if(!r.pass) allPass=false;
    const row=`${name.padEnd(9)} ${String(w).padStart(5)}  ${r.pass?"pass":"FAIL "+JSON.stringify(r.failures).slice(0,180)}`;
    rows.push(row); console.log("  "+row);  // stream, so a stall is visible where it happens
    await p.close();
  }
  await ctx.close();
}
await b.close();
const fails=rows.filter(r=>r.includes("FAIL")).length;
// Count the rows actually run. This said "ALL 44 PASS" from when the matrix was
// four pages, and kept saying it after it grew to eight.
console.log(allPass?`\nALL ${rows.length} PASS`:`\n${fails} FAILURE(S) of ${rows.length}`);
process.exit(allPass?0:1);
