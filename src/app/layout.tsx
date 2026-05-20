import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "*arr Ecosystem Dashboard",
  description: "Unified dashboard for Radarr, Sonarr, Prowlarr, Bazarr, and Jellyseerr",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
