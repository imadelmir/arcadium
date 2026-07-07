// Percorso principale ("/").
// Non disponiamo ancora di una schermata iniziale dedicata, quindi
// reindirizziamo direttamente l'utente alla pagina "Panoramica"
// (il primo elemento della barra laterale).
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/panoramica");
}
