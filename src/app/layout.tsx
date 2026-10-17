import type { Metadata } from "next";
import { Andika } from "next/font/google";
import "./globals.css";

const andika = Andika({
  variable: "--font-andika",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Pip, your English buddy",
  description: "Pip the owl helps children learn English with sounds, words and play.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${andika.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
