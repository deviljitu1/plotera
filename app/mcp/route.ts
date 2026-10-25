import * as svc from "../../lib/service";
import { makeLayout, area, seedProject, type ProjectData,type Point,type PlotStatus } from "../../lib/domain";
import {bucket} from "../../lib/store";
type ToolArgs={project_id:string;version:number;rows:number;columns:number;name:string;location?:string;data:ProjectData;number:string;points:Point[];price?:number;facing?:string;plot_id:string;status?:PlotStatus;area?:number;building?:boolean};
type Rpc={id:unknown;method:string;params:{name:string;arguments:ToolArgs}};
export const dynamic = "force-dynamic";
const tools = [
  {name:"list_projects",description:"List the signed-in user's plot developments.",inputSchema:{type:"object",properties:{}}},
  {name:"get_project",description:"Get the full editable site plan and its version.",inputSchema:{type:"object",properties:{project_id:{type:"string"}},required:["project_id"]}},
  {name:"get_reference_map",description:"Read the project's uploaded map as an image to trace its exact boundaries. The editor fits the image centred into a 1000×760 coordinate canvas. Calibrate the scale before deriving areas. Maximum image 3 MB.",inputSchema:{type:"object",properties:{project_id:{type:"string"}},required:["project_id"]}},
  {name:"create_project",description:"Create a blank plot development. Coordinates are map units; scale is metres per unit.",inputSchema:{type:"object",properties:{name:{type:"string"},location:{type:"string"}},required:["name"]}},
  {name:"generate_layout",description:"Replace a project's design with a regular grid of plots, entrance road, avenue and amenities. Destructive to the existing draft layout; call get_project and confirm the user's intent first.",inputSchema:{type:"object",properties:{project_id:{type:"string"},version:{type:"integer"},rows:{type:"integer",minimum:1,maximum:20},columns:{type:"integer",minimum:2,maximum:10}},required:["project_id","version","rows","columns"]}},
  {name:"save_site_plan",description:"Save a complete site plan with arbitrary plot polygons, roads, amenities and scale. Read get_project first and pass its version. Preserves account ownership and publication separately.",inputSchema:{type:"object",properties:{project_id:{type:"string"},version:{type:"integer"},data:{type:"object",description:"Complete ProjectData from get_project with the intended changes"}},required:["project_id","version","data"]}},
  {name:"add_plot",description:"Add a plot traced from map coordinates; computes area from the project scale.",inputSchema:{type:"object",properties:{project_id:{type:"string"},version:{type:"integer"},number:{type:"string"},points:{type:"array",minItems:3,items:{type:"array",items:{type:"number"},minItems:2,maxItems:2}},price:{type:"number",minimum:0},facing:{type:"string"}},required:["project_id","version","number","points"]}},
  {name:"update_plot",description:"Update plot number, price, area, availability, facing or building visibility.",inputSchema:{type:"object",properties:{project_id:{type:"string"},version:{type:"integer"},plot_id:{type:"string"},status:{type:"string",enum:["available","reserved","sold"]},price:{type:"number"},number:{type:"string"},area:{type:"number"},facing:{type:"string"},building:{type:"boolean"}},required:["project_id","version","plot_id"]}},
  {name:"publish_brochure",description:"Publish the saved project as a shareable brochure. Requires a WhatsApp number. Only call when the user explicitly asks to publish.",inputSchema:{type:"object",properties:{project_id:{type:"string"}},required:["project_id"]}},
];
export async function POST(request:Request) {
  let id:unknown=null;
  try {
    svc.sameOrigin(request);
    const rpc=await request.json() as Rpc; id=rpc.id;
    const result=(value:unknown)=>Response.json({jsonrpc:"2.0",id,result:value});
    if(rpc.method==="server/discover") return result({supportedVersions:["2026-07-28"],capabilities:{tools:{}}});
    if(rpc.method==="initialize") return result({protocolVersion:"2025-03-26",capabilities:{tools:{}},serverInfo:{name:"Plotera Studio",version:"1.0.0"}});
    if(rpc.method?.startsWith("notifications/")) return new Response(null,{status:202});
    const owner=await svc.identity(request);
    if(rpc.method==="tools/list") return result({tools});
    if(rpc.method!=="tools/call") return Response.json({jsonrpc:"2.0",id,error:{code:-32601,message:"Method not found"}});
    const {name,arguments:a}=rpc.params;
    let value;
    if(name==="list_projects") value=await svc.listProjects(owner);
    else if(name==="create_project") { const d=seedProject(); d.name=a.name;d.location=a.location||"";d.plots=[];d.roads=[];d.amenities=[];value=await svc.createProject(owner,d); }
    else {
      const p=await svc.owned(a.project_id,owner), d=JSON.parse(p.data) as ProjectData;
      if(name==="get_project") value=svc.present(p);
      else if(name==="get_reference_map") {
        if(!d.mapKey||!d.mapKey.startsWith(p.id+"/"))throw new Error("Upload the project's reference map first.");
        const image=await bucket().get(d.mapKey);
        if(!image||image.size>3*1024*1024)throw new Error("Map must be an image smaller than 3 MB for agent inspection.");
        const bytes=new Uint8Array(await image.arrayBuffer());let binary="";for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
        return result({content:[{type:"text",text:JSON.stringify({canvas:{width:1000,height:760,fit:"contain",align:"center"},metersPerUnit:d.metersPerUnit,version:p.version})},{type:"image",data:btoa(binary),mimeType:image.httpMetadata?.contentType||"image/png"}]});
      }
      else if(name==="publish_brochure") value=await svc.publishProject(p.id,owner);
      else {
        if(a.version!==p.version) throw new Error("Project version changed. Call get_project before editing.");
        if(name==="generate_layout") { if(!Number.isInteger(a.rows)||a.rows<1||a.rows>20||!Number.isInteger(a.columns)||a.columns<2||a.columns>10) throw new Error("Rows must be 1–20 and columns 2–10."); Object.assign(d,makeLayout(a.rows,a.columns)); }
        else if(name==="add_plot") d.plots.push({id:crypto.randomUUID(),number:a.number,points:a.points,status:"available",area:area(a.points,d.metersPerUnit),price:a.price||0,facing:a.facing||"North",building:false});
        else if(name==="update_plot") { const p=d.plots.find(x=>x.id===a.plot_id);if(!p)throw new Error("Plot not found.");for(const k of ["status","price","number","area","facing","building"] as const) if(a[k]!==undefined) Object.assign(p,{[k]:a[k]}); }
        else if(name!=="save_site_plan") throw new Error("Unknown tool.");
        value=await svc.saveProject(p.id,owner,name==="save_site_plan"?a.data:d,a.version);
      }
    }
    return result({content:[{type:"text",text:JSON.stringify(value)}]});
  } catch(e) {return Response.json({jsonrpc:"2.0",id,result:{content:[{type:"text",text:e instanceof Error?e.message:"Tool failed"}],isError:true}});}
}
