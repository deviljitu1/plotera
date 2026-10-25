import {siteUrl} from "../../lib/site";
export function GET(){
  if(!siteUrl)return new Response("Set SITE_URL to the public HTTPS origin before launch.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8","X-Robots-Tag":"noindex"}});
  const origin=siteUrl.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll('"',"&quot;");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>`,{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=3600"}});
}
