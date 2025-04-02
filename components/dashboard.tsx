"use client";  // Ensures this component is client-side

import { Suspense } from "react";  // Import Suspense
import type React from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Settings, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { CurrencySelector } from "@/components/currency-selector";
import { NetWorth } from "@/components/net-worth";
import { HoldingsChart } from "@/components/holdings-chart";
import HoldingsTable from "@/components/holdings-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePortfolio, type Currency } from "@/hooks/use-portfolio";

export function Dashboard() {
  const [isCurrencySelectorOpen, setIsCurrencySelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToken, setSelectedToken] = useState<string | undefined>(undefined);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const addressParam = searchParams?.get("address");
  const address = addressParam || publicKey?.toBase58();
  const {
    portfolio,
    currency,
    setCurrency,
    isBalanceHidden,
    setIsBalanceHidden,
    utils
  } = usePortfolio(addressParam || undefined);

  // Redirect to landing page
  useEffect(() => {
    if (!connected && !addressParam) {
      router.push("/");
    }
  }, [connected, addressParam, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard?address=${searchQuery}`);
    }
  };

  const handleRefresh = () => {
    const currentAddress = addressParam || publicKey?.toBase58();
    if (currentAddress) {
      router.push(`/dashboard?address=${currentAddress}&t=${Date.now()}`);
    }
  };

  if (portfolio.isLoading) {
    return (
      <div className="min-h-screen bg-[#111827] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading portfolio data..</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading Dashboard...</div>}> {/* Wrap the entire Dashboard content with Suspense */}
      <div className="min-h-screen bg-[#111827] text-white">
        <header className="border-b border-[#2a3349] px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <form onSubmit={handleSearch} className="w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search address or .sol domain"
                  className="portfolio-input pl-10 pr-10 py-2 rounded-lg w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">Press Enter</div>
              </div>
            </form>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="portfolio-button-secondary"
                onClick={() => setIsCurrencySelectorOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>

              <WalletMultiButton />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-2xl font-bold">Portfolio</h1>
            <p className="text-gray-300 text-sm">
              SOL Balance: {portfolio.solBalance.toFixed(4)} SOL
            </p>

            <span className="text-gray-400">→</span>
            <span className="text-gray-300">{portfolio.domain || portfolio.address}</span>
            <Button variant="ghost" size="icon" className="text-gray-400" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="text-xs text-gray-500 ml-2">Last refresh a few seconds ago</div>
          </div>

          <div className="grid md:grid-cols-12 gap-6">
            <div className="portfolio-card p-6 md:col-span-5">
              <NetWorth
                value={utils.convertValue(portfolio.totalValue)}
                solValue={portfolio.solBalance}
                isHidden={isBalanceHidden}
                currency={currency}
                onToggleVisibility={() => setIsBalanceHidden(!isBalanceHidden)}
              />
            </div>

            <div className="portfolio-card p-6 md:col-span-7">
              <HoldingsChart
                tokens={portfolio.tokens}
                totalValue={portfolio.totalValue}
                currency={currency}
                convertValue={utils.convertValue}
                selectedToken={selectedToken}
                onSelectToken={setSelectedToken}
              />

              <Tabs defaultValue="platforms" className="mt-6">
                <TabsList className="bg-[#1f2937] w-auto inline-flex">
                  <TabsTrigger value="platforms" className="data-[state=active]:bg-[#2d3748]">
                    Platforms
                  </TabsTrigger>
                  <TabsTrigger value="assets" className="data-[state=active]:bg-[#2d3748]">
                    Assets
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              className="bg-blue-600 hover:bg-blue-700 transition-colors"
              onClick={() => router.push(`/dashboard/transactions${address ? `?address=${address}` : ""}`)}
            >
              Recent Transactions
            </Button>
          </div>

          <div className="mt-6 portfolio-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="4" fill="#1F2937" />
                  <path
                    d="M7 12H17M7 8H17M7 16H13"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Holdings
              </h2>
              <span className="text-xl font-bold">
                {isBalanceHidden
                  ? "****.**"
                  : getCurrencySymbol(currency) + utils.convertValue(portfolio.totalValue).toFixed(2)}
              </span>
            </div>

            <HoldingsTable
              tokens={portfolio.tokens}
              isBalanceHidden={isBalanceHidden}
              currency={currency}
              convertValue={(value) => utils.convertValue(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              selectedToken={selectedToken}
              onSelectToken={setSelectedToken}
            />
          </div>
        </main>

        <CurrencySelector
          isOpen={isCurrencySelectorOpen}
          onClose={() => setIsCurrencySelectorOpen(false)}
          selectedCurrency={currency}
          onSelectCurrency={(value) => setCurrency(value as Currency)}
        />
      </div>
    </Suspense> // Wrap the content in Suspense
  );
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    JPY: "¥",
    INR: "₹",
    ZAR: "R",
  };

  return symbols[currency] || "$";
}
