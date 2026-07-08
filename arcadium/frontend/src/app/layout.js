import "@/theme/theme.css";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageProvider";
import { StarField } from "@/components/StarField/StarField";

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