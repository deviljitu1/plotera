export function normalizeSiteUrl(value:string|undefined){
  if(!value)return undefined;
  try{
    const url=new URL(value);
    if(url.protocol!=="https:"||url.username||url.password||url.port||url.pathname!=="/"||url.search||url.hash||url.hostname==="localhost"||url.hostname.endsWith(".localhost")||/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname))return undefined;
    return url.origin;
  }catch{return undefined;}
}
export const siteUrl=normalizeSiteUrl(process.env.SITE_URL);
export const homeTitle="Plotera | Interactive 3D Plot Brochures & Site Plans";
export const homeDescription="Turn your approved layout into an interactive 2D and 3D plot brochure. Manage availability and connect buyers on WhatsApp. For builders and property brokers.";
export function homeSchema(origin=siteUrl){
  const app={"@type":"WebApplication",name:"Plotera",description:homeDescription,applicationCategory:"BusinessApplication",operatingSystem:"Web browser",featureList:["Interactive 2D site plans","3D plot brochures","Plot availability management","Plot-specific WhatsApp enquiries"],...(origin?{"@id":`${origin}/#application`,url:`${origin}/`}:{})};
  return {"@context":"https://schema.org","@graph":[app,...(origin?[{"@type":"WebSite","@id":`${origin}/#website`,name:"Plotera",url:`${origin}/`,inLanguage:"en"}]:[])]};
}
export function serializeSchema(value:unknown){return JSON.stringify(value).replaceAll("<","\\u003c");}
