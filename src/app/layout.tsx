import type { Metadata } from "next";
import { Newsreader, Noto_Serif, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

const notoSerif = Noto_Serif({
  variable: "--noto-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ordo Diei",
  description: "Sancta rutina diei ad animam fovendam et Deum laudandum.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${newsreader.variable} ${notoSerif.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var s = JSON.parse(localStorage.getItem('ordo-diei-theme') || '{}');
              if (s && s.state && s.state.darkMode === true) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch(e) { document.documentElement.classList.remove('dark'); }
          })();
        `}} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
