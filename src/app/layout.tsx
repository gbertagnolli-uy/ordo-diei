import type { Metadata } from "next";
import { Newsreader, Noto_Serif, Geist_Mono, Geist, Parisienne } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/Toaster";
import Script from "next/script";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

const notoSerif = Noto_Serif({
  variable: "--noto-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Letra manuscrita de la evaluación en el pergamino del premio sorpresa
const parisienne = Parisienne({
  variable: "--font-parisienne",
  subsets: ["latin"],
  weight: "400",
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
      className={cn("h-full", "antialiased", newsreader.variable, notoSerif.variable, parisienne.variable, geistMono.variable, "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="tema-inicial" strategy="beforeInteractive">{`
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
        `}</Script>
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
