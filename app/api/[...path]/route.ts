import * as svc from "../../../lib/service";
import type {ProjectData} from "../../../lib/domain";
import {provider} from "../../../lib/store";
type Body={type:string;plot?:string;data:ProjectData;version:number;invoiceStatus:string;invoiceAmount:number};
export const dynamic = "force-dynamic";
async function handle(request: Request, context: {params:Promise<{path:string[]}>}) {
  try {
    const {path} = await context.params, method = request.method;
    if (method !== "GET") svc.sameOrigin(request);
    if (path[0]==="brochure" && path[1]) {
      if(method==="GET") return Response.json(await svc.publicProject(path[1]));
      if(method==="POST" && path[2]==="event") { const b=await request.json() as Body; await svc.recordEvent(path[1],b.type,b.plot); return Response.json({ok:true}); }
    }
    if(path[0]==="files" && method==="GET") return await svc.readFile(request,path.slice(1).join("/"));
    const owner=svc.identity(request);
    if(path[0]==="workspace" && method==="GET") return Response.json({name:request.headers.get("oai-authenticated-user-email")||"My workspace",backend:provider()});
    if(path[0]==="projects") {
      const id=path[1];
      if(!id && method==="GET") return Response.json(await svc.listProjects(owner));
      if(!id && method==="POST") { const b=await request.json() as Body; return Response.json(await svc.createProject(owner,b.data),{status:201}); }
      if(id) {
        if(path[2]==="publish" && method==="POST") return Response.json(await svc.publishProject(id,owner));
        if(path[2]==="unpublish" && method==="POST") { await svc.unpublish(id,owner); return Response.json({ok:true}); }
        if(path[2]==="stats" && method==="GET") return Response.json(await svc.stats(id,owner));
        if(path[2]==="upload" && method==="POST") return Response.json(await svc.upload(request,owner,id),{status:201});
        if(path[2]==="billing" && method==="PATCH") {
          const b=await request.json() as Body;
          return Response.json(await svc.billing(id,owner,b.invoiceStatus,b.invoiceAmount));
        }
        if(method==="GET") return Response.json(svc.present(await svc.owned(id,owner)));
        if(method==="PATCH") { const b=await request.json() as Body; return Response.json(await svc.saveProject(id,owner,b.data,b.version)); }
      }
    }
    throw new svc.HttpError(404,"Not found.");
  } catch(e) { const known=e instanceof svc.HttpError; return Response.json({error:known?e.message:e instanceof Error&&/Invalid|must|Plot|Map|Layout/.test(e.message)?e.message:"The request could not be completed. Please try again."},{status:known?e.status:400}); }
}
export {handle as GET,handle as POST,handle as PATCH};
