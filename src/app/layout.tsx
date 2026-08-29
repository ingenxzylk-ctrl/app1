import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { QuizProvider } from "@/context/QuizContext";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Facial Skin Analysis",
  description:
    "A cosmetic facial skin assessment — surface traits mapped to treatment pathways, not prescriptions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${outfit.variable} font-sans antialiased`}>
        <QuizProvider>{children}</QuizProvider>
      </body>
    </html>
  );
}
