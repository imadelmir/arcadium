// imageColor.js — colore medio estratto dalla copertina di un gioco.
// -----------------------------------------------------------------------------
// Usato dal Backlog (e riusabile ovunque serva un accento "preso dalla cover",
// come già fa la pagina di dettaglio col backdrop sfocato): carica l'immagine,
// la disegna piccola su un canvas fuori schermo e ne calcola il colore medio.
//
// Le copertine arrivano dalla CDN di Steam: se un giorno smettesse di servire
// intestazioni CORS permissive, `ctx.getImageData` lancerebbe un SecurityError
// (canvas "tainted"). In quel caso la funzione risolve a `null`: il chiamante
// deve prevedere un colore di riserva (vedi `gameAccentColor` in BacklogCard).
//
// Risultati in cache per src: la stessa copertina non viene ricalcolata ogni
// volta che il componente si rimonta (riordino del backlog, cambio filtro...).

const cache = new Map(); // src -> Promise<string|null>

const SAMPLE_SIZE = 12; // canvas minuscolo: basta per una media, è veloce

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // richiesto per leggere i pixel dopo il draw
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Restituisce un colore hsl(...) leggibile su sfondo scuro, oppure null se
// l'immagine manca o non è leggibile (CORS, errore di rete).
export async function getAverageColor(src) {
  if (!src) return null;
  if (cache.has(src)) return cache.get(src);

  const promise = (async () => {
    try {
      const img = await loadImage(src);

      const canvas = document.createElement("canvas");
      canvas.width = SAMPLE_SIZE;
      canvas.height = SAMPLE_SIZE;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

      const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 200) continue; // salta i pixel semi-trasparenti (bordi)
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count += 1;
      }
      if (count === 0) return null;
      r /= count; g /= count; b /= count;

      const { h, s } = rgbToHsl(r, g, b);
      // Saturazione/luminosità fissate in una fascia leggibile sullo sfondo
      // scuro dell'app: la TONALITÀ viene dalla cover, il resto resta
      // coerente col tema (stesso trattamento delle altre tinte, es. --game).
      const saturation = Math.max(41, Math.min(s, 85));
      return `hsl(${Math.round(h)}, ${Math.round(saturation)}%, 62%)`;
    } catch {
      return null; // CORS, 404, rete assente, ecc. — fallback lato chiamante
    }
  })();

  cache.set(src, promise);
  return promise;
}