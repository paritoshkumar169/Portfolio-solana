"use client"

import { useState, useEffect, useCallback } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import {
  fetchPortfolio,
  type PortfolioData
} from "@/lib/api"

export type Currency = "USD" | "EUR" | "JPY" | "INR" | "ZAR"

export interface EnhancedPortfolioData extends PortfolioData {
  currency: Currency
  isBalanceHidden: boolean
  error: string | null
}

export function usePortfolio(address?: string) {
  const { publicKey } = useWallet()

  const [currency, setCurrency] = useState<Currency>("USD")
  const [isBalanceHidden, setIsBalanceHidden] = useState(false)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})

  const [portfolio, setPortfolio] = useState<EnhancedPortfolioData>({
    address: "",
    domain: undefined,
    solBalance: 0,
    tokens: [],
    totalValue: 0,
    isLoading: true,
    error: null,
    currency: "USD",
    isBalanceHidden: false
  })

  // Fetch exchange rates
  useEffect(() => {
    async function fetchExchangeRates() {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/exchange_rates")
        const data = await response.json()

        const rates: Record<string, number> = {}
        Object.entries(data.rates).forEach(([key, value]: [string, any]) => {
          rates[key.toLowerCase()] = value.value
        })

        setExchangeRates(rates)
      } catch (error) {
        console.error("Error fetching exchange rates:", error)
      }
    }

    fetchExchangeRates()
  }, [])

  // Fetch portfolio data
  useEffect(() => {
    async function fetchPortfolioData() {
      try {
        setPortfolio(prev => ({ ...prev, isLoading: true, error: null }))

        const walletAddress = address || publicKey?.toBase58()

        if (!walletAddress) {
          setPortfolio(prev => ({
            ...prev,
            isLoading: false,
            error: "No wallet address provided"
          }))
          return
        }

        const portfolioData = await fetchPortfolio(walletAddress)

        setPortfolio(prev => ({
          ...prev,
          ...portfolioData,
          isLoading: false,
          error: null,
          currency,
          isBalanceHidden
        }))
      } catch (error) {
        console.error("Error fetching portfolio data:", error)
        setPortfolio(prev => ({
          ...prev,
          isLoading: false,
          error: "Failed to fetch portfolio data"
        }))
      }
    }

    if (address || publicKey) {
      fetchPortfolioData()
    }
  }, [publicKey, address])

  // Convert value to selected currency
  const convertValue = useCallback((value: number): number => {
    if (currency === "USD") return value

    const usdRate = exchangeRates.usd || 1
    const targetRate = exchangeRates[currency.toLowerCase()] || 1

    return value * (targetRate / usdRate)
  }, [currency, exchangeRates])

  return {
    portfolio,
    currency,
    setCurrency,
    isBalanceHidden,
    setIsBalanceHidden,
    exchangeRates,
    utils: {
      convertValue
    }
  }
}
