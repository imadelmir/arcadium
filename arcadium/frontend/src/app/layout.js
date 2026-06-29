// Root layout: wraps EVERY page in the app.
// It sets the page language, loads the colour theme and the global
// styles, then renders whatever page the router gives us as "children".

import "@/theme/theme.css"; // colour palette + design tokens (CSS variables)
import "./globals.css";     // base styles (reset, background, font)
import { LanguageProvider } from "@/context/LanguageProvider"; // IT/EN translations

// Text shown in the browser tab and by search engines.
export const metadata = {
  title: "Arcadium",
  description: "La tua libreria di giochi Steam, in un unico posto.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
