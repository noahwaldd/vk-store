import type { Metadata } from "next";
import Script from "next/script";
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
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { CouponDrawer } from "@/components/CouponDrawer";
import { StorefrontMotion } from "@/components/StorefrontMotion";
import { HideOnAuthRoutes } from "@/components/RouteVisibility";
import { getCouponsSetting } from "@/lib/site-settings";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "VK Store",
    template: "VK Store",
  },
  description:
    "Loja online de roupas, perfumes e acessórios com ofertas selecionadas.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://lojavkstore.com.br",
  ),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/vk-store-white.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const coupons = await getCouponsSetting();

  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${bebas.variable} ${badaboom.variable} min-h-screen font-sans`}
        suppressHydrationWarning
      >
        <Script id="geolocation-fallback" strategy="beforeInteractive">
          {`
            if (typeof window !== "undefined") {
              var geolocationFallback = {
                getCurrentPosition: function (_success, error) {
                  if (typeof error === "function") {
                    error({
                      code: 2,
                      message: "Geolocation unavailable in this browser.",
                      PERMISSION_DENIED: 1,
                      POSITION_UNAVAILABLE: 2,
                      TIMEOUT: 3
                    });
                  }
                },
                watchPosition: function (_success, error) {
                  if (typeof error === "function") {
                    error({
                      code: 2,
                      message: "Geolocation unavailable in this browser.",
                      PERMISSION_DENIED: 1,
                      POSITION_UNAVAILABLE: 2,
                      TIMEOUT: 3
                    });
                  }

                  return 0;
                },
                clearWatch: function () {}
              };

              try {
                if (!window.navigator) {
                  Object.defineProperty(window, "navigator", {
                    configurable: true,
                    value: {}
                  });
                }

                if (!("geolocation" in window.navigator)) {
                  Object.defineProperty(window.navigator, "geolocation", {
                    configurable: true,
                    value: geolocationFallback
                  });
                }
              } catch (_error) {}
            }
          `}
        </Script>
        <HideOnAuthRoutes>
          <Header />
          <CouponDrawer coupons={coupons} />
        </HideOnAuthRoutes>
        <main className="flex-1">{children}</main>
        <HideOnAuthRoutes>
          <Footer />
          <FloatingActions />
        </HideOnAuthRoutes>
        <CookieConsentBanner />
        <StorefrontMotion />
        <Toaster richColors position="bottom-left" offset={20} visibleToasts={3} />
      </body>
    </html>
  );
}
