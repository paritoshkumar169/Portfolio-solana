"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { resolveSolDomain } from "@/lib/api" // ✅ Add this import

export function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { connected } = useWallet()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    if (searchQuery.endsWith(".sol")) {
      const resolved = await resolveSolDomain(searchQuery)
      if (resolved) {
        router.push(`/dashboard?address=${resolved}`)
      } else {
        alert("Invalid .sol domain")
      }
    } else {
      router.push(`/dashboard?address=${searchQuery}`)
    }
  }

  // Redirect to dashboard
  useEffect(() => {
    if (connected) {
      router.push("/dashboard")
    }
  }, [connected, router])

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col">
      <div className="absolute inset-0 bg-[url('/solana-bg.jpg')] bg-cover bg-center opacity-20"></div>

      <header className="relative z-10 container mx-auto p-4 flex justify-end gap-2">
        <WalletMultiButton />
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-4">Solana Portfolio Tracker</h1>
          <p className="text-xl text-gray-300 mb-8">Check How Much Money You and Your degen friends are losing on shitcoins</p>

          <form onSubmit={handleSearch} className="mb-6 w-full max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search a Solana address or enter a .sol Domain"
                className="portfolio-input pl-10 pr-10 py-6 rounded-lg w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">Press Enter</div>
            </div>
          </form>

          <div className="w-full max-w-xl mx-auto landing-wallet-button">
            <WalletMultiButton />
          </div>

          <p className="mt-4 text-gray-400">
         
          </p>
        </div>
      </main>
    </div>
  )
}
