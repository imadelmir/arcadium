// =============================================================================
// Client HTTP verso il backend Spring Boot (M4).
// -----------------------------------------------------------------------------
// Punto UNICO da cui passa ogni chiamata al backend. Si occupa di:
//   - comporre l'URL a partire da NEXT_PUBLIC_API_URL + il path /api/...;
//   - allegare il token JWT (se presente) come header "Authorization: Bearer";
//   - mandare l'header "Accept-Language" (it|en) per i messaggi localizzati
//     del server (M4-T4);
//   - serializzare/deserializzare JSON;
//   - trasformare gli errori del backend (forma ApiError) in un oggetto
//     JS uniforme (classe ApiError) che le pagine possono mostrare all'utente.
//
// I moduli per risorsa (auth.js, games.js, ...) chiamano SOLO le funzioni di
// questo file: così l'URL, gli header e la gestione errori stanno in un posto
// solo e restano allineati al backend.
//
// Nota: token e lingua vivono in localStorage, quindi queste chiamate vanno
// fatte lato browser (componenti "use client"). Per il nostro caso d'uso (SPA
// dietro login) va bene così.
// =============================================================================

// URL base del backend. Il default vale per lo sviluppo locale; in staging si
// sovrascrive con la variabile d'ambiente.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Chiavi di localStorage (il token dell'utente e la lingua scelta).
// La chiave della lingua è la stessa usata dall'i18n (M5-T3): un'unica fonte.
const TOKEN_KEY = "arcadium-token";
const LANG_KEY = "arcadium-lang";

// -----------------------------------------------------------------------------
// Errore applicativo uniforme.
// Rispecchia il DTO ApiError del backend { status, error, message, fieldErrors }.
// Le pagine possono fare: catch (e) { if (e.status === 409) ... }.
// -----------------------------------------------------------------------------
export class ApiError extends Error {
  constructor(status, message, fieldErrors = null, payload = null) {
    super(message || `Errore ${status}`);
    this.name = "ApiError";
    this.status = status;              // codice HTTP (es. 401, 404, 409)
    this.fieldErrors = fieldErrors;    // errori di validazione per campo (M4-T12)
    this.payload = payload;            // corpo grezzo, se serve
  }
}

// -----------------------------------------------------------------------------
// Gestione del token JWT (memorizzato nel browser tra una visita e l'altra).
// -----------------------------------------------------------------------------
export function getToken() {
  if (typeof window === "undefined") return null; // niente localStorage lato server
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  setToken(null);
}

// Lingua corrente per l'header Accept-Language (default "it").
function currentLang() {
  if (typeof window === "undefined") return "it";
  return window.localStorage.getItem(LANG_KEY) || "it";
}

// -----------------------------------------------------------------------------
// Costruzione della query string (?page=0&size=20&sort=name,asc...).
// Ignora i valori nulli/vuoti così i filtri non impostati non finiscono nell'URL.
// -----------------------------------------------------------------------------
function buildQuery(params) {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    // sort può essere una lista (es. ["price","desc"] -> "price,desc")
    if (Array.isArray(value)) search.append(key, value.join(","));
    else search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// -----------------------------------------------------------------------------
// Funzione centrale: esegue la richiesta e restituisce il JSON già pronto.
//
//   request("/api/games", { params: { q: "half" } })
//   request("/api/auth/login", { method: "POST", body: { username, password }, auth: false })
//
// Opzioni:
//   - method: "GET" (default) | "POST" | "PATCH" | "DELETE" | ...
//   - body:   oggetto JS -> inviato come JSON (niente body per GET/DELETE)
//   - params: oggetto -> diventa query string
//   - auth:   true (default) allega il token; false per endpoint pubblici
//             (login/registrazione)
// -----------------------------------------------------------------------------
async function request(path, { method = "GET", body, params, auth = true } = {}) {
  const headers = {
    Accept: "application/json",
    "Accept-Language": currentLang(),
  };

  // Il token si allega solo se richiesto e se esiste.
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  // Il Content-Type si mette solo quando c'è davvero un corpo JSON da inviare.
  const init = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(params)}`, init);
  } catch {
    // fetch fallisce (backend spento, rete assente, CORS...): errore "di rete".
    throw new ApiError(0, "network");
  }

  // 204 No Content (es. DELETE andato a buon fine): nessun corpo da leggere.
  if (response.status === 204) return null;

  // Proviamo a leggere il JSON; alcuni errori potrebbero non averlo.
  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null; // corpo non-JSON: lo ignoriamo, resta il codice di stato
    }
  }

  // Risposta di errore: costruiamo un ApiError leggendo la forma del backend.
  if (!response.ok) {
    const message = data?.message || response.statusText;
    throw new ApiError(response.status, message, data?.fieldErrors ?? null, data);
  }

  return data;
}

// Scorciatoie leggibili per i moduli per risorsa.
export const api = {
  get: (path, params, opts = {}) => request(path, { ...opts, method: "GET", params }),
  post: (path, body, opts = {}) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts = {}) => request(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts = {}) => request(path, { ...opts, method: "DELETE" }),
};

export default api;
