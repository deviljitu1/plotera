import * as store from "./store";
import { seedProject, validateProject, type ProjectData } from "./domain";

export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function identity(request: Request) {
  const id = request.headers.get("oai-authenticated-user-id");
  if (!id) throw new HttpError(401, "Sign in to open your workspace.");
  return id;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new HttpError(403, "Cross-origin requests are not allowed.");
}
export async function owned(id: string, owner: string) {
  const p = await store.find(id,owner);
  if (!p) throw new HttpError(404, "Project not found.");
  return p;
}
export function present(p: store.ProjectRow) { return {...p, owner: undefined, data: JSON.parse(p.data), published: p.published ? "published" : null}; }
export async function listProjects(owner: string) { return (await store.list(owner)).map(present); }
export async function createProject(owner: string, data = seedProject()) {
  validateProject(data);
  if ((await store.list(owner)).length >= 50) throw new HttpError(400,"Workspace limit is 50 projects.");
  const now = Date.now();
  const p = await store.insert({id:crypto.randomUUID(),owner,name:data.name,data:JSON.stringify(data),invoiceAmount:0,created:now,updated:now});
  return present(p);
}
export async function saveProject(id: string, owner: string, data: ProjectData, version: number) {
  await owned(id,owner); validateProject(data);
  assertAssetScope(id,data);
  if(!Number.isInteger(version)||version<1)throw new HttpError(400,"A valid project version is required.");
  const p = await store.update(id,owner,{name:data.name,data:JSON.stringify(data),updated:Date.now(),version:version+1},version);
  if (!p) throw new HttpError(409,"This project changed in another tab. Reload it before saving.");
  await log(id,owner,"Saved site design"); return present(p);
}
export async function publishProject(id: string, owner: string) {
  const p = await owned(id,owner); const data = validateProject(JSON.parse(p.data));
  assertAssetScope(id,data);
  if (!data.contactPhone || !/^[1-9]\d{7,14}$/.test(data.contactPhone)) throw new HttpError(400,"Add a WhatsApp number with country code in Project settings before publishing.");
  const token = p.shareToken || crypto.randomUUID().replaceAll("-","") + crypto.randomUUID().slice(0,8);
  const updated = await store.update(id,owner,{published:JSON.stringify(data),shareToken:token,updated:Date.now()},p.version);
  if (!updated) throw new HttpError(409,"Project changed while publishing. Save and try again.");
  await log(id,owner,"Published brochure"); return present(updated);
}
export async function publicProject(token: string) {
  const p = await store.byToken(token);
  if (!p?.published) throw new HttpError(404,"This brochure is unavailable.");
  return {id:p.id,data:JSON.parse(p.published) as ProjectData};
}
export async function log(project: string, actor: string, action: string) { await store.log({id:crypto.randomUUID(),project,actor,action,created:Date.now()}); }
export async function stats(id: string, owner: string) {
  await owned(id,owner);
  return store.getStats(id);
}
export async function recordEvent(token: string, type: string, plot?: string) {
  if (!["view","plot","whatsapp","document"].includes(type)) throw new HttpError(400,"Unsupported event.");
  const p = await publicProject(token);
  if (plot && !p.data.plots.some(x=>x.id===plot)) throw new HttpError(400,"Unknown plot.");
  // A bounded per-project rate limit protects public, anonymous counters.
  if (await store.countRecent(p.id) >= 120) throw new HttpError(429,"Please try again later.");
  await store.event({id:crypto.randomUUID(),project:p.id,type,plot:plot||null,created:Date.now()});
}
export async function upload(request: Request, owner: string, id: string) {
  await owned(id,owner);
  const form = await request.formData(), file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > 25*1024*1024) throw new HttpError(400,"Choose a file smaller than 25 MB.");
  const allowed = {"image/png":"png","image/jpeg":"jpg","image/webp":"webp","application/pdf":"pdf","model/gltf-binary":"glb","audio/mpeg":"mp3"} as Record<string,string>;
  let type = file.type;
  if (file.name.toLowerCase().endsWith(".glb")) type = "model/gltf-binary";
  if (!allowed[type]) throw new HttpError(400,"Supported files: PNG, JPG, WebP, PDF, GLB and MP3.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const valid = type==="model/gltf-binary" ? String.fromCharCode(...bytes.slice(0,4))==="glTF" : type==="application/pdf" ? String.fromCharCode(...bytes.slice(0,4))==="%PDF" : type==="image/png" ? bytes[0]===137&&bytes[1]===80 : type==="image/jpeg" ? bytes[0]===255&&bytes[1]===216 : type==="image/webp" ? String.fromCharCode(...bytes.slice(0,4))==="RIFF" : true;
  if (!valid) throw new HttpError(400,"File contents do not match the selected format.");
  const key = `${id}/${crypto.randomUUID()}.${allowed[type]}`;
  await store.bucket().put(key,bytes,{httpMetadata:{contentType:type},customMetadata:{owner}});
  await log(id,owner,`Uploaded ${file.name.slice(0,100)}`);
  return {key,name:file.name,type};
}
export async function readFile(request: Request, key: string) {
  const url = new URL(request.url), token = url.searchParams.get("share"), project = key.split("/")[0];
  if (token) { const p = await publicProject(token); const d=p.data; if(p.id!==project||![d.mapKey,d.modelKey,d.audioKey,...d.documents.map(x=>x.key)].includes(key)) throw new HttpError(404,"File not found."); }
  else await owned(project,identity(request));
  const object = await store.bucket().get(key);
  if (!object) throw new HttpError(404,"File not found.");
  return new Response(object.body,{headers:{"Content-Type":object.httpMetadata?.contentType||"application/octet-stream","X-Content-Type-Options":"nosniff","Content-Disposition":object.httpMetadata?.contentType==="application/pdf"?'inline; filename="project-document.pdf"':"inline","Cache-Control":"private, max-age=120"}});
}
export async function unpublish(id:string,owner:string){await owned(id,owner);await store.update(id,owner,{published:null});await log(id,owner,"Unpublished brochure");}
export async function billing(id:string,owner:string,invoiceStatus:string,invoiceAmount:number){await owned(id,owner);if(!["unbilled","invoiced","paid"].includes(invoiceStatus)||!Number.isFinite(invoiceAmount)||invoiceAmount<0||invoiceAmount>10000000)throw new HttpError(400,"Invalid invoice details.");const p=await store.update(id,owner,{invoiceStatus,invoiceAmount});await log(id,owner,`Manual invoice marked ${invoiceStatus}`);return present(p!);}
function assertAssetScope(id:string,d:ProjectData){for(const key of [d.mapKey,d.modelKey,d.audioKey,...d.documents.map(x=>x.key)])if(key&&(typeof key!=="string"||!key.startsWith(id+"/")||key.includes("..")))throw new HttpError(400,"Assets must belong to this project. Re-upload files when importing another project.");}
