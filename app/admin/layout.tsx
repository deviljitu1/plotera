import {redirect} from "next/navigation";
import {getChatGPTUser} from "../chatgpt-auth";
import "../globals.css";
import "../studio-redesign.css";
export const metadata={title:"Project admin | Plotera",robots:{index:false,follow:false}};
export default async function AdminLayout({children}:{children:React.ReactNode}){
  if(!await getChatGPTUser())redirect("/signin-with-chatgpt?return_to=/admin");
  return children;
}
