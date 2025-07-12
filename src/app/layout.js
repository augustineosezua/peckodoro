import { Geist, Geist_Mono, Chivo_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const figtreeSans = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

 const chivoMono = Chivo_Mono({
  variable: "--font-chivo-mono",
  subsets: ["latin"], // Specify the necessary subsets
});

export const metadata = {
  title: "Peckodoro",
  description: "Peckodoro is the best study tool for all Students",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${chivoMono.variable} ${figtreeSans.variable} antialiased h-screen md:overflow-hidden`}
      >
        <Toaster richColors position="top-center" />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
