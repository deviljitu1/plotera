"use client";
import {use,useEffect,useState} from "react";
import {Brochure} from "../../studio";
import type {ProjectData} from "../../../lib/domain";
export default function SharedBrochure({params}:{params:Promise<{token:string}>}){const{token}=use(params);const[data,setData]=useState<ProjectData|null>(null),[error,setError]=useState("");useEffect(()=>{fetch(`/api/brochure/${token}`).then(async r=>{const d=await r.json() as {data:ProjectData;error?:string};if(!r.ok)throw new Error(d.error);setData(d.data);}).catch(e=>setError(e.message));},[token]);return data?<Brochure data={data} share={token}/>:<main className="brochure-loading"><span className="brand">plotera</span><h1>{error||"A place worth discovering."}</h1><p>{error?"Check the link with the developer.":"Opening the site plan…"}</p></main>;}
