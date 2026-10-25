import {homeContent} from "./home-content";
import HomeMotion from "./home-motion";
import type {Metadata} from "next";
import {siteUrl,homeTitle,homeDescription,homeSchema,serializeSchema} from "../lib/site";
export const metadata:Metadata={
  title:homeTitle,description:homeDescription,
  ...(siteUrl?{alternates:{canonical:`${siteUrl}/`}}:{}),
  openGraph:{title:homeTitle,description:homeDescription,type:"website",siteName:"Plotera",locale:"en_IN",...(siteUrl?{url:`${siteUrl}/`,images:[{url:`${siteUrl}/design/assets/image-01.jpg`,alt:"Architectural project presentation with Plotera"}]}:{})},
  twitter:{card:"summary_large_image",title:homeTitle,description:homeDescription,...(siteUrl?{images:[`${siteUrl}/design/assets/image-01.jpg`]}:{})}
};
export default function Home() {
  return <>
    <link rel="stylesheet" href="/design/home.css" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeSchema(homeSchema())}} />
    <div suppressHydrationWarning dangerouslySetInnerHTML={{__html:homeContent}} />
    <HomeMotion key={homeContent.length} />
  </>;
}
