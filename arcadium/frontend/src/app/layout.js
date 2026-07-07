// Layout principale: racchiude TUTTE le pagine dell'applicazione.
// Imposta la lingua della pagina, carica il tema dei colori e gli stili
// globali, quindi renderizza la pagina fornita dal router come "children".

import "@/theme/theme.css"; // colour palette + design tokens (CSS variables)
import "./globals.css";     // base styles (reset, background, font)
import { LanguageProvider } from "@/context/LanguageProvider"; // IT/EN translations
import { StarField } from "@/components/StarField/StarField";

// Testo visualizzato nella scheda del browser e dai motori di ricerca.
export const metadata = {
  title: "Arcadium",
  description: "La tua libreria di giochi Steam, in un unico posto.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>
        <StarField />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
