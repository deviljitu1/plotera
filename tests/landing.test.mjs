import test from "node:test";
import assert from "node:assert/strict";
import {parse} from "parse5";
import {normalizeSiteUrl,homeSchema,serializeSchema} from "../lib/site.ts";

test("public origin validation prevents preview and injected canonical URLs",()=>{
  assert.equal(normalizeSiteUrl("https://plotera.test/"),"https://plotera.test");
  for(const value of [undefined,"http://localhost:5173","https://localhost","https://127.0.0.1","https://user:password@plotera.test","https://plotera.test/other","https://plotera.test/?q=x","bad-url"])assert.equal(normalizeSiteUrl(value),undefined);
});
test("structured data describes software without fabricated prices or ratings",()=>{
  const data=homeSchema("https://plotera.test");
  assert.equal(data["@graph"][0]["@type"],"WebApplication");
  assert.equal(data["@graph"][0].url,"https://plotera.test/");
  assert.ok(!JSON.stringify(data).includes("aggregateRating"));
  assert.ok(!JSON.stringify(data).includes('"price"'));
  assert.ok(!serializeSchema({text:"</script><script>alert(1)</script>"}).includes("<"));
});
test("landing content and metadata are present without running JavaScript",async()=>{
  const base=process.env.TEST_BASE_URL||"http://127.0.0.1:5173";
  const response=await fetch(base+"/");assert.equal(response.status,200);
  const document=parse(await response.text()),nodes=[];
  function walk(n){nodes.push(n);for(const c of n.childNodes||[])walk(c)}walk(document);
  const attrs=n=>Object.fromEntries((n.attrs||[]).map(a=>[a.name,a.value]));
  const tags=name=>nodes.filter(n=>n.tagName===name);
  assert.equal(tags("h1").length,1);
  assert.ok(tags("title").some(n=>n.childNodes.some(c=>c.value?.includes("3D Plot Brochures"))));
  assert.ok(tags("meta").some(n=>attrs(n).name==="description"&&attrs(n).content.includes("WhatsApp")));
  assert.ok(tags("meta").some(n=>attrs(n).property==="og:title"));
  assert.ok(tags("script").filter(n=>attrs(n).type==="application/ld+json").some(n=>JSON.parse(n.childNodes.map(c=>c.value||"").join(""))["@graph"][0]["@type"]==="WebApplication"));
  assert.equal(tags("form").length,0);
  assert.ok(tags("a").some(n=>attrs(n).href==="/demo"));
  assert.ok(tags("img").some(n=>attrs(n).fetchpriority==="high"));
  assert.ok(!tags("link").some(n=>attrs(n).rel==="canonical"&&attrs(n).href.includes("127.0.0.1")));
  const gate=await fetch(base+"/admin",{redirect:"manual"});assert.ok([302,303,307].includes(gate.status));assert.ok(gate.headers.get("location").includes("signin-with-chatgpt"));
  const login=await fetch(base+"/signin-with-chatgpt?return_to=/admin",{redirect:"manual"});const cookie=login.headers.getSetCookie().map(x=>x.split(";")[0]).join("; ");
  const studio=parse(await(await fetch(base+"/admin",{headers:{cookie}})).text()),metas=[];
  function findMeta(n){if(n.tagName==="meta")metas.push(attrs(n));for(const c of n.childNodes||[])findMeta(c)}findMeta(studio);
  assert.ok(metas.some(m=>m.name==="robots"&&m.content.includes("noindex")));
  const robots=await fetch(base+"/robots.txt");assert.equal(robots.status,200);assert.match(robots.headers.get("content-type"),/text\/plain/);
  const sitemap=await fetch(base+"/sitemap.xml");
  if(sitemap.status===200)assert.ok(!(await sitemap.text()).includes("localhost"));
  else assert.equal(sitemap.status,503,"unconfigured public domain is explicit");
});
