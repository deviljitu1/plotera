"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import "../globals.css";
export default function Login(){
  const router=useRouter();
  const [error,setError]=useState(""),[busy,setBusy]=useState(false);
  useEffect(()=>{fetch("/api/auth/refresh",{method:"POST"}).then(r=>{if(r.ok)router.replace("/admin");}).catch(()=>{});},[router]);
  return <main style={{minHeight:"100svh",display:"grid",placeItems:"center",padding:24,background:"#0c0925",color:"white"}}><form style={{width:"100%",maxWidth:380,display:"grid",gap:18}} onSubmit={async e=>{e.preventDefault();setBusy(true);setError("");const form=new FormData(e.currentTarget);try{const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:form.get("email"),password:form.get("password")})});const b=await r.json() as {error?:string};if(!r.ok)throw new Error(b.error);router.replace("/admin");router.refresh();}catch(e){setError((e as Error).message);setBusy(false);}}}>
    <Link href="/" style={{color:"#bfcee9"}}>Plotera</Link><h1 style={{fontSize:32}}>Project admin</h1>
    <label>Email<input required name="email" type="email" autoComplete="username" style={{display:"block",width:"100%",padding:12,marginTop:8,color:"#17132d",background:"white",borderRadius:8}}/></label>
    <label>Password<input required name="password" type="password" autoComplete="current-password" style={{display:"block",width:"100%",padding:12,marginTop:8,color:"#17132d",background:"white",borderRadius:8}}/></label>
    {error&&<p role="alert">{error}</p>}<button disabled={busy} style={{padding:14,borderRadius:24,background:"#bfcee9",color:"#10102a"}}>{busy?"Signing in…":"Sign in"}</button>
  </form></main>;
}
