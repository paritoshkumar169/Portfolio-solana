"use client"

import { useEffect, useRef } from "react"
import type { TokenWithPrice } from "@/lib/api"

interface HoldingsChartProps {
  tokens: TokenWithPrice[]
  totalValue: number
  currency: string
  convertValue: (value: number) => number
  selectedToken?: string
  onSelectToken?: (mint: string) => void
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

export function HoldingsChart({ 
  tokens, 
  totalValue, 
  currency, 
  convertValue,
  selectedToken,
  onSelectToken
}: HoldingsChartProps) {
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
    const segments: { token: TokenWithPrice; startAngle: number; endAngle: number; color: string }[] = []
    
    sortedTokens.forEach((token, index) => {
      const value = token.value || 0
      const sliceAngle = (value / total) * (2 * Math.PI)
      const endAngle = startAngle + sliceAngle

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      const color = colors[index]
      ctx.fillStyle = color
      
      // Highlight selected token
      if (selectedToken === token.mint) {
        ctx.shadowColor = 'white'
        ctx.shadowBlur = 10
        // Push segment slightly out
        const midAngle = startAngle + sliceAngle / 2
        const offsetX = Math.cos(midAngle) * 10
        const offsetY = Math.sin(midAngle) * 10
        ctx.translate(offsetX, offsetY)
        ctx.fill()
        ctx.translate(-offsetX, -offsetY)
        ctx.shadowBlur = 0
      } else {
        ctx.fill()
      }

      segments.push({
        token,
        startAngle,
        endAngle,
        color
      })

      startAngle = endAngle
    })

    // Draw inner circle (hole)
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
    ctx.fillStyle = "#111827"
    ctx.fill()

    // Add click handler to canvas
    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      // Convert to canvas coordinates
      const canvasX = x * dpr
      const canvasY = y * dpr
      
      // Calculate distance from center
      const dx = canvasX - centerX * dpr
      const dy = canvasY - centerY * dpr
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Check if click is within donut
      if (distance >= innerRadius * dpr && distance <= radius * dpr) {
        // Calculate angle
        const angle = Math.atan2(dy, dx)
        const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle
        
        // Find which segment was clicked
        for (const segment of segments) {
          if (normalizedAngle >= segment.startAngle && normalizedAngle <= segment.endAngle) {
            onSelectToken?.(segment.token.mint)
            break
          }
        }
      }
    }

    canvas.addEventListener('click', handleClick)
    
    return () => {
      canvas.removeEventListener('click', handleClick)
    }
  }, [tokens, totalValue, currency, selectedToken, onSelectToken])

  // If no tokens with value, show empty chart
  if (!tokens.some((token) => token.value && token.value > 0)) {
    return (
      <div className="relative h-48 flex items-center justify-center">
        <p className="text-gray-400">No holdings data available</p>
      </div>
    )
  }

  // Find selected token data
  const selectedTokenData = selectedToken 
    ? tokens.find(t => t.mint === selectedToken) 
    : null

  return (
    <div className="relative h-48">
      <canvas ref={canvasRef} className="w-full h-full cursor-pointer" />
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex items-center gap-2">
        {selectedTokenData ? (
          <>
            <div className="w-3 h-3 rounded-full bg-[#d0f861]"></div>
            <div className="text-sm">
              {selectedTokenData.symbol} ({symbol}
              {convertValue(selectedTokenData.value).toFixed(2)}) {((selectedTokenData.value / totalValue) * 100).toFixed(2)}%
            </div>
          </>
        ) : (
          <>
            <div className="w-3 h-3 rounded-full bg-[#d0f861]"></div>
            <div className="text-sm">
              Holdings ({symbol}
              {convertValue(totalValue).toFixed(2)}) 100.00%
            </div>
          </>
        )}
      </div>
    </div>
  )
}
