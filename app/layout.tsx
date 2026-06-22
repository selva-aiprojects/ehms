import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { JourneyProvider } from "@/components/providers/JourneyProvider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "eHMS — Enterprise Hospitality Management System",
  description: "Multi-Vertical Hospitality & Space Management Suite",
  icons: [
    { rel: "icon", url: "/favicon.png", type: "image/png" },
    { rel: "apple-touch-icon", url: "/favicon.png" },
  ],
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
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
