import {siteUrl} from "../../lib/site";
export function GET(){
  const body=siteUrl?`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /mcp\nDisallow: /signin-with-chatgpt\nDisallow: /signout-with-chatgpt\n\nSitemap: ${siteUrl}/sitemap.xml\n`:"User-agent: *\nDisallow: /\n";
  return new Response(body,{headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"public, max-age=3600"}});
}
