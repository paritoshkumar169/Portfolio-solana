"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface CurrencySelectorProps {
  isOpen: boolean
  onClose: () => void
  selectedCurrency: string
  onSelectCurrency: (currency: string) => void
}

const currencies = [
  { id: "USD", symbol: "$", name: "US Dollar" },
  { id: "EUR", symbol: "€", name: "Euro" },
  { id: "JPY", symbol: "¥", name: "Japanese Yen" },
  { id: "INR", symbol: "₹", name: "Indian Rupee" },
  { id: "ZAR", symbol: "R", name: "South African Rand" },
]

export function CurrencySelector({ isOpen, onClose, selectedCurrency, onSelectCurrency }: CurrencySelectorProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#1a2234] border-[#2a3349] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Currency Settings</DialogTitle>
          <Button
            variant="ghost"
            className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup
            value={selectedCurrency}
            onValueChange={(value) => {
              onSelectCurrency(value)
              onClose()
            }}
            className="space-y-2"
          >
            {currencies.map((currency) => (
              <div key={currency.id} className="flex items-center space-x-2 rounded-lg p-2 hover:bg-[#2d3748]">
                <RadioGroupItem value={currency.id} id={currency.id} className="border-[#3b4659]" />
                <Label htmlFor={currency.id} className="flex-1 cursor-pointer flex items-center gap-2">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2d3748]">
                    {currency.symbol}
                  </span>
                  <span>{currency.name}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </DialogContent>
    </Dialog>
  )
}

