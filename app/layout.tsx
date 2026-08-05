import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/common/theme-provider";
import { VersionProvider } from "@/components/version/version-provider";
import { fetchAllVersions, fetchCurrentVersionInfo } from "@/services/version.service";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const APP_TITLE = "Taaruf Management System - SMKN 1 Cimahi";
const APP_DESC = "Sistem Manajemen Taaruf RPL SMKN 1 Cimahi";

export const metadata: Metadata = {
  title: {
    default: APP_TITLE,
    template: `%s | Taaruf Management System`,
  },
  description: APP_DESC,
  keywords: ["Taaruf", "SMKN 1 Cimahi", "RPL", "TMS", "Management System", "Sistem Taaruf"],
  authors: [{ name: "Seo Daffaa Pramudya" }],
  creator: "Seo Daffaa Pramudya",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://tms-smkn1cimahi.vercel.app",
    title: APP_TITLE,
    description: APP_DESC,
    siteName: "Taaruf Management System (TMS)",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_TITLE,
    description: APP_DESC,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentVersion, allVersions] = await Promise.all([
    fetchCurrentVersionInfo(),
    fetchAllVersions(),
  ]);

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <VersionProvider
            initialCurrentVersion={currentVersion}
            initialAllVersions={allVersions}
          >
            {children}
            <Toaster position="top-right" richColors />
          </VersionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
