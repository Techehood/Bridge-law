import type { Metadata } from "next";
import "./globals.css";
// Use the @ alias for absolute reliability on Vercel
import EnterpriseHeader from "@/app/components/Header"; 
import ClientBridgeWrapper from "@/app/components/ClientBridgeWrapper";
export const metadata: Metadata = {
  title: "The Bridge V2.0 | Techembrace",
  description: "Strategic Handoff Engine for Neuro-inclusive Learning",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-[#FDFCFB] text-neutral-800 dark:bg-neutral-900 transition-colors duration-300">
        <div className="min-h-screen flex flex-col">
          <EnterpriseHeader />
          <main className="flex-grow">
            {children}
          </main>
          <ClientBridgeWrapper />
        </div>
      </body>
    </html>
  );
}
