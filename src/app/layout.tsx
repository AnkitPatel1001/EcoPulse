import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EcoPulse — Your Personal Carbon Coach",
  description:
    "Understand, track, and reduce your carbon footprint through daily actions and personalized insights. Built for Indian urban professionals.",
  keywords: ["carbon footprint", "sustainability", "eco", "India", "climate"],
  openGraph: {
    title: "EcoPulse",
    description: "Your personal carbon-awareness coach",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      >
        {/* Skip navigation — accessibility requirement */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AppProvider>
          <div className="min-h-full bg-warm-50">{children}</div>
        </AppProvider>
      </body>
    </html>
  );
}
