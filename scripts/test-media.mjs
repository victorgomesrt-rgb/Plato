// Verifies the M4 external media integrations end-to-end (no UI/auth needed):
//   1. Image: sharp applies EXIF orientation, strips metadata, outputs WebP.
//   2. Bunny: create → status → delete a video with the real credentials.
// Run: node --env-file=.env.local scripts/test-media.mjs
import sharp from "sharp";

let pass = true;
const ok = (label, cond, extra = "") => {
  console.log(`${cond ? "PASS ✓" : "FAIL ✗"}  ${label}${extra ? "  (" + extra + ")" : ""}`);
  if (!cond) pass = false;
};

/* 1. Image pipeline */
try {
  // 1200x600 JPEG tagged orientation 6 (90° rotation) with EXIF.
  const src = await sharp({ create: { width: 1200, height: 600, channels: 3, background: { r: 210, g: 90, b: 30 } } })
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();
  const out = await sharp(src)
    .rotate() // applies EXIF orientation
    .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const meta = await sharp(out).metadata();
  ok("image converts to WebP", meta.format === "webp", meta.format);
  ok("EXIF orientation applied (1200x600 → 600x1200)", meta.width === 600 && meta.height === 1200, `${meta.width}x${meta.height}`);
  ok("EXIF stripped from output", meta.orientation === undefined && !meta.exif);
} catch (e) {
  ok("image pipeline ran", false, e.message);
}

/* 2. Bunny Stream */
const lib = process.env.BUNNY_STREAM_LIBRARY_ID;
const key = process.env.BUNNY_STREAM_API_KEY;
const cdn = process.env.BUNNY_CDN_HOSTNAME;
const base = "https://video.bunnycdn.com";
try {
  const c = await fetch(`${base}/library/${lib}/videos`, {
    method: "POST",
    headers: { AccessKey: key, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ title: "plato-connectivity-test" }),
  });
  ok("Bunny create video", c.ok, `HTTP ${c.status}`);
  const v = await c.json();
  const guid = v.guid;
  ok("Bunny returned a guid", !!guid);

  const s = await fetch(`${base}/library/${lib}/videos/${guid}`, {
    headers: { AccessKey: key, accept: "application/json" },
  });
  const sj = await s.json();
  ok("Bunny status reachable", s.ok, `status=${sj.status}`);
  console.log(`      poster would be: https://${cdn}/${guid}/thumbnail.jpg`);

  const d = await fetch(`${base}/library/${lib}/videos/${guid}`, { method: "DELETE", headers: { AccessKey: key } });
  ok("Bunny delete (cleanup)", d.ok, `HTTP ${d.status}`);
} catch (e) {
  ok("Bunny calls ran", false, e.message);
}

process.exitCode = pass ? 0 : 1;
