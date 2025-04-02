"use client"

import { useEffect, useState } from "react"
import { fetchRecentTransactions } from "@/lib/api"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

interface TransactionEntry {
  type: string
  source: string
  signature: string
  timestamp?: number
  fee: number
  description?: string
  events?: {
    nativeTransfers?: { fromUserAccount: string; toUserAccount: string; amount: number }[]
    tokenTransfers?: {
      fromUserAccount: string
      toUserAccount: string
      tokenAmount: {
        amount: string
        decimals: number
        tokenName: string
        tokenSymbol: string
      }
    }[]
  }
}

export default function RecentTransactions() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address") || ""
  const [transactions, setTransactions] = useState<TransactionEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [beforeStack, setBeforeStack] = useState<string[]>([])
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined)

  const fetchTx = async (before?: string) => {
    try {
      setIsLoading(true)
      const data = await fetchRecentTransactions(address, 10, before)
      setTransactions(data)
      setCurrentCursor(before)
      setIsLoading(false)
    } catch (err) {
      setError("Failed to fetch transactions.")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (address) {
      fetchTx()
    }
  }, [address])

  const handleNext = () => {
    const lastSig = transactions[transactions.length - 1]?.signature
    if (lastSig) {
      setBeforeStack((prev) => [...prev, currentCursor || ""])
      fetchTx(lastSig)
    }
  }

  const handlePrev = () => {
    const prevCursors = [...beforeStack]
    const prevCursor = prevCursors.pop()
    setBeforeStack(prevCursors)
    fetchTx(prevCursor)
  }

  return (
    <div className="min-h-screen bg-[#111827] text-white px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Recent Transactions</h1>

      {isLoading && <p className="text-gray-400">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!isLoading && transactions.length === 0 && (
        <p className="text-muted-foreground">No transactions found.</p>
      )}

      <div className="space-y-4">
        {transactions.map((tx) => (
          <div key={tx.signature} className="border border-gray-700 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  {tx.timestamp
                    ? new Date(tx.timestamp * 1000).toLocaleString()
                    : "No timestamp"}
                </p>
                <p className="text-white font-medium capitalize">{tx.type.replace(/_/g, " ")}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Fee: {(tx.fee / 1e9).toFixed(6)} SOL
                </p>
                <p className="text-xs text-gray-500 break-all">
                  Signature: {tx.signature.slice(0, 10)}...{tx.signature.slice(-10)}
                </p>
              </div>

              <div className="mt-2 sm:mt-0">
                <a
                  href={`https://solscan.io/tx/${tx.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-sm hover:underline"
                >
                  View on Solscan ↗
                </a>
              </div>
            </div>

            {/* Native Transfers (SOL) */}
            {tx.events?.nativeTransfers?.map((transfer, idx) => (
              <div key={idx} className="text-sm text-gray-300 mt-1">
                {transfer.fromUserAccount === address ? "Sent" : "Received"}{" "}
                {(transfer.amount / 1e9).toFixed(4)} SOL
              </div>
            ))}

            {/* Token Transfers (SPL) */}
            {tx.events?.tokenTransfers?.map((transfer, idx) => (
              <div key={idx} className="text-sm text-gray-300 mt-1">
                {transfer.fromUserAccount === address ? "Sent" : "Received"}{" "}
                {(
                  Number(transfer.tokenAmount.amount) /
                  10 ** transfer.tokenAmount.decimals
                ).toFixed(4)}{" "}
                {transfer.tokenAmount.tokenSymbol || transfer.tokenAmount.tokenName}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center mt-6 gap-4">
        <Button
          variant="secondary"
          disabled={beforeStack.length === 0}
          onClick={handlePrev}
        >
          Prev
        </Button>
        <Button
          variant="secondary"
          disabled={transactions.length < 10}
          onClick={handleNext}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
