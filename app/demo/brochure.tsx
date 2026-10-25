"use client";
import {Brochure} from "../studio";
import type {ProjectData} from "../../lib/domain";
export default function DemoBrochure({data}:{data:ProjectData}){
  // A full document navigation keeps the reference homepage styles isolated.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  return <Brochure data={data} onClose={()=>window.location.assign("/")}/>;
}
