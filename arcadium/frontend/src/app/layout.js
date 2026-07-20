// Layout radice: avvolge OGNI pagina dell'app.
// Imposta la lingua della pagina, carica il tema colori e gli stili globali,
// poi fornisce i due context che servono ovunque:
//   - LanguageProvider -> traduzioni IT/EN (M5-T3);
//   - AuthProvider     -> sessione utente e token JWT (allineato a M4-T3);
//   - NotificationsProvider -> contatori notifiche, es. richieste di amicizia
//     ricevute (change request notifiche sidebar). Sta DENTRO AuthProvider
//     perche' interroga il backend solo con una sessione valida.
// AuthProvider sta DENTRO LanguageProvider così le chiamate al backend partono
// già con la lingua giusta nell'header Accept-Language.

import "@/theme/theme.css"; // palette colori + design token (variabili CSS)
import "./globals.css"; // stili base (reset, sfondo, font)
import { LanguageProvider } from "@/context/LanguageProvider"; // traduzioni IT/EN
import { AuthProvider } from "@/context/AuthProvider"; // sessione utente (JWT)
import { NotificationsProvider } from "@/context/NotificationsProvider"; // contatori notifiche (sidebar)
import { StarField } from "@/components/StarField/StarField";
import SplashCursor from "@/components/SplashCursor/SplashCursor"; // export default: niente graffe

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
        {/* Effetto fluido che segue il mouse (M6-T4). Montato DOPO StarField:
            a parità di z-index (-1) viene disegnato sopra le stelle.
            RAINBOW_MODE spento + COLOR violet per restare nella palette del
            tema (il default sarebbe arcobaleno con base rossa). */}
        <SplashCursor RAINBOW_MODE={false} COLOR="#7c5cff" />
        <LanguageProvider>
          <AuthProvider>
            <NotificationsProvider>{children}</NotificationsProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}