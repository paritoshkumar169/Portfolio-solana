"use client"

import { Eye, EyeOff, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NetWorthProps {
  value: number
  solValue: number
  isHidden: boolean
  currency: string
  onToggleVisibility: () => void
}

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  JPY: "¥",
  INR: "₹",
  ZAR: "R",
}

export function NetWorth({ value, solValue, isHidden, currency, onToggleVisibility }: NetWorthProps) {
  const symbol = currencySymbols[currency] || "$"

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Wallet className="h-5 w-5" />
        <h2 className="text-lg font-medium">Net worth</h2>
      </div>

      <div className="flex items-center">
        <div className="text-5xl font-bold">{isHidden ? "****.**" : `${symbol}${value.toFixed(2)}`}</div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-2 text-gray-400 hover:text-white"
          onClick={onToggleVisibility}
        >
          {isHidden ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </Button>
      </div>

      <div className="text-gray-400 mt-1">≈ {isHidden ? "****" : solValue.toFixed(3)} SOL</div>
    </div>
  )
}

