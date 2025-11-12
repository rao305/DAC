"use client"

import * as React from "react"

interface PricingToggleProps {
  onChange: (annual: boolean) => void
}

export function PricingToggle({ onChange }: PricingToggleProps) {
  const [annual, setAnnual] = React.useState(true)

  const handleToggle = () => {
    const newValue = !annual
    setAnnual(newValue)
    onChange(newValue)
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className={`text-sm transition-opacity ${
          !annual ? "opacity-100 text-foreground" : "opacity-60 text-muted-foreground"
        }`}
      >
        Monthly
      </span>
      <button
        onClick={handleToggle}
        className="relative w-14 h-8 rounded-full bg-emerald-600 transition-colors"
        aria-label="Toggle billing period"
      >
        <span
          className={`absolute top-1 size-6 rounded-full bg-white transition-all duration-200 ${
            annual ? "left-7" : "left-1"
          }`}
        />
      </button>
      <span
        className={`text-sm transition-opacity ${
          annual ? "opacity-100 text-foreground" : "opacity-60 text-muted-foreground"
        }`}
      >
        Annual{" "}
        <span className="ml-1 rounded px-2 py-0.5 text-xs bg-emerald-600/20 text-emerald-300">
          Save 17%
        </span>
      </span>
    </div>
  )
}

