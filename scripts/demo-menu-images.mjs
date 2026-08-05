// Stage 1 of the Hung Paradise demo refresh: rebuild the menu as Chinese/Cantonese
// (the real cuisine) and generate a professional food image per dish via KIE nano-banana,
// upload each to Supabase item-images, and set name/description/price/featured/image_url.
// Stage 2 (demo-menu-videos.mjs) animates these into looping clips.
// Run: node --env-file=.env.local scripts/demo-menu-images.mjs
import { createClient } from "@supabase/supabase-js";

const KEY = process.env.KIE_API_KEY;
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Ordered to match the existing rows: Starters(3), Mains(4), Drinks(2), Desserts(2).
const P = "Professional food photography of";
const TAIL = "clean dark restaurant table, warm cinematic lighting, shallow depth of field, high detail, appetizing, no text";
const DISHES = [
  { name: "Crispy Spring Rolls", price: 9, featured: false, desc: "Golden, crisp, and stuffed with vegetables. Served with sweet chili.",
    img: `${P} golden crispy Chinese spring rolls stacked on a black slate plate with a small dish of sweet chili sauce, garnished with cilantro, 45-degree angle, ${TAIL}` },
  { name: "Hot & Sour Soup", price: 8, featured: false, desc: "The classic: tofu, mushroom, and egg ribbons in a peppery broth.",
    img: `${P} a steaming bowl of Chinese hot and sour soup, dark broth with tofu, mushrooms, egg ribbons and scallions, white ceramic bowl, overhead 30-degree angle, visible steam, ${TAIL}` },
  { name: "Salt & Pepper Squid", price: 13, featured: true, desc: "Wok-crisped calamari with chili, garlic, and scallion.",
    img: `${P} crispy salt and pepper squid calamari with fried red chili and scallions on a dark ceramic plate, 45-degree angle, ${TAIL}` },
  { name: "Sweet & Sour Chicken", price: 19, featured: true, desc: "Crispy chicken, peppers, and pineapple in a glossy sweet-and-sour glaze.",
    reuse: "/private/tmp/claude-501/-Users-victorgomes-Desktop-PLATO/98e285b3-46a3-414c-a1bd-27cf122a4517/scratchpad/dish_test.png" },
  { name: "Hunan Beef", price: 24, featured: true, desc: "Tender beef with fresh chili and scallion in a bold Hunan sauce.",
    img: `${P} Hunan beef stir-fry, sliced beef with red and green chili peppers and scallions in a glossy sauce, dark ceramic plate, 45-degree angle, ${TAIL}` },
  { name: "Black Pepper Beef Tenderloin", price: 27, featured: true, desc: "Sizzling tenderloin, onions, and peppers in cracked black pepper sauce.",
    img: `${P} sizzling Chinese black pepper beef tenderloin cubes with onions and bell peppers in a glossy black pepper sauce on a cast iron plate, dramatic warm lighting, steam, 45-degree angle, ${TAIL}` },
  { name: "Yang Chow Fried Rice", price: 16, featured: false, desc: "Shrimp, char siu, egg, and peas, wok-tossed the Cantonese way.",
    img: `${P} Yang Chow special fried rice with shrimp, char siu pork, egg, peas and scallions in a dark bowl, overhead 45-degree angle, ${TAIL}` },
  { name: "Lychee Mojito", price: 12, featured: true, desc: "Fresh lychee, mint, and lime over crushed ice.",
    img: `${P} a tall lychee mojito cocktail with mint leaves, lychee fruit and crushed ice in a highball glass with condensation, clean dark bar top, side angle, bright fresh lighting, shallow depth of field, no text` },
  { name: "Jasmine Green Tea", price: 4, featured: false, desc: "Fragrant loose-leaf jasmine, steeped fresh.",
    img: `${P} Chinese jasmine green tea in a clear glass teapot and cup with jasmine flowers, steam rising, clean dark table, warm soft lighting, shallow depth of field, no text` },
  { name: "Fried Banana with Honey", price: 8, featured: false, desc: "Warm banana fritters, honey, and toasted sesame.",
    img: `${P} Chinese fried banana fritters drizzled with honey and sesame seeds, dusted with powdered sugar, white plate, 45-degree angle, ${TAIL}` },
  { name: "Mango Pudding", price: 7, featured: false, desc: "Silky Cantonese mango pudding with fresh mango.",
    img: `${P} Cantonese mango pudding in a glass cup topped with fresh mango cubes and mint, clean dark table, side angle, soft bright lighting, shallow depth of field, no text` },
];

