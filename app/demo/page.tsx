import DemoBrochure from "./brochure";
import {makeLayout,seedProject} from "../../lib/domain";
export default async function Demo({searchParams}:{searchParams:Promise<{layout?:string}>}){
  const layout=Number((await searchParams).layout||0);
  const data=seedProject();
  if(layout===1||layout===2){
    Object.assign(data,makeLayout(layout===1?5:4,4),{
      name:layout===1?"Palm Grove":"The Ridge",location:"Illustrative sample project"
    });
  }
  return <DemoBrochure data={data}/>;
}
