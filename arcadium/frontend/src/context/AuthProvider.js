"use client";

// AuthProvider — stato di autenticazione dell'intera app (JWT).
// Mette a disposizione l'utente loggato e il token tramite l'hook useAuth().
// Va inserito una volta nel layout radice, dentro il LanguageProvider.

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authApi from "@/lib/api/auth";
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

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
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