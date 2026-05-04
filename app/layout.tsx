import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "THUNDER REHABILITACIÓN",
  description: "Lic. Franco Henriquez",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "THUNDER REHABILITACIÓN",
  },
};

export const viewport = {
  themeColor: "#FAD700",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // El usuario solicitó modo oscuro por defecto.
  return (
    <html lang="es" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
