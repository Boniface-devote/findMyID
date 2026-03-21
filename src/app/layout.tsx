import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FindMyID - Lost ID & Document Recovery Platform",
  description: "Helping people recover lost identification documents. Report found documents or search for your lost IDs, passports, and licenses.",
  keywords: ["FindMyID", "Lost ID", "Document Recovery", "Lost Passport", "Lost License", "ID Recovery"],
  authors: [{ name: "FindMyID Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "FindMyID - Lost ID & Document Recovery",
    description: "Helping people recover lost identification documents through community cooperation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
