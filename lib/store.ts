import {env} from "cloudflare:workers";
import {and,eq,desc,sql} from "drizzle-orm";
import {getDb} from "../db";
import {projects,events,activity} from "../db/schema";
export type ProjectRow=typeof projects.$inferSelect;
type Runtime={SUPABASE_URL?:string;SUPABASE_SECRET_KEY?:string;BUCKET:R2Bucket};
const runtime=()=>env as unknown as Runtime;
export function provider(){const e=runtime();if(Boolean(e.SUPABASE_URL)!==Boolean(e.SUPABASE_SECRET_KEY))throw new Error("Set both Supabase server environment variables.");return e.SUPABASE_URL?"supabase":"local-d1";}
async function rest(table:string,query:Record<string,string>={},method="GET",body?:unknown){
  const e=runtime(),base=e.SUPABASE_URL!.replace(/\/$/,"");
  if(!base.startsWith("https://"))throw new Error("Supabase URL must use HTTPS.");
  const r=await fetch(`${base}/rest/v1/${table}?${new URLSearchParams(query)}`,{method,headers:{apikey:e.SUPABASE_SECRET_KEY!,"Content-Type":"application/json",Prefer:"return=representation"},body:body===undefined?undefined:JSON.stringify(body)});
  if(!r.ok)throw new Error("Supabase request failed. Check the migration and server configuration.");
  return await r.json() as Record<string,unknown>[];
}
function fromRow(r:Record<string,unknown>):ProjectRow{return {id:String(r.id),owner:String(r.owner),name:String(r.name),data:String(r.data),version:Number(r.version),published:r.published?String(r.published):null,shareToken:r.share_token?String(r.share_token):null,plan:String(r.plan),invoiceStatus:String(r.invoice_status),invoiceAmount:Number(r.invoice_amount),created:Number(r.created),updated:Number(r.updated)};}
function toRow(r:Partial<ProjectRow>){return Object.fromEntries(Object.entries(r).map(([k,v])=>[({shareToken:"share_token",invoiceStatus:"invoice_status",invoiceAmount:"invoice_amount"} as Record<string,string>)[k]||k,v]));}
export async function list(owner:string){if(provider()==="supabase")return(await rest("projects",{owner:`eq.${owner}`,order:"updated.desc",limit:"50"})).map(fromRow);return getDb().select().from(projects).where(eq(projects.owner,owner)).orderBy(desc(projects.updated));}
export async function find(id:string,owner:string){if(provider()==="supabase")return(await rest("projects",{id:`eq.${id}`,owner:`eq.${owner}`,limit:"1"})).map(fromRow)[0];return(await getDb().select().from(projects).where(and(eq(projects.id,id),eq(projects.owner,owner))).limit(1))[0];}
export async function byToken(token:string){if(provider()==="supabase")return(await rest("projects",{share_token:`eq.${token}`,limit:"1"})).map(fromRow)[0];return(await getDb().select().from(projects).where(eq(projects.shareToken,token)).limit(1))[0];}
export async function insert(row:typeof projects.$inferInsert){if(provider()==="supabase")return fromRow((await rest("projects",{},"POST",toRow(row)))[0]);return(await getDb().insert(projects).values(row).returning())[0];}
export async function update(id:string,owner:string,row:Partial<ProjectRow>,version?:number){if(provider()==="supabase"){const q:Record<string,string>={id:`eq.${id}`,owner:`eq.${owner}`};if(version!==undefined)q.version=`eq.${version}`;const rows=await rest("projects",q,"PATCH",toRow(row));return rows[0]?fromRow(rows[0]):undefined;}return(await getDb().update(projects).set(row).where(and(eq(projects.id,id),eq(projects.owner,owner),version===undefined?undefined:eq(projects.version,version))).returning())[0];}
export async function log(row:typeof activity.$inferInsert){if(provider()==="supabase"){await rest("activity",{},"POST",row);return;}await getDb().insert(activity).values(row);}
export async function getStats(id:string){if(provider()==="supabase")return{events:await rest("events",{project:`eq.${id}`,select:"type,plot,created",order:"created.desc",limit:"5000"}),activity:await rest("activity",{project:`eq.${id}`,select:"action,created",order:"created.desc",limit:"20"})};return{events:await getDb().select({type:events.type,plot:events.plot,created:events.created}).from(events).where(eq(events.project,id)).orderBy(desc(events.created)).limit(5000),activity:await getDb().select({action:activity.action,created:activity.created}).from(activity).where(eq(activity.project,id)).orderBy(desc(activity.created)).limit(20)};}
export async function countRecent(id:string){if(provider()==="supabase")return(await rest("events",{project:`eq.${id}`,created:`gt.${Date.now()-60000}`,select:"id",limit:"120"})).length;return(await getDb().select({n:sql<number>`count(*)`}).from(events).where(and(eq(events.project,id),sql`${events.created}>${Date.now()-60000}`)))[0].n;}
export async function event(row:typeof events.$inferInsert){if(provider()==="supabase"){await rest("events",{},"POST",row);return;}await getDb().insert(events).values(row);}
export function bucket(){
  if(provider()!=="supabase")return runtime().BUCKET;
  const e=runtime();const headers={apikey:e.SUPABASE_SECRET_KEY!,};
  const url=(key:string)=>`${e.SUPABASE_URL!.replace(/\/$/,"")}/storage/v1/object/plotera-assets/${key.split("/").map(encodeURIComponent).join("/")}`;
  return {
    async put(key:string,bytes:Uint8Array,options:{httpMetadata:{contentType:string};customMetadata?:Record<string,string>}){const r=await fetch(url(key),{method:"POST",headers:{...headers,"Content-Type":options.httpMetadata.contentType,"x-upsert":"false"},body:bytes as unknown as BodyInit});if(!r.ok)throw new Error("Storage upload failed. Check the private plotera-assets bucket.");},
    async get(key:string){const r=await fetch(url(key),{headers});if(r.status===404)return null;if(!r.ok)throw new Error("Could not open the stored file.");const buffer=await r.arrayBuffer();return{body:buffer,size:buffer.byteLength,httpMetadata:{contentType:r.headers.get("content-type")||"application/octet-stream"},arrayBuffer:async()=>buffer};},
  };
}

