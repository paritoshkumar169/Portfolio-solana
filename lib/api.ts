import { Connection, PublicKey } from "@solana/web3.js"
import { performReverseLookup } from "@bonfida/spl-name-service"

const HELIUS_API_KEY = "" //add your api from helius
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
const connection = new Connection(HELIUS_RPC)

const SPL_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"

export type TokenInfo = {
  address: string
  chainId?: number
  decimals: number
  name: string
  symbol: string
  logoURI?: string
  tags?: string[]
  price?: number
}

export interface TokenBalance {
  mint: string
  amount: number
  decimals: number
  symbol?: string
  logoURI?: string
  price?: number
}
export interface PortfolioData {
  address: string
  solBalance: number
  totalValue: number
  tokens: TokenWithPrice[]  // ✅ updated
  domain?: string
  isLoading: boolean
}

export interface TokenWithPrice extends TokenBalance {
  uiAmount: number
  symbol: string
  logoURI?: string
  price: number
  value: number
}

function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

export async function getValidAddress(address: any): Promise<string | null> {
  try {
    if (!address) return null
    const raw = typeof address === "string" ? address.trim() : address?.toBase58?.()
    if (!raw) return null
    if (raw.endsWith(".sol")) {
      const resolved = await resolveSolDomain(raw)
      return resolved && isValidSolanaAddress(resolved) ? resolved : null
    }
    return isValidSolanaAddress(raw) ? raw : null
  } catch {
    return null
  }
}

export async function fetchSolBalance(address: any): Promise<number> {
  const addressString = await getValidAddress(address)
  if (!addressString) {
    console.error("Invalid SOL balance address:", address)
    return 0
  }

  try {
    const response = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [addressString],
      }),
    })

    const result = await response.json()
    return result?.result?.value / 1e9 || 0
  } catch (error: any) {
    console.error("SOL balance fetch error:", error?.message || error)
    return 0
  }
}

export async function fetchTokenBalances(address: any): Promise<TokenBalance[]> {
  const addressString = await getValidAddress(address)
  if (!addressString) {
    console.error("Invalid token balance address:", address)
    return []
  }

  try {
    const response = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          addressString,
          { programId: SPL_TOKEN_PROGRAM_ID },
          { encoding: "jsonParsed" },
        ],
      }),
    })

    const result = await response.json()
    const accounts = result?.result?.value || []

    return accounts.map((account: any) => ({
      mint: account.account.data.parsed.info.mint,
      amount: parseInt(account.account.data.parsed.info.tokenAmount.amount),
      decimals: parseInt(account.account.data.parsed.info.tokenAmount.decimals),
    }))
  } catch (error: any) {
    console.error("Token balances fetch error:", error?.message || error)
    return []
  }
}

export async function fetchJupiterTokenMap(): Promise<Record<string, TokenInfo>> {
  const res = await fetch("https://token.jup.ag/all")
  const tokenList: TokenInfo[] | undefined = await res.json()

  if (!Array.isArray(tokenList)) {
    throw new Error("Invalid token list from Jupiter API")
  }

  const tokenMap: Record<string, TokenInfo> = tokenList.reduce(
    (acc, token) => {
      acc[token.address] = token
      return acc
    },
    {} as Record<string, TokenInfo>,
  )

  return tokenMap
}


export async function fetchLiveSolPrice(): Promise<number> {
  try {
    //trying jup
    const res = await fetch("https://price.jup.ag/v4/price?ids=SOL")
    const data = await res.json()
    const price = data?.data?.SOL?.price

    if (price) {
      console.log("🔥 Fetched SOL price from Jupiter:", price)
      return price
    }

    throw new Error("Jupiter price missing")
  } catch (jupiterErr) {
    console.warn("Jupiter price fetch failed, trying CoinGecko...")

    try {
      const coingeckoRes = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
      )
      const cgData = await coingeckoRes.json()
      const fallbackPrice = cgData?.solana?.usd

      if (fallbackPrice) {
        console.log(" Fallback SOL price from CoinGecko:", fallbackPrice)
        return fallbackPrice
      }

      throw new Error("CoinGecko price missing")
    } catch (cgErr) {
      console.error(" CoinGecko fallback also failed:", cgErr)
      return 0
    }
  }
}


// .sol to walletaddress
export async function resolveSolDomain(domain: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/domain?name=${domain}`)
    const data = await res.json()
    return data.address || null
  } catch (error) {
    console.error("Failed to resolve domain:", error)
    return null
  }
}

// SNS-based reverse resolution (wallet → .sol)
export async function fetchSolDomain(walletAddress: string): Promise<string | null> {
  const addressString = await getValidAddress(walletAddress)
  if (!addressString) return null

  try {
    const publicKey = new PublicKey(addressString)
    const domain = await performReverseLookup(connection, publicKey)
    return domain || null
  } catch (error: any) {
    if (error?.name === "SNSError") return null
    console.warn("SNS domain fetch failed:", error?.message || error)
    return null
  }
}

// 🎯 Main portfolio fetcher
export async function fetchPortfolio(address: any): Promise<PortfolioData> {
  const addressString = await getValidAddress(address)
  if (!addressString) {
    console.error("Invalid portfolio address:", address)
    return {
      address: typeof address === "string" ? address : "invalid-address",
      solBalance: 0,
      totalValue: 0,
      tokens: [],
      isLoading: false,
    }
  }

  try {
    const [solBalance, tokenBalances, tokenMap, domain, solPrice] = await Promise.all([
      fetchSolBalance(addressString),
      fetchTokenBalances(addressString),
      fetchJupiterTokenMap(),
      fetchSolDomain(addressString).catch(() => null),
      fetchLiveSolPrice(),
    ])

    const enrichedTokens: TokenWithPrice[] = tokenBalances.map((token) => {
      const uiAmount = token.amount / 10 ** token.decimals
      const price = tokenMap[token.mint]?.price || 0

      return {
        ...token,
        uiAmount,
        symbol: tokenMap[token.mint]?.symbol || token.mint.slice(0, 4),
        logoURI: tokenMap[token.mint]?.logoURI || "",
        price,
        value: uiAmount * price,
      }
    })

    const sortedTokens = enrichedTokens.sort((a, b) => b.value - a.value)

    const tokenValues = sortedTokens.reduce((acc, t) => acc + t.value, 0)

    return {
      address: addressString,
      solBalance,
      totalValue: solBalance * solPrice + tokenValues,
      tokens: sortedTokens,
      domain: domain || undefined,
      isLoading: false,
    }
  } catch (error) {
    console.error("Portfolio fetch error:", error)
    return {
      address: addressString,
      solBalance: 0,
      totalValue: 0,
      tokens: [],
      isLoading: false,
    }
  }
}
