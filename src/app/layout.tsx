import type { Metadata, Viewport } from "next";
import "./globals.css";
import { OfflineBanner } from "@/modules/auth/components/OfflineBanner";
import { PwaProvider } from "./PwaProvider";
import { AppConfigProvider } from "@/modules/i18n/AppContext";

export const metadata: Metadata = {
  title: "Trustline365",
  description: "Building financial trust for Africa's informal economy.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trustline365",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0D7C66",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PwaProvider>
          <AppConfigProvider>
            <OfflineBanner />
            {children}
          </AppConfigProvider>
        </PwaProvider>
      </body>
    </html>
  );
}

