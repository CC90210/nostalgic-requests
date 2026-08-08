/**
 * The media route must not become an open proxy to the private bucket.
 *
 * It signs whatever object key it is handed, so without an allowlist
 * `/api/media/lead-documents/<tenant>/<lead>/statement.pdf` would hand out a
 * working link to a merchant bank statement. 4,088 of those live in the private
 * bucket. The allowlist is the only thing between this route and that.
 *
 * Asserted against the route SOURCE rather than a copy, so the test cannot pass
 * while the real file says something else.
 *
 *   node scripts/verify-media-route.mjs
 */
import { readFileSync } from "node:fs";

let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

const src = readFileSync(
  new URL("../app/api/media/[...path]/route.ts", import.meta.url), "utf8");

// Pull the literal allowlist out of the source.
const block = src.match(/const PUBLIC_PREFIXES = new Set\(\[([\s\S]*?)\]\)/);
const allowed = new Set(
  [...(block?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]));

console.log("the allowlist matches what was PUBLIC in Supabase");
// Read from storage.buckets.public on 2026-08-07, not assumed.
const PUBLIC = ["avatars", "tenant-assets", "application-documents",
                "application-screening-reports", "documents", "logos",
                "media", "properties", "property-photos"];
const PRIVATE = ["lead-documents", "chat-attachments", "marketing-media",
                 "merchant-documents"];

for (const b of PUBLIC) check(`allows public bucket ${b}`, allowed.has(b));
for (const b of PRIVATE) {
  check(`REFUSES private bucket ${b}`, !allowed.has(b),
        "this would expose it via a signed URL");
}

console.log("\nthe guard is deny-by-default, not deny-by-list");
check("an unknown bucket is refused",
      !allowed.has("some-future-bucket"),
      "a new bucket must be private until listed");
check("the check is membership on the allowlist",
      /PUBLIC_PREFIXES\.has\(bucket\)/.test(src));
check("refusal happens BEFORE anything is signed",
      src.indexOf("PUBLIC_PREFIXES.has(bucket)") < src.indexOf("createSignedUrl"),
      "signing before the check would leak on the error path");

console.log("\nother properties that matter");
check("a private bucket 404s rather than 403s",
      /not found[\s\S]{0,120}status: 404/.test(
        src.slice(src.indexOf("PUBLIC_PREFIXES.has(bucket)"))),
      "403 confirms the bucket exists");
check("traversal segments are rejected", /s === "\.\."/.test(src));
check("the redirect is 302, not 301",
      /NextResponse\.redirect\([^)]*,\s*302\)/.test(src),
      "301 would let a browser cache an expiring URL as permanent");
check("signed URLs are short-lived",
      /SIGNED_TTL_SEC = (\d+)/.test(src) &&
      Number(src.match(/SIGNED_TTL_SEC = (\d+)/)[1]) <= 900,
      `ttl=${src.match(/SIGNED_TTL_SEC = (\d+)/)?.[1]}s`);
check("response cache is shorter than the signature",
      (() => {
        const ttl = Number(src.match(/SIGNED_TTL_SEC = (\d+)/)?.[1] ?? 0);
        const age = Number(src.match(/max-age=(\d+)/)?.[1] ?? 0);
        return age > 0 && age < ttl;
      })(),
      "a cached redirect must not outlive the URL it points at");

console.log(failures ? `\n${failures} FAILED` : "\nall checks passed");
process.exit(failures ? 1 : 0);
