"use client"

import type { TokenWithPrice } from "@/lib/api"

interface HoldingsTableProps {
  tokens: TokenWithPrice[]
  isBalanceHidden: boolean
  currency: string
  convertValue: (value: number) => number
}

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  JPY: "¥",
  INR: "₹",
  ZAR: "R",
}

export function HoldingsTable({ tokens, isBalanceHidden, currency, convertValue }: HoldingsTableProps) {
  const symbol = currencySymbols[currency] || "$"

  // Sort tokens by value
  const sortedTokens = [...tokens]
    .filter((token) => token.value !== undefined)
    .sort((a, b) => (b.value || 0) - (a.value || 0))

  if (sortedTokens.length === 0) {
    return <div className="text-center py-8 text-gray-400">No tokens found for this wallet</div>
  }

  return (
    <div className="overflow-x-auto -mx-6">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[#2a3349]">
                <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-400">
                  Asset
                </th>
                <th scope="col" className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                  Balance
                </th>
                <th scope="col" className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTokens.map((token) => (
                <tr key={token.mint} className="border-b border-[#2a3349] hover:bg-[#1f2937]/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#2d3748] flex items-center justify-center text-xs">
                        {token.metadata?.symbol || token.mint.substring(0, 4)}
                      </div>
                      <span className="font-medium">{token.metadata?.name || token.mint.substring(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {isBalanceHidden
                      ? "****"
                      : token.uiAmount.toLocaleString(undefined, {
                          maximumFractionDigits: token.uiAmount < 0.01 ? 8 : 2,
                        })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {token.price ? `${symbol}${convertValue(token.price).toFixed(token.price < 0.01 ? 6 : 2)}` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    {isBalanceHidden ? "****.**" : `${symbol}${convertValue(token.value || 0).toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

