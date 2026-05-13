import type { Metadata } from "next";
import { Inter, Bebas_Neue, Bangers } from "next/font/google";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const badaboom = Bangers({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-badaboom",
});

import { FloatingActions } from "@/components/FloatingActions";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StorefrontMotion } from "@/components/StorefrontMotion";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VK Store",
    template: "VK Store",
  },
  description:
    "Loja online de roupas, perfumes e acessórios com ofertas selecionadas.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  icons: {
    icon: "/vk-store-white.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${bebas.variable} ${badaboom.variable} min-h-screen font-sans`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <FloatingActions />
        <StorefrontMotion />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
