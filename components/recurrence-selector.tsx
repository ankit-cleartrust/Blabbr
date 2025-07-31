"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface RecurrenceSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function RecurrenceSelector({ value, onChange }: RecurrenceSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium mb-2">Recurrence:</p>
      <RadioGroup value={value} onValueChange={onChange} className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="once" id="once" />
          <Label htmlFor="once">Once</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="daily" id="daily" />
          <Label htmlFor="daily">Daily</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="weekly" id="weekly" />
          <Label htmlFor="weekly">Weekly</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="monthly" id="monthly" />
          <Label htmlFor="monthly">Monthly</Label>
        </div>
      </RadioGroup>
    </div>
  )
}
