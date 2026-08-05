// Stage 2: animate each Hung Paradise dish image into a looping clip (KIE image-to-video),
// upload to Bunny Stream, and wire video_id/status/thumb onto the menu item.
// Featured items get a slow turntable rotation; the rest get a subtle steam cinemagraph.
// Idempotent: skips items already video_status='ready'. Run:
//   node --env-file=.env.local scripts/demo-menu-videos.mjs
import { createClient } from "@supabase/supabase-js";

const KEY = process.env.KIE_API_KEY;
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const B_LIB = process.env.BUNNY_STREAM_LIBRARY_ID;
const B_KEY = process.env.BUNNY_STREAM_API_KEY;
const B_CDN = process.env.BUNNY_CDN_HOSTNAME;
const B_BASE = "https://video.bunnycdn.com";

const ROTATE = "Cinematic food commercial: the plated dish rotates slowly and smoothly on a turntable, continuous gentle clockwise motion, rising steam and glistening sauce, photorealistic, restaurant lighting, no text, no hands, no cuts.";
const SUBTLE = "Cinemagraph food video: gentle rising steam and a soft glisten moving across the food, an extremely slow subtle push-in, the plate stays centered. Photorealistic, seamless loop, no text, no hands, no cuts.";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const create = async (model, input) => (await fetch("https://api.kie.ai/api/v1/jobs/createTask", { method: "POST", headers: H, body: JSON.stringify({ model, input }) })).json();
const rec = async (id) => (await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${id}`, { headers: H })).json();

async function i2v(imageUrl, featured) {
  const res = await create("bytedance/v1-lite-image-to-video", {
    prompt: featured ? ROTATE : SUBTLE, image_url: imageUrl, duration: "5", resolution: "720p", camera_fixed: !featured,
  });
  if (!res.data?.taskId) throw new Error("i2v create: " + JSON.stringify(res));
  for (let i = 0; i < 60; i++) {
    await sleep(8000);
    const info = await rec(res.data.taskId);
    if (info.data?.state === "success") return JSON.parse(info.data.resultJson).resultUrls[0];
    if (info.data?.state === "fail") throw new Error("i2v fail: " + info.data.failMsg);
  }
  throw new Error("i2v timeout");
}

async function toBunny(mp4Url, title) {
  const bytes = Buffer.from(await (await fetch(mp4Url)).arrayBuffer());
  const c = await fetch(`${B_BASE}/library/${B_LIB}/videos`, { method: "POST", headers: { AccessKey: B_KEY, "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify({ title }) });
  const { guid } = await c.json();
  if (!guid) throw new Error("bunny create failed");
  const up = await fetch(`${B_BASE}/library/${B_LIB}/videos/${guid}`, { method: "PUT", headers: { AccessKey: B_KEY }, body: bytes });
  if (!up.ok) throw new Error("bunny upload HTTP " + up.status);
  // Poll until fully encoded (encodeProgress 100), so play_480p.mp4 exists.
  for (let i = 0; i < 60; i++) {
    await sleep(6000);
    const s = await (await fetch(`${B_BASE}/library/${B_LIB}/videos/${guid}`, { headers: { AccessKey: B_KEY, accept: "application/json" } })).json();
    if (s.status === 5 || s.status === 6) throw new Error("bunny encode failed status " + s.status);
    if (s.encodeProgress === 100 || s.status === 4) return guid;
  }
  throw new Error("bunny encode timeout");
}

async function run() {
  const { data: t } = await svc.from("tenants").select("id").eq("slug", "hungparadise").maybeSingle();
  const { data: items } = await svc.from("menu_items").select("id, name, image_url, is_featured, video_status").eq("tenant_id", t.id);
  const todo = items.filter((i) => i.video_status !== "ready" && i.image_url);
  console.log(`${todo.length} items to animate (${items.length - todo.length} already ready).`);

  const q = [...todo];
  const worker = async () => {
    while (q.length) {
      const it = q.shift();
      try {
        console.log(`… ${it.name} (${it.is_featured ? "rotate" : "subtle"})`);
        const mp4 = await i2v(it.image_url, it.is_featured);
        const guid = await toBunny(mp4, `hungparadise-${it.name}`);
        const thumb = `https://${B_CDN}/${guid}/thumbnail.jpg`;
        const { error } = await svc.from("menu_items").update({ video_id: guid, video_status: "ready", video_thumb_url: thumb }).eq("id", it.id);
        if (error) throw new Error("db: " + error.message);
        console.log(`✓ ${it.name} → ${guid}`);
      } catch (e) {
        console.log(`✗ ${it.name}: ${e.message}`);
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]); // cap 3 concurrent
  // revalidate the public page
  const ready = (await svc.from("menu_items").select("video_status").eq("tenant_id", t.id)).data.filter((r) => r.video_status === "ready").length;
  console.log(`\nDONE. ${ready}/${items.length} items now have ready video.`);
}
run().catch((e) => { console.error("FATAL", e); process.exit(1); });
