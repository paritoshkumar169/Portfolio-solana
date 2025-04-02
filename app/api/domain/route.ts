import { NextResponse } from "next/server"
import { Connection } from "@solana/web3.js"
import { getDomainKey, NameRegistryState } from "@bonfida/spl-name-service"

const HELIUS_API_KEY = process.env.HELIUS_API_KEY
if (!HELIUS_API_KEY) {
  throw new Error("API key is missing")
}

const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
const connection = new Connection(HELIUS_RPC)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get("name")

  if (!domain || !domain.endsWith(".sol")) {
    return NextResponse.json({ error: "Invalid .sol domain" }, { status: 400 })
  }

  try {
    const { pubkey } = await getDomainKey(domain.replace(".sol", ""))
    const { registry } = await NameRegistryState.retrieve(connection, pubkey)

    const owner = registry.owner.toBase58()
    return NextResponse.json({ address: owner })
  } catch (error) {
    let errorMessage = "Unknown error"
    if (error instanceof Error) {
      errorMessage = error.message
    }

    console.error("SNS resolution failed:", error)
    return NextResponse.json({ error: "Failed to resolve domain", details: errorMessage }, { status: 500 })
  }
}
