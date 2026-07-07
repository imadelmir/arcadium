// Helper per i prezzi
// -----------------------------------------------------------------------------
// I prezzi sono memorizzati in centesimi (numeri interi) per evitare errori di
// arrotondamento in virgola mobile, e formattati in euro per la
// visualizzazione. Usati dal negozio (M5 - T8) e riutilizzabili in seguito da
// wishlist/libreria.

// Applica una percentuale di sconto (0..100) a un prezzo in centesimi,
// arrotondando al centesimo.
export function discountedPrice(priceCents, discount = 0) {
  if (!discount) return priceCents; // nessuno sconto: prezzo invariato
  return Math.round(priceCents * (1 - discount / 100));
}

// Formattatore euro in stile italiano (es. 1999 -> "19,99 €").
const euro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

// Formatta un prezzo in centesimi come stringa in euro.
export function formatPrice(priceCents) {
  return euro.format((priceCents ?? 0) / 100);
}