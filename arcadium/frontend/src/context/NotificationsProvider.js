"use client";

// =============================================================================
// NotificationsProvider — contatori delle notifiche dell'app (change request
// notifiche sidebar).
// -----------------------------------------------------------------------------
// Per ora un solo contatore: le richieste di amicizia RICEVUTE e non ancora
// evase, mostrate come pallino numerato sulla voce Community della sidebar.
//
// Perche' un context e non una fetch dentro la Sidebar: il numero cambia da due
// parti (la sidebar lo mostra, la pagina Community lo consuma accettando o
// rifiutando) e devono restare allineate. Con lo stato qui, Community chiama
// refreshNotifications() dopo ogni azione e il pallino si aggiorna subito,
// senza aspettare il polling.
//
// Il polling e' volutamente lento (60s) e si ferma del tutto senza sessione: e'
// una notifica sociale, non un dato critico. In piu' si aggiorna al ritorno
// sulla scheda, che copre il caso reale piu' comune (l'utente torna dopo un po'
// e si aspetta il numero giusto).
// =============================================================================

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { countReceivedRequests } from "@/lib/api/friends";
import { useAuth } from "./AuthProvider";

const NotificationsContext = createContext(null);

// Intervallo di aggiornamento automatico del contatore.
const POLL_MS = 60_000;

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [friendRequests, setFriendRequests] = useState(0);

  // Rilegge il contatore dal backend. Silenzioso in caso di errore: un pallino
  // che non si aggiorna e' un fastidio, un messaggio di errore a schermo per
  // una chiamata di sfondo sarebbe peggio.
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setFriendRequests(0);
      return;
    }
    try {
      const res = await countReceivedRequests();
      setFriendRequests(res?.count ?? 0);
    } catch {
      /* rete o 401: si riprova al giro successivo */
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Senza sessione non si interroga il backend e il contatore si azzera:
    // altrimenti dopo il logout resterebbe visibile il numero del vecchio utente.
    if (!isAuthenticated) {
      setFriendRequests(0);
      return undefined;
    }

    refreshNotifications();
    const id = setInterval(refreshNotifications, POLL_MS);

    // Ritorno sulla scheda: aggiorna subito invece di aspettare il timer.
    const alFocus = () => refreshNotifications();
    window.addEventListener("focus", alFocus);

    return () => {
      clearInterval(id);
      window.removeEventListener("focus", alFocus);
    };
  }, [isAuthenticated, refreshNotifications]);

  const value = { friendRequests, refreshNotifications };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

// Hook di accesso. Errore chiaro se usato fuori dal provider, come useAuth.
export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (ctx === null) {
    throw new Error("useNotifications deve essere usato dentro <NotificationsProvider>.");
  }
  return ctx;
}
