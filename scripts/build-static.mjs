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
      "/static-storefront-api.js",
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
