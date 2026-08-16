import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

/* Development-only files. They are committed on purpose — _review.html is the
   Phase 4 review record and _audit.js is the harness behind it — but neither
   belongs in a deployed build. */
const DEV_ONLY = /[\\/]_(review\.html|audit\.js|tokens\.html)$/;


await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

await copyDirectory("storefront", ".");
await copyDirectory("dashboard", "dashboard");
await copyDirectory("shared", "shared");
await copyDirectory("callback", "callback");

/* shop.config.json ships beside the pages, not inside the bundle. The same
   built output therefore serves any shop: replacing this one file replaces
   the catalogue, the collections and the brand copy without a rebuild. */
await cp(join(ROOT, "shop.config.json"), join(DIST, "shop.config.json"));
await writeCloudflareFiles();

console.log(`Static build written to ${DIST}`);

async function copyDirectory(from, to) {
  await cp(join(ROOT, from), join(DIST, to), {
    recursive: true,
    filter: (source) =>
      !source.endsWith(".map") &&
      !source.includes(`${from}\\.auth`) &&
      !DEV_ONLY.test(source),
  });
}

async function writeCloudflareFiles() {
  await writeFile(
    join(DIST, "_headers"),
    [
      "/*",
      "  X-Content-Type-Options: nosniff",
      "  Referrer-Policy: strict-origin-when-cross-origin",
      "",
      "/*.html",
      "  Cache-Control: no-store",
      "",
      "/shared/*",
      "  Cache-Control: no-store",
      "",
      "/dashboard/*",
      "  Cache-Control: no-store",
      "",
    ].join("\n"),
    "utf8",
  );
}
