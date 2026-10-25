import {readFile} from "node:fs/promises";
const vars=Object.fromEntries((await readFile(".dev.vars","utf8")).split(/\r?\n/).filter(x=>x.includes("=")).map(line=>{const i=line.indexOf("=");return[line.slice(0,i),line.slice(i+1).replace(/^"|"$/g,"")];}));
if(vars.SUPABASE_URL!=="https://mybkiaffwstchfofgykf.supabase.co")throw new Error("Unexpected fixture target");
const headers={apikey:vars.SUPABASE_SECRET_KEY,"Content-Type":"application/json"};
const response=await fetch(`${vars.SUPABASE_URL}/rest/v1/projects?${new URLSearchParams({select:"id,name,data",name:"like.QA ·%"})}`,{headers});
if(!response.ok)throw new Error("Could not inspect test fixtures");
const rows=await response.json();
for(const row of rows){
  if(!row.name.startsWith("QA ·"))throw new Error("Not a disposable test record");
  const data=JSON.parse(row.data);
  if(data.mapKey?.startsWith(row.id+"/"))await fetch(`${vars.SUPABASE_URL}/storage/v1/object/plotera-assets`,{method:"DELETE",headers,body:JSON.stringify({prefixes:[data.mapKey]})});
  const deleted=await fetch(`${vars.SUPABASE_URL}/rest/v1/projects?${new URLSearchParams({id:`eq.${row.id}`,name:"like.QA ·%"})}`,{method:"DELETE",headers});
  if(!deleted.ok)throw new Error("Could not remove disposable test record");
}
console.log(`Removed ${rows.length} disposable Supabase test project(s).`);
