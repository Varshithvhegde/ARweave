import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ARweave — Browser WebAR Platform", template: "%s | ARweave" },
  description:
    "Create stunning AR experiences in minutes. Upload a 3D model, set your marker image, and share a link. No app needed — pure browser WebAR.",
  keywords: ["WebAR", "augmented reality", "AR builder", "no-code AR", "3D web", "QR AR"],
  openGraph: {
    title: "ARweave — Browser WebAR Platform",
    description: "Create AR experiences that run in any mobile browser. No app, no code.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
