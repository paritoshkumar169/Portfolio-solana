import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletContextProvider } from "@/components/wallet-provider"; // Import the WalletContextProvider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solana Portfolio Tracker",
  description: "Check How Much Money You and Your degen friends are losing on shitcoins",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {/* Wrap the entire app with WalletContextProvider */}
          <WalletContextProvider>
            {children} {/* All pages will be wrapped by the WalletContextProvider */}
          </WalletContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
