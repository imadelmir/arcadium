"use client";

// AuthProvider — stato di autenticazione dell'intera app (JWT).
// Mette a disposizione l'utente loggato e il token tramite l'hook useAuth().
// Va inserito una volta nel layout radice, dentro il LanguageProvider.

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authApi from "@/lib/api/auth";
import { changeUsername as changeUsernameApi } from "@/lib/api/users";
import { setToken, clearToken, getToken } from "@/lib/api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true finché non sappiamo se c'è già una sessione

  // Al montaggio: se c'è un token salvato, proviamo a recuperare l'utente.
  useEffect(() => {
    let attivo = true;
    async function idrata() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (attivo) setUser(me);
      } catch {
        clearToken(); // token scaduto/non valido
        if (attivo) setUser(null);
      } finally {
        if (attivo) setLoading(false);
      }
    }
    idrata();
    return () => {
      attivo = false;
    };
  }, []);

  // Login: salva token + utente.
  const login = useCallback(async (username, password) => {
    const res = await authApi.login(username, password);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  // Registrazione: il backend restituisce già un token, quindi si resta loggati.
  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  // Logout: cancella token e stato utente.
  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // Ricarica l'utente da GET /api/auth/me (M6-T4).
  // Serve quando qualcosa cambia il profilo lato server e lo stato in memoria
  // resterebbe vecchio: es. dopo aver collegato o scollegato Steam, `user.steamId`
  // deve aggiornarsi senza costringere l'utente a rifare il login.
  const refresh = useCallback(async () => {
    if (!getToken()) return null;
    try {
      const me = await authApi.me();
      setUser(me);
      return me;
    } catch {
      return null; // il chiamante mostra già il proprio messaggio di errore
    }
  }, []);

  // Cambio username (V16): il backend restituisce un token NUOVO (il subject del
  // JWT è lo username), quindi si sostituisce il token salvato e si aggiorna
  // l'utente in memoria. Senza questo, la richiesta successiva userebbe il token
  // vecchio (subject inesistente) e l'utente verrebbe sloggato.
  const changeUsername = useCallback(async (username) => {
    const res = await changeUsernameApi(username);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    refresh,
    changeUsername,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook di accesso. Errore chiaro se usato fuori dal provider.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth deve essere usato dentro <AuthProvider>.");
  }
  return ctx;
}
