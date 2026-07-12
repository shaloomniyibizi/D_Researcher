import type { Metadata } from "next";
import "./globals.css";
import { RootProvider } from "@/components/providers/root-provider";

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
      className="h-full font-serif antialiased dark"
    >
      <body className="min-h-full flex flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
