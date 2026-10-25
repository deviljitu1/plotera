import {cookies} from "next/headers";

export const accessCookie="plotera-access",refreshCookie="plotera-refresh";
type User={id:string;email:string};
export function allowed(email:string){return (process.env.PLOTERA_ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());}
export async function authFetch(path:string,init:RequestInit={}){
  const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
  if(!base||!key)throw new Error("Configure Supabase before signing in.");
  return fetch(`${base.replace(/\/$/,"")}/auth/v1/${path}`,{...init,cache:"no-store",headers:{apikey:key,"Content-Type":"application/json",...init.headers}});
}
export async function verifiedUser(token:string):Promise<User|null>{
  if(!token)return null;
  const r=await authFetch("user",{headers:{Authorization:`Bearer ${token}`}});
  if(!r.ok)return null;
  const u=await r.json() as Partial<User>;return typeof u.id==="string"&&typeof u.email==="string"&&allowed(u.email)?{id:u.id,email:u.email}:null;
}
export async function requestUser(request:Request){
  const bearer=request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const token=bearer||request.headers.get("cookie")?.split(";").map(x=>x.trim()).find(x=>x.startsWith(accessCookie+"="))?.slice(accessCookie.length+1)||"";
  return verifiedUser(token);
}
export async function currentUser(){return verifiedUser((await cookies()).get(accessCookie)?.value||"");}
