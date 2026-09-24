import { Geist, Geist_Mono, Chivo_Mono, Figtree, Bricolage_Grotesque } from "next/font/google";
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

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

 const chivoMono = Chivo_Mono({
  variable: "--font-chivo-mono",
  subsets: ["latin"], // Specify the necessary subsets
});

export const metadata = {
  title: "Peckodoro",
  description: "A Pomodoro timer with a study assistant and Spotify controls.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${chivoMono.variable} ${figtreeSans.variable} ${bricolage.variable} antialiased h-screen`}
      >
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--shell)",
              color: "var(--ink)",
              border: "2px solid var(--ink)",
              boxShadow: "3px 3px 0 var(--ink)",
              fontFamily: "var(--font-figtree)",
            },
          }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
