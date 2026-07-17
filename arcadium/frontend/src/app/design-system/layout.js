// Gate della rotta /design-system (BUG B, M6).
// -----------------------------------------------------------------------------
// La pagina /design-system e' una vetrina interna dei componenti, utile in
// sviluppo ma che NON deve essere raggiungibile in produzione (finiva nel build
// pubblico). Questo layout e' un SERVER component (niente "use client"): valuta
// NODE_ENV lato server e, in produzione, risponde 404 tramite notFound(). In
// sviluppo la vetrina resta accessibile come prima.
//
// notFound() e' l'API idiomatica di Next per "questa rotta non esiste": in prod
// la pagina diventa 404 senza doverla cancellare, cosi' resta lo strumento di dev.

import { notFound } from "next/navigation";

export default function DesignSystemLayout({ children }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return children;
}
