// =============================================================================
// Traduzione lato client (lib/translate.js)
// -----------------------------------------------------------------------------
// La descrizione dei giochi (aboutTheGame) arriva dal dataset Steam nella lingua
// originale: spesso inglese, ma anche cinese, giapponese o coreano. Qui:
//   1) riconosciamo la lingua di partenza (detectLang, euristica su Unicode);
//   2) traduciamo verso la lingua scelta (IT o EN) con MyMemory, API gratuita
//      senza chiave e con CORS abilitato.
//
// Per le coppie SENZA inglese (es. cinese -> italiano) passiamo dall'inglese
// come lingua "ponte" (cinese -> inglese -> italiano): il passaggio X -> inglese
// è quello meglio supportato, quindi il risultato è molto più affidabile che
// tradurre direttamente cinese -> italiano.
//
// MyMemory limita ogni richiesta (~500 byte): per i testi lunghi — e il cinese/
// giapponese "pesa" di più in byte — spezziamo in blocchi rispettando un budget
// di byte, ai confini di frase (punteggiatura latina E cinese/giapponese).
//
// NB: è traduzione automatica (buona, non perfetta) e dipende da un servizio
// esterno con limiti di frequenza. La soluzione definitiva resta tradurre una
// volta sola nell'ETL/backend e salvare i testi nel DB.
// =============================================================================

const ENDPOINT = "https://api.mymemory.translated.net/get";
const MAX_BYTES = 450; // margine sotto il limite (~500 byte) di MyMemory

// Email di contatto per MyMemory: aggiungendo il parametro `de` il limite
// gratuito sale da ~5.000 a ~50.000 parole al giorno. Metti QUI una tua email
// vera (basta un indirizzo valido, non serve registrarsi). Se la lasci vuota,
// funziona lo stesso ma con la quota più bassa.
const CONTACT_EMAIL = "arcadium.dev@example.com";

const encoder = new TextEncoder();
const byteLen = (s) => encoder.encode(s).length;

// --- Riconoscimento lingua di partenza -------------------------------------
// Euristica sui blocchi Unicode:
//   - Hangul  -> coreano
//   - Kana (hiragana/katakana) -> giapponese (anche se ci sono kanji)
//   - Solo ideogrammi Han (senza kana) -> cinese
//   - Altrimenti alfabeto latino -> assumiamo inglese
// Restituisce un codice compatibile con MyMemory (en, it, ja, ko, zh-CN).
export function detectLang(text) {
  if (!text) return "en";
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) return "ko";
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "ja";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh-CN";
  return "en";
}

// Spezza il testo in blocchi entro MAX_BYTES senza tagliare le frasi a metà.
// Include i delimitatori CJK (。！？) oltre a quelli latini (.!?) e i ritorni a capo.
function splitIntoChunks(text) {
  const pieces = text.match(/[^.!?。！？\n]+[.!?。！？\n]*\s*/g) || [text];
  const chunks = [];
  let current = "";

  for (const piece of pieces) {
    // Pezzo singolo troppo lungo: lo spezziamo per caratteri, rispettando i byte.
    if (byteLen(piece) > MAX_BYTES) {
      if (current) { chunks.push(current); current = ""; }
      let buf = "";
      for (const ch of piece) { // itera per code point (gestisce i surrogati)
        if (buf && byteLen(buf + ch) > MAX_BYTES) { chunks.push(buf); buf = ""; }
        buf += ch;
      }
      if (buf) current = buf; // il resto continua ad accumularsi
      continue;
    }
    // Aggiungere questo pezzo sforerebbe il budget: chiudo il blocco corrente.
    if (current && byteLen(current + piece) > MAX_BYTES) {
      chunks.push(current);
      current = "";
    }
    current += piece;
  }
  if (current) chunks.push(current);
  return chunks;
}

// Traduce un singolo blocco. Lancia un errore se l'API non risponde bene o se
// segnala il raggiungimento dei limiti (quota / lunghezza).
async function translateChunk(text, from, to) {
  let url = `${ENDPOINT}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}`;
  // `de` alza la quota giornaliera gratuita di MyMemory (vedi CONTACT_EMAIL).
  if (CONTACT_EMAIL) url += `&de=${encodeURIComponent(CONTACT_EMAIL)}`;

  const res = await fetch(url);
  // 429 = troppe richieste / quota giornaliera esaurita: errore chiaro e stop
  // (il componente mostra l'originale con l'avviso, senza ritentare a vuoto).
  if (res.status === 429) throw new Error("translate quota (429)");
  if (!res.ok) throw new Error(`translate http ${res.status}`);

  const data = await res.json();
  if (data?.responseStatus && Number(data.responseStatus) !== 200) {
    throw new Error(`translate api ${data.responseStatus}`);
  }
  const out = data?.responseData?.translatedText;
  if (!out) throw new Error("translate empty");
  // MyMemory a volte restituisce 200 mettendo l'avviso di limite nel testo.
  if (/^(MYMEMORY WARNING|QUERY LENGTH LIMIT EXCEEDED)/i.test(out)) {
    throw new Error("translate limit");
  }
  return out;
}

// Traduzione diretta (una lingua verso l'altra), blocco per blocco in sequenza.
async function translateDirect(text, from, to) {
  const chunks = splitIntoChunks(text);
  const out = [];
  for (const chunk of chunks) {
    out.push(await translateChunk(chunk, from, to));
  }
  return out.join("").trim();
}

// Traduce un testo intero da `from` a `to`.
//   - se le lingue coincidono, restituisce il testo invariato;
//   - se nessuna delle due è inglese (es. cinese -> italiano), passa DALL'INGLESE
//     come ponte: cinese -> inglese -> italiano (più affidabile);
//   - altrimenti traduce direttamente.
export async function translateText(text, { from = "en", to = "it" } = {}) {
  if (!text || !text.trim()) return text;
  if (from === to) return text;

  if (from !== "en" && to !== "en") {
    const english = await translateDirect(text, from, "en");
    return translateDirect(english, "en", to);
  }
  return translateDirect(text, from, to);
}