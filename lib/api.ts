import { PublicKey } from "@solana/web3.js"

const JUPITER_TOKEN_LIST_URL = "https://quote-api.jup.ag/v6/tokens"
const SOLANA_MAINNET_RPC = "https://api.mainnet-beta.solana.com"
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
  tokens: TokenBalance[]
  domain?: string
  isLoading: boolean
}

// ✅ Unified strict validator
function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

// ✅ Final version
function getValidAddress(address: any): string | null {
  try {
    if (!address) return null
    const addr = typeof address === "string" ? address.trim() : address?.toBase58?.()
    return addr && isValidSolanaAddress(addr) ? addr : null
  } catch {
    return null
  }
}

export async function fetchSolBalance(address: any): Promise<number> {
  const addressString = getValidAddress(address)
  if (!addressString) {
    console.error("Invalid SOL balance address:", address)
    return 0
  }

  try {
    const response = await fetch(SOLANA_MAINNET_RPC, {
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
  const addressString = getValidAddress(address)
  if (!addressString) {
    console.error("Invalid token balance address:", address)
    return []
  }

  try {
    const response = await fetch(SOLANA_MAINNET_RPC, {
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

export async function fetchSolDomain(walletAddress: string): Promise<string | null> {
  const addressString = getValidAddress(walletAddress)
  if (!addressString) return null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`/api/domain?address=${addressString}`, {
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) return null

    const data = await response.json()
    return data.success && data.data?.length > 0 ? data.data[0].name : null
  } catch (error: any) {
    if (error?.name !== "AbortError") {
      console.warn("Domain fetch warning:", error?.message || error)
    }
    return null
  }
}

export async function fetchPortfolio(address: any): Promise<PortfolioData> {
  const addressString = getValidAddress(address)
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
    const [solBalance, tokenBalances, tokenMap, domain] = await Promise.all([
      fetchSolBalance(addressString),
      fetchTokenBalances(addressString),
      fetchJupiterTokenMap(),
      fetchSolDomain(addressString).catch(() => null),
    ])

    const solMint = "So11111111111111111111111111111111111111112"
    const solPrice = tokenMap[solMint]?.price || 0

    const enrichedTokens = tokenBalances.map((token) => ({
      ...token,
      symbol: tokenMap[token.mint]?.symbol || token.mint.slice(0, 4),
      logoURI: tokenMap[token.mint]?.logoURI || "",
      price: tokenMap[token.mint]?.price || 0,
    }))

    const tokenValues = enrichedTokens.reduce(
      (acc, t) => acc + (t.amount / 10 ** t.decimals) * t.price,
      0
    )

    return {
      address: addressString,
      solBalance,
      totalValue: solBalance * solPrice + tokenValues,
      tokens: enrichedTokens,
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
