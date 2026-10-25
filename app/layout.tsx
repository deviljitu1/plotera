import type { Metadata } from "next";
import {siteUrl} from "../lib/site";

export const metadata: Metadata = {
  title: "Plotera — A new perspective on property",
  description: "Design a site plan, explore it in 3D, and turn it into an interactive sales brochure.",
  ...(siteUrl?{metadataBase:new URL(siteUrl)}:{}),
  robots:{index:!!siteUrl,follow:true},
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="no-js" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400..700&display=swap" />
        <script dangerouslySetInnerHTML={{__html:"(function(){var d=document.documentElement;d.classList.remove('no-js');try{if(localStorage.getItem('theme')==='dusk')d.classList.add('dusk')}catch(e){}if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('motion');setTimeout(function(){if(!window.gsap)d.classList.remove('motion')},2500)}})();"}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
