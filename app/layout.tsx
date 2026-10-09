import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Titillium_Web } from "next/font/google";
import { InstallPrompt } from "@/components/install/InstallPrompt";
import { HistoryTracker } from "@/components/layout/BackButton";
import { SearchShortcut } from "@/components/layout/SearchShortcut";
import { ServiceWorker } from "@/components/layout/ServiceWorker";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { TabBar } from "@/components/layout/TabBar";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import { Toaster } from "@/components/ui/Toast";
import {
  DEFAULT_IMAGE,
  GSC_VERIFICATION,
  IS_PRODUCTION,
  NOINDEX,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  socialImage,
} from "@/lib/metadata";
import { INSTALL_SCRIPT } from "@/lib/install";
import { ACCENT_SCRIPT } from "@/lib/settings";
import "./globals.css";

const titillium = Titillium_Web({
  variable: "--font-titillium",
  weight: ["400", "600", "700", "900"],
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  weight: ["500", "700"],
  subsets: ["latin"],
});

// Defaults for every page. Pages set their own title, description, canonical
// URL and social cards with pageMetadata().
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // Home screen app on iOS. The status bar draws over the page, so the top
  // of the page needs env(safe-area-inset-top).
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: socialImage(DEFAULT_IMAGE, SITE_NAME),
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: socialImage(DEFAULT_IMAGE, SITE_NAME),
  },
  ...(!IS_PRODUCTION && { robots: NOINDEX }),
  // Google Search Console ownership check, production only
  ...(IS_PRODUCTION &&
    GSC_VERIFICATION && { verification: { google: GSC_VERIFICATION } }),
};

export const viewport: Viewport = {
  // The status bar on Android, and the browser bar where it's tinted
  themeColor: "#0B0B0D",
  colorScheme: "dark",
  // The page draws under the notch and home indicator, and pads itself with
  // env(safe-area-inset-*)
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The accent script sets a style on <html> before React hydrates
    <html
      lang="en"
      className={`${titillium.variable} ${jetbrains.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ACCENT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: INSTALL_SCRIPT }} />
      </head>
      {/* Below 768px the body reserves room for the fixed tab bar */}
      <body className="flex min-h-full flex-col pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] max-md:pb-[calc(52px+max(12px,env(safe-area-inset-bottom)))]">
        {/* Covers the iOS status bar (translucent in the installed app) so the
            page never scrolls underneath the clock and notch */}
        <div
          aria-hidden
          className="fixed inset-x-0 top-0 z-30 h-[env(safe-area-inset-top)] bg-background"
        />
        <SettingsProvider>
          <a
            href="#main"
            className="fixed top-2 left-2 z-30 -translate-y-20 rounded-md bg-text px-4 py-2.5 font-bold text-background focus:translate-y-0"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col gap-3.5 px-4 pb-6 outline-none md:px-6 lg:gap-5 lg:pb-12"
          >
            {children}
          </main>
          <SiteFooter />
          <TabBar />
          <Suspense>
            <HistoryTracker />
            <ServiceWorker />
            <InstallPrompt />
          </Suspense>
          <SearchShortcut />
          <Toaster />
        </SettingsProvider>
      </body>
    </html>
  );
}
