"use client";

// =============================================================================
// RequireAuth — guardia di rotta del gruppo (app) (M6-T4).
// -----------------------------------------------------------------------------
// Prima non esisteva alcuna protezione: solo "/" reindirizzava a /login, ma
// chiunque digitasse /libreria, /backlog o /statistiche senza sessione vedeva
// l'interfaccia montarsi e sparare una raffica di 401 al backend, restando poi
// su una pagina vuota senza capire perché.
//
// Qui si aspetta che l'AuthProvider abbia finito di idratare la sessione
// (`loading`), poi:
//   - se l'utente è autenticato -> si mostra la pagina;
//   - altrimenti -> redirect a /login e, nel frattempo, NIENTE contenuto (così
//     non parte nessuna chiamata delle pagine figlie: i loro effetti non
//     vengono mai montati).
//
// Il redirect sta in un effetto perché non si può navigare durante il render.
// =============================================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { Spinner } from "@/components/Spinner/Spinner";

export function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Sessione ancora sconosciuta, oppure assente (redirect in corso): non
  // montiamo le pagine figlie.
  if (loading || !isAuthenticated) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return children;
}
