import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KaamCrow — Task Management",
  description: "Dark, focused task management. Every task, a wing beat.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-crow-void text-crow-text`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
