import {NextResponse} from "next/server";
import {accessCookie,refreshCookie,authFetch,verifiedUser,allowed} from "../../../../lib/auth";
import {cookies} from "next/headers";

export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){
  const options={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax" as const,path:"/"};
  const clear=()=>{const r=NextResponse.json({ok:true});for(const name of [accessCookie,refreshCookie])r.cookies.set(name,"",{...options,maxAge:0});return r;};
  if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
  try{
    const {action}=await params,jar=await cookies();
    if(action==="logout"){
      const token=jar.get(accessCookie)?.value;
      if(token)await authFetch("logout",{method:"POST",headers:{Authorization:`Bearer ${token}`}});
      return clear();
    }
    if(action!=="login"&&action!=="refresh")return NextResponse.json({error:"Not found."},{status:404});
    let body:Record<string,string>,grant:string;
    if(action==="login"){
      const b=await request.json() as {email?:unknown;password?:unknown};
      if(typeof b.email!=="string"||typeof b.password!=="string"||b.password.length>1024||!allowed(b.email))return NextResponse.json({error:"Unable to sign in. Check your credentials and admin access."},{status:401});
      body={email:b.email,password:b.password};grant="password";
    }else{
      const token=jar.get(refreshCookie)?.value;if(!token)return NextResponse.json({error:"Sign in required."},{status:401});
      body={refresh_token:token};grant="refresh_token";
    }
    const response=await authFetch(`token?grant_type=${grant}`,{method:"POST",body:JSON.stringify(body)});
    if(!response.ok)return NextResponse.json({error:"Unable to sign in. Check your credentials and admin access."},{status:401});
    const session=await response.json() as {access_token:string;refresh_token:string;expires_in:number};
    if(!await verifiedUser(session.access_token))return NextResponse.json({error:"Admin access required."},{status:403});
    const r=NextResponse.json({ok:true});
    r.cookies.set(accessCookie,session.access_token,{...options,maxAge:session.expires_in});
    r.cookies.set(refreshCookie,session.refresh_token,{...options,maxAge:60*60*24*30});return r;
  }catch{return NextResponse.json({error:"Sign-in is unavailable. Check server configuration."},{status:503});}
}
