import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { JourneyProvider } from "@/components/providers/JourneyProvider";
import PwaRegister from "@/components/pwa/pwa-register";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const plusJakarta = Plus_Jakarta_Sans({ variable: "--font-plus-jakarta", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HostSphere — Luxury Hospitality Management",
  description: "HostSphere multi-vertical hospitality and space management suite.",
  icons: [
    { rel: "icon", url: "/favicon.png", type: "image/png" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
  ],
  manifest: "/manifest.json",
  applicationName: "HostSphere",
  appleWebApp: {
    capable: true,
    title: "HostSphere",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#131320" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} ${playfair.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("hs-theme");if(t==="dark"||(!t&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark");var dt=localStorage.getItem("hs-dark-theme");if(dt==="aurora"||dt==="satrana"||dt==="regal")document.documentElement.setAttribute("data-dark-theme",dt);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <SettingsProvider>
          <JourneyProvider>
            {children}
            <Toaster position="top-right" />
            <PwaRegister />
          </JourneyProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
