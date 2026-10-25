import type {projects,events,activity} from "../db/schema";
export type ProjectRow=typeof projects.$inferSelect;
const runtime=()=>process.env;
export function provider(){if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SECRET_KEY)throw new Error("Configure Supabase server environment variables.");return "supabase";}
async function rest(table:string,query:Record<string,string>={},method="GET",body?:unknown){
  provider();const e=runtime(),base=e.SUPABASE_URL!.replace(/\/$/,"");
  if(!base.startsWith("https://"))throw new Error("Supabase URL must use HTTPS.");
  const r=await fetch(`${base}/rest/v1/${table}?${new URLSearchParams(query)}`,{method,headers:{apikey:e.SUPABASE_SECRET_KEY!,"Content-Type":"application/json",Prefer:"return=representation"},body:body===undefined?undefined:JSON.stringify(body)});
  if(!r.ok)throw new Error("Supabase request failed. Check the migration and server configuration.");
  return await r.json() as Record<string,unknown>[];
}
function fromRow(r:Record<string,unknown>):ProjectRow{return {id:String(r.id),owner:String(r.owner),name:String(r.name),data:String(r.data),version:Number(r.version),published:r.published?String(r.published):null,shareToken:r.share_token?String(r.share_token):null,plan:String(r.plan),invoiceStatus:String(r.invoice_status),invoiceAmount:Number(r.invoice_amount),created:Number(r.created),updated:Number(r.updated)};}
function toRow(r:Partial<ProjectRow>){return Object.fromEntries(Object.entries(r).map(([k,v])=>[({shareToken:"share_token",invoiceStatus:"invoice_status",invoiceAmount:"invoice_amount"} as Record<string,string>)[k]||k,v]));}
export async function list(owner:string){return(await rest("projects",{owner:`eq.${owner}`,order:"updated.desc",limit:"50"})).map(fromRow);}
export async function find(id:string,owner:string){return(await rest("projects",{id:`eq.${id}`,owner:`eq.${owner}`,limit:"1"})).map(fromRow)[0];}
export async function byToken(token:string){return(await rest("projects",{share_token:`eq.${token}`,limit:"1"})).map(fromRow)[0];}
export async function insert(row:typeof projects.$inferInsert){return fromRow((await rest("projects",{},"POST",toRow(row)))[0]);}
export async function update(id:string,owner:string,row:Partial<ProjectRow>,version?:number){const q:Record<string,string>={id:`eq.${id}`,owner:`eq.${owner}`};if(version!==undefined)q.version=`eq.${version}`;const rows=await rest("projects",q,"PATCH",toRow(row));return rows[0]?fromRow(rows[0]):undefined;}
export async function log(row:typeof activity.$inferInsert){await rest("activity",{},"POST",row);}
export async function getStats(id:string){return{events:await rest("events",{project:`eq.${id}`,select:"type,plot,created",order:"created.desc",limit:"5000"}),activity:await rest("activity",{project:`eq.${id}`,select:"action,created",order:"created.desc",limit:"20"})};}
export async function countRecent(id:string){return(await rest("events",{project:`eq.${id}`,created:`gt.${Date.now()-60000}`,select:"id",limit:"120"})).length;}
export async function event(row:typeof events.$inferInsert){await rest("events",{},"POST",row);}
export function bucket(){
  provider();
  const e=runtime();const headers={apikey:e.SUPABASE_SECRET_KEY!,};
  const url=(key:string)=>`${e.SUPABASE_URL!.replace(/\/$/,"")}/storage/v1/object/plotera-assets/${key.split("/").map(encodeURIComponent).join("/")}`;
  const storageBase=e.SUPABASE_URL!.replace(/\/$/,"")+"/storage/v1";
  async function signed(key:string,upload:boolean){const path=key.split("/").map(encodeURIComponent).join("/");const r=await fetch(storageBase+`/object/${upload?"upload/sign":"sign"}/plotera-assets/${path}`,{method:"POST",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify(upload?{}:{expiresIn:300}),cache:"no-store"});if(!r.ok)throw new Error("Could not authorize this file.");const b=await r.json() as {url?:string;signedURL?:string};const target=new URL(storageBase+(b.url||b.signedURL));if(target.origin!==new URL(storageBase).origin)throw new Error("Invalid storage URL.");return target.href;}
  return {
    signedUpload:(key:string)=>signed(key,true),
    signedDownload:(key:string)=>signed(key,false),
    async inspect(key:string){const r=await fetch(url(key),{headers:{...headers,Range:"bytes=0-15"},cache:"no-store"});if(!r.ok)throw new Error("Uploaded file not found.");const size=Number(r.headers.get("content-range")?.split("/")[1]||r.headers.get("content-length"));const reader=r.body!.getReader();const first=await reader.read();await reader.cancel();return {size,type:r.headers.get("content-type")?.split(";")[0],bytes:first.value||new Uint8Array()};},
    async put(key:string,bytes:Uint8Array,options:{httpMetadata:{contentType:string};customMetadata?:Record<string,string>}){const r=await fetch(url(key),{method:"POST",headers:{...headers,"Content-Type":options.httpMetadata.contentType,"x-upsert":"false"},body:bytes as unknown as BodyInit});if(!r.ok)throw new Error("Storage upload failed. Check the private plotera-assets bucket.");},
    async get(key:string){const r=await fetch(url(key),{headers});if(r.status===404)return null;if(!r.ok)throw new Error("Could not open the stored file.");const buffer=await r.arrayBuffer();return{body:buffer,size:buffer.byteLength,httpMetadata:{contentType:r.headers.get("content-type")||"application/octet-stream"},arrayBuffer:async()=>buffer};},
  };
}

