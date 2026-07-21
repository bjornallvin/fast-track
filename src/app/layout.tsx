import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import Footer from "@/components/Footer";
import AdminLink from "@/components/AdminLink";
import RegisterSW from "@/components/RegisterSW";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Fast Track",
  description: "A quiet fasting tracker — real-time timer, wellbeing check-ins, and group fasts.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Fast Track",
    statusBarStyle: "default",
  },
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4ede0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${fraunces.variable} ${inter.variable} antialiased min-h-full flex flex-col`}
        suppressHydrationWarning={true}
      >
        <RegisterSW />
        <AdminLink />
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
