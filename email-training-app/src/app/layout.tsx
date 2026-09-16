import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-Mail-Trainer",
  description: "Interaktive E-Mail-Schreibuebungen mit KI-Feedback.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
