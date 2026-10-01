import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Sans } from "next/font/google";
import { FeedbackProviders } from "@/components/feedback/feedback-providers";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";

import { APP_BACKGROUND } from "./manifest";

import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recovery Tracker",
  description: "Registro visual y motivante para recuperacion de rodilla.",
  // Installed on the iPhone home screen: full screen, dark status bar, short title under the icon.
  appleWebApp: {
    capable: true,
    title: "Recovery",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  themeColor: APP_BACKGROUND,
  // Lets env(safe-area-inset-*) report the iPhone home indicator, which the tab bar already pads for.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${archivo.variable} ${instrumentSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <FeedbackProviders>{children}</FeedbackProviders>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
