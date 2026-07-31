import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { JourneyProvider } from "@/components/providers/JourneyProvider";
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
    { rel: "apple-touch-icon", url: "/favicon.png" },
  ],
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} ${playfair.variable}`} data-scroll-behavior="smooth">
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <SettingsProvider>
          <JourneyProvider>
            {children}
            <Toaster position="top-right" />
          </JourneyProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
