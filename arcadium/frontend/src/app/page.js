// Rotta home ("/").
// Non abbiamo una schermata home dedicata: mandiamo l'utente direttamente al
// Negozio (il catalogo), che è la prima voce reale della sidebar e la pagina
// da cui parte la demo. (Prima puntava a "/panoramica", rotta che non esiste.)
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/negozio");
}
