// Layout radice: avvolge OGNI pagina dell'app.
// Imposta la lingua della pagina, carica il tema colori e gli stili globali,
// poi fornisce i due context che servono ovunque:
//   - LanguageProvider -> traduzioni IT/EN (M5-T3);
//   - AuthProvider     -> sessione utente e token JWT (allineato a M4-T3).
// AuthProvider sta DENTRO LanguageProvider così le chiamate al backend partono
// già con la lingua giusta nell'header Accept-Language.

import "@/theme/theme.css"; // palette colori + design token (variabili CSS)
import "./globals.css"; // stili base (reset, sfondo, font)
import { LanguageProvider } from "@/context/LanguageProvider"; // traduzioni IT/EN
import { AuthProvider } from "@/context/AuthProvider"; // sessione utente (JWT)
import { StarField } from "@/components/StarField/StarField";

// Testo mostrato nella scheda del browser e ai motori di ricerca.
export const metadata = {
  title: "Arcadium",
  description: "La tua libreria di giochi Steam, in un unico posto.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>
        <StarField />
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
