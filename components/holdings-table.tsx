import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { TokenWithPrice } from "@/lib/api"

interface Props {
  tokens: TokenWithPrice[]
  isBalanceHidden: boolean
  currency: string
  convertValue: (value: number) => string
  selectedToken?: string
  onSelectToken?: (mint: string) => void
}

export default function HoldingsTable({
  tokens,
  isBalanceHidden,
  currency,
  convertValue,
  selectedToken,
  onSelectToken,
}: Props) {
  const [hideZeroBalances, setHideZeroBalances] = useState(false)
  
  const filteredTokens = hideZeroBalances 
  ? tokens.filter(token => token.uiAmount > 0)
  : tokens

  if (!filteredTokens || filteredTokens.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        No tokens found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end space-x-2">
        <Switch 
          id="hide-zero-balances" 
          checked={hideZeroBalances}
          onCheckedChange={setHideZeroBalances}
        />
        <Label htmlFor="hide-zero-balances">Hide zero balances</Label>
      </div>
      
      <div className="rounded-xl border bg-background text-sm shadow-sm">
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full min-w-[600px]">
            <thead className="border-b text-muted-foreground sticky top-0 bg-background z-10">
              <tr className="text-left">
                <th className="px-4 py-2 font-normal">Token</th>
                <th className="px-4 py-2 font-normal">Amount</th>
                <th className="px-4 py-2 font-normal">Value</th>
                <th className="px-4 py-2 font-normal hidden md:table-cell">Mint</th>
              </tr>
            </thead>
            <tbody>
              {filteredTokens.map((token) => (
                <tr 
                  key={token.mint} 
                  className={cn(
                    "border-b hover:bg-accent/30 cursor-pointer",
                    selectedToken === token.mint && "bg-accent/50"
                  )}
                  onClick={() => onSelectToken?.(token.mint)}
                >
                  <td className="flex items-center gap-2 px-4 py-3">
                    {token.logoURI ? (
                      <Image
                        src={token.logoURI || "/placeholder.svg"}
                        alt={token.symbol}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-[20px] h-[20px] rounded-full bg-muted" />
                    )}
                    <div className="flex flex-col">
                      {token.symbol || token.mint.substring(0, 4)}
                      <span className="font-medium text-muted-foreground">
                        {token.symbol || token.mint.substring(0, 8)}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {isBalanceHidden ? (
                      <span className="blur-sm select-none">•••</span>
                    ) : (
                      token.uiAmount.toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      })
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {isBalanceHidden ? (
                      <span className="blur-sm select-none">•••</span>
                    ) : (
                      convertValue(token.value)
                    )}
                  </td>

                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    <span className="text-xs">{token.mint.slice(0, 8)}...</span>
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

