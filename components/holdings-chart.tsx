"use client"

import { useEffect, useRef } from "react"
import type { TokenWithPrice } from "@/lib/api"

interface HoldingsChartProps {
  tokens: TokenWithPrice[]
  totalValue: number
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

// Generate colors for the chart
function generateColors(count: number): string[] {
  const baseColors = [
    "#d0f861", // Light green
    "#61f8d7", // Teal
    "#61a5f8", // Blue
    "#a561f8", // Purple
    "#f861d0", // Pink
    "#f86161", // Red
    "#f8d761", // Yellow
  ]

  const colors: string[] = []
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length])
  }

  return colors
}

export function HoldingsChart({ tokens, totalValue, currency, convertValue }: HoldingsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const symbol = currencySymbols[currency] || "$"

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw donut chart
    const centerX = canvas.width / (2 * dpr)
    const centerY = canvas.height / (2 * dpr)
    const radius = Math.min(centerX, centerY) * 0.8
    const innerRadius = radius * 0.6

    // Sort tokens by value
    const sortedTokens = [...tokens]
      .filter((token) => token.value && token.value > 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    // Generate colors
    const colors = generateColors(sortedTokens.length)

    // Calculate total value
    const total = sortedTokens.reduce((sum, token) => sum + (token.value || 0), 0)

    // Draw segments
    let startAngle = 0
    sortedTokens.forEach((token, index) => {
      const value = token.value || 0
      const sliceAngle = (value / total) * (2 * Math.PI)

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()

      ctx.fillStyle = colors[index]
      ctx.fill()

      startAngle += sliceAngle
    })

    // Draw inner circle (hole)
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
    ctx.fillStyle = "#111827"
    ctx.fill()
  }, [tokens, totalValue, currency])

  // If no tokens with value, show empty chart
  if (!tokens.some((token) => token.value && token.value > 0)) {
    return (
      <div className="relative h-48 flex items-center justify-center">
        <p className="text-gray-400">No holdings data available</p>
      </div>
    )
  }

  return (
    <div className="relative h-48">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#d0f861]"></div>
        <div className="text-sm">
          Holdings ({symbol}
          {convertValue(totalValue).toFixed(2)}) 100.00%
        </div>
      </div>
    </div>
  )
}

