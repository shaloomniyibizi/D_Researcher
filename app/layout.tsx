import type { Metadata } from "next";
import "./globals.css";
import { RootProvider } from "@/components/providers/root-provider";
import { Oxanium } from "next/font/google";
import { cn } from "@/lib/utils";

const oxanium = Oxanium({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Researcher - University Research Platform",
  description:
    "Manage the full research lifecycle for students, supervisors, and administrators with AI-powered collaboration and evaluation tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={cn("h-full font-serif antialiased", "font-sans", oxanium.variable)}
    >
      <body className="min-h-full flex flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
