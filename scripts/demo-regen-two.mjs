// Regenerate Mango Pudding + Jasmine Green Tea with tighter framing (dish fills frame),
// re-animate (subtle), re-upload to Bunny, re-wire. Run: node --env-file=.env.local scripts/demo-regen-two.mjs
import { createClient } from "@supabase/supabase-js";
const KEY = process.env.KIE_API_KEY, H = { Authorization:`Bearer ${KEY}`, "Content-Type":"application/json" };
const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const B_LIB=process.env.BUNNY_STREAM_LIBRARY_ID, B_KEY=process.env.BUNNY_STREAM_API_KEY, B_CDN=process.env.BUNNY_CDN_HOSTNAME, B="https://video.bunnycdn.com";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const create=async(m,i)=>(await fetch("https://api.kie.ai/api/v1/jobs/createTask",{method:"POST",headers:H,body:JSON.stringify({model:m,input:i})})).json();
const rec=async id=>(await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${id}`,{headers:H})).json();
const SUBTLE="Cinemagraph food video: gentle rising steam and a soft glisten across the surface, an extremely slow subtle push-in, subject stays centered and fills the frame. Photorealistic, seamless loop, no text, no hands, no cuts.";
async function poll(id,tries=45){for(let i=0;i<tries;i++){await sleep(7000);const info=await rec(id);if(info.data?.state==="success")return JSON.parse(info.data.resultJson).resultUrls[0];if(info.data?.state==="fail")throw new Error(info.data.failMsg);}throw new Error("timeout");}
async function bunny(mp4,title){const bytes=Buffer.from(await(await fetch(mp4)).arrayBuffer());const {guid}=await(await fetch(`${B}/library/${B_LIB}/videos`,{method:"POST",headers:{AccessKey:B_KEY,"Content-Type":"application/json",accept:"application/json"},body:JSON.stringify({title})})).json();await fetch(`${B}/library/${B_LIB}/videos/${guid}`,{method:"PUT",headers:{AccessKey:B_KEY},body:bytes});for(let i=0;i<60;i++){await sleep(6000);const s=await(await fetch(`${B}/library/${B_LIB}/videos/${guid}`,{headers:{AccessKey:B_KEY,accept:"application/json"}})).json();if(s.status===5||s.status===6)throw new Error("encode fail");if(s.encodeProgress===100||s.status===4)return guid;}throw new Error("encode timeout");}
const DISHES=[
 {name:"Mango Pudding", img:"Professional food photography, tight close-up of Cantonese mango pudding in a glass topped with fresh mango cubes and a mint leaf, the glass fills most of the frame, centered composition, dark moody background, soft lighting, shallow depth of field, no empty space, no text"},
 {name:"Jasmine Green Tea", img:"Professional food photography, tight close-up of a clear glass cup of Chinese jasmine green tea with floating jasmine flowers, steam rising, the cup fills most of the frame, centered composition, dark moody background, warm lighting, shallow depth of field, no empty space, no text"},
];
const { data: t } = await svc.from("tenants").select("id").eq("slug","hungparadise").maybeSingle();
for (const d of DISHES) {
  try {
    const { data: it } = await svc.from("menu_items").select("id").eq("tenant_id",t.id).eq("name",d.name).maybeSingle();
    const imgUrl = await poll((await create("google/nano-banana",{prompt:d.img,image_size:"3:4"})).data.taskId, 30);
    const buf = Buffer.from(await (await fetch(imgUrl)).arrayBuffer());
    const path=`${t.id}/${it.id}.png`;
    await svc.storage.from("item-images").upload(path,buf,{contentType:"image/png",upsert:true});
    const image_url=`${SUPA}/storage/v1/object/public/item-images/${path}?v=${Date.now()}`;
    const mp4 = await poll((await create("bytedance/v1-lite-image-to-video",{prompt:SUBTLE,image_url,duration:"5",resolution:"720p",camera_fixed:true})).data.taskId);
    const guid = await bunny(mp4, `hungparadise-${d.name}-v2`);
    await svc.from("menu_items").update({ image_url, video_id:guid, video_status:"ready", video_thumb_url:`https://${B_CDN}/${guid}/thumbnail.jpg` }).eq("id", it.id);
    console.log(`✓ ${d.name} → ${guid}`);
  } catch(e){ console.log(`✗ ${d.name}: ${e.message}`); }
}
console.log("DONE");