const create = async (model, input) => (await fetch("https://api.kie.ai/api/v1/jobs/createTask", { method: "POST", headers: H, body: JSON.stringify({ model, input }) })).json();
const rec = async (id) => (await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${id}`, { headers: H })).json();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function genImage(prompt) {
  const res = await create("google/nano-banana", { prompt, image_size: "3:4" });
  if (!res.data?.taskId) throw new Error("T2I create failed: " + JSON.stringify(res));
  for (let i = 0; i < 30; i++) {
    await sleep(5000);
    const info = await rec(res.data.taskId);
    if (info.data?.state === "success") return JSON.parse(info.data.resultJson).resultUrls[0];
    if (info.data?.state === "fail") throw new Error("T2I fail: " + info.data.failMsg);
  }
  throw new Error("T2I timeout");
}

async function run() {
  const { data: tenant } = await svc.from("tenants").select("id").eq("slug", "hungparadise").maybeSingle();
  const tid = tenant.id;
  const { data: cats } = await svc.from("menu_categories").select("id, sort_order").eq("tenant_id", tid).order("sort_order");
  const { data: items } = await svc.from("menu_items").select("id, category_id, sort_order").eq("tenant_id", tid);
  const catOrder = new Map(cats.map((c, i) => [c.id, i]));
  const ordered = items.sort((a, b) => (catOrder.get(a.category_id) - catOrder.get(b.category_id)) || (a.sort_order - b.sort_order));
  if (ordered.length !== DISHES.length) throw new Error(`item count ${ordered.length} != dishes ${DISHES.length}`);

  // Concurrency-limited image gen + upload + DB update.
  const results = [];
  const q = ordered.map((row, i) => ({ row, dish: DISHES[i] }));
  const worker = async () => {
    while (q.length) {
      const { row, dish } = q.shift();
      try {
        let buf;
        if (dish.reuse) {
          const { readFileSync } = await import("node:fs");
          buf = readFileSync(dish.reuse);
        } else {
          const url = await genImage(dish.img);
          buf = Buffer.from(await (await fetch(url)).arrayBuffer());
        }
        const path = `${tid}/${row.id}.png`;
        const up = await svc.storage.from("item-images").upload(path, buf, { contentType: "image/png", upsert: true });
        if (up.error) throw new Error("upload: " + up.error.message);
        const image_url = `${SUPA}/storage/v1/object/public/item-images/${path}?v=${Date.now()}`;
        const { error } = await svc.from("menu_items").update({
          name: dish.name, description: dish.desc, price: dish.price, price_text: null,
          is_featured: dish.featured, image_url,
          video_id: null, video_status: "none", video_thumb_url: null, // reset; Stage 2 fills
        }).eq("id", row.id);
        if (error) throw new Error("db: " + error.message);
        results.push(`✓ ${dish.name}`);
        console.log(`✓ ${dish.name} (${dish.featured ? "featured" : "-"})`);
      } catch (e) {
        results.push(`✗ ${dish.name}: ${e.message}`);
        console.log(`✗ ${dish.name}: ${e.message}`);
      }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  await svc.from("tenants").update({ name: "Hung Paradise" }).eq("id", tid); // keep name
  console.log("\nDONE.", results.filter(r => r.startsWith("✓")).length, "/", DISHES.length, "ok");
}
run().catch((e) => { console.error("FATAL", e); process.exit(1); });
