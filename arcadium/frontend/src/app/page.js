// Home route ("/").
// We do not have a dedicated home screen yet, so we send the user
// straight to the "Panoramica" page (the first item in the sidebar).
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/panoramica");
}
