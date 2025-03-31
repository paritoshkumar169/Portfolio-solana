import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get("address")

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.solscan.io/account/domain?address=${address}`)

    const contentType = res.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      console.error("Solscan returned non-JSON:", await res.text())
      return NextResponse.json({ success: false, data: [] }, { status: 502 })
    }

    const domainData = await res.json()
    return NextResponse.json(domainData)
  } catch (err: any) {
    console.error("❌ Solscan API failed:", err.message || err)
    return NextResponse.json({ success: false, data: [] }, { status: 500 })
  }
}
