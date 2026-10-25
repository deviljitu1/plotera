import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import ts from "typescript";

const source=(await readFile(new URL("../lib/auth.ts",import.meta.url),"utf8")).replace('import {cookies} from "next/headers";',"const cookies=async()=>new Map();");
const {requestUser}=await import("data:text/javascript;base64,"+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString("base64"));

test("Vercel authentication verifies Supabase tokens and denies spoofed identity headers",async()=>{
  const prior={fetch:globalThis.fetch,url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SECRET_KEY,emails:process.env.PLOTERA_ADMIN_EMAILS};
  process.env.SUPABASE_URL="https://auth-test.invalid";process.env.SUPABASE_SECRET_KEY="test-only";process.env.PLOTERA_ADMIN_EMAILS="admin@example.com";
  const verified=[];
  globalThis.fetch=async(url,options)=>{assert.equal(url,"https://auth-test.invalid/auth/v1/user");verified.push(options.headers.Authorization);assert.equal(options.headers.apikey,"test-only");assert.equal(options.cache,"no-store");return new Response(JSON.stringify({id:"verified-owner",email:options.headers.Authorization==="Bearer other-user"?"other@example.com":"admin@example.com"}),{status:options.headers.Authorization==="Bearer revoked"?401:200});};
  try{
    assert.equal(await requestUser(new Request("https://plotera.test/api/projects",{headers:{"oai-authenticated-user-id":"forged","oai-authenticated-user-email":"admin@example.com"}})),null);
    assert.equal(verified.length,0);
    assert.deepEqual(await requestUser(new Request("https://plotera.test/api/projects",{headers:{cookie:"other=1; plotera-access=valid-session"}})),{id:"verified-owner",email:"admin@example.com"});
    assert.equal(await requestUser(new Request("https://plotera.test/mcp",{headers:{Authorization:"Bearer other-user"}})),null);
    assert.equal(await requestUser(new Request("https://plotera.test/mcp",{headers:{Authorization:"Bearer revoked"}})),null);
    process.env.PLOTERA_ADMIN_EMAILS="";
    assert.equal(await requestUser(new Request("https://plotera.test/mcp",{headers:{Authorization:"Bearer valid-session"}})),null);
  }finally{
    globalThis.fetch=prior.fetch;
    for(const [name,value] of Object.entries({SUPABASE_URL:prior.url,SUPABASE_SECRET_KEY:prior.key,PLOTERA_ADMIN_EMAILS:prior.emails}))if(value===undefined)delete process.env[name];else process.env[name]=value;
  }
});
