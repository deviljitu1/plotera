import {redirect} from "next/navigation";
import {currentUser} from "../../lib/auth";
import "../globals.css";
import "../studio-redesign.css";
export const metadata={title:"Project admin | Plotera",robots:{index:false,follow:false}};
export default async function AdminLayout({children}:{children:React.ReactNode}){
  if(!await currentUser())redirect("/login");
  return children;
}
