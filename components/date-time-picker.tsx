"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format, addHours, isBefore, isToday, set } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  // Get current date and time
  const now = new Date()

  // Set default date to now if not provided
  useEffect(() => {
    if (!date) {
      // Default to next hour, rounded to nearest 5 minutes
      const nextHour = addHours(now, 1)
      const roundedMinutes = Math.ceil(nextHour.getMinutes() / 5) * 5
      const defaultDate = set(nextHour, { minutes: roundedMinutes >= 60 ? 0 : roundedMinutes })
      if (roundedMinutes >= 60) {
        defaultDate.setHours(defaultDate.getHours() + 1)
      }
      setDate(defaultDate)
    }
  }, [date, setDate, now])

  const [selectedHour, setSelectedHour] = useState<string>(date ? format(date, "HH") : format(addHours(now, 1), "HH"))

  const [selectedMinute, setSelectedMinute] = useState<string>(date ? format(date, "mm") : "00")

  // Update hour/minute when date changes
  useEffect(() => {
    if (date) {
      setSelectedHour(format(date, "HH"))
      setSelectedMinute(format(date, "mm"))
    }
  }, [date])

  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) {
      setDate(undefined)
      return
    }

    const hour = Number.parseInt(selectedHour)
    const minute = Number.parseInt(selectedMinute)

    const updatedDate = new Date(newDate)
    updatedDate.setHours(hour, minute, 0, 0)

    // If the selected date is today and the time is in the past, adjust to next hour
    if (isToday(updatedDate) && isBefore(updatedDate, now)) {
      const nextHour = addHours(now, 1)
      updatedDate.setHours(nextHour.getHours())
      updatedDate.setMinutes(0)
      setSelectedHour(format(updatedDate, "HH"))
      setSelectedMinute("00")
    }

    setDate(updatedDate)
  }

  const handleTimeChange = (hour: string, minute: string) => {
    setSelectedHour(hour)
    setSelectedMinute(minute)

    if (!date) return

    const updatedDate = new Date(date)
    updatedDate.setHours(Number.parseInt(hour), Number.parseInt(minute), 0, 0)

    // If the selected date is today and the new time is in the past, don't update
    if (isToday(updatedDate) && isBefore(updatedDate, now)) {
      return
    }

    setDate(updatedDate)
  }

  // Determine if a specific hour is disabled (in the past)
  const isHourDisabled = (hour: number) => {
    if (!date || !isToday(date)) return false
    return hour < now.getHours()
  }

  // Determine if a specific minute is disabled (in the past)
  const isMinuteDisabled = (minute: number) => {
    if (!date || !isToday(date)) return false
    const selectedHourNum = Number.parseInt(selectedHour)
    return selectedHourNum === now.getHours() && minute < now.getMinutes()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal bg-white", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              initialFocus
              disabled={(date) => isBefore(date, new Date(now.setHours(0, 0, 0, 0)))}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2 items-center">
        <Clock className="h-4 w-4" />
        <div className="grid grid-cols-2 gap-2">
          <Select value={selectedHour} onValueChange={(value) => handleTimeChange(value, selectedMinute)}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent className="bg-white max-h-[200px]">
              {Array.from({ length: 24 }).map((_, i) => {
                const hourValue = i.toString().padStart(2, "0")
                return (
                  <SelectItem
                    key={hourValue}
                    value={hourValue}
                    disabled={isHourDisabled(i)}
                    className={isHourDisabled(i) ? "text-gray-400" : ""}
                  >
                    {hourValue}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          <Select value={selectedMinute} onValueChange={(value) => handleTimeChange(selectedHour, value)}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Minute" />
            </SelectTrigger>
            <SelectContent className="bg-white max-h-[200px]">
              {Array.from({ length: 12 }).map((_, i) => {
                const minuteValue = (i * 5).toString().padStart(2, "0")
                const minuteNum = i * 5
                return (
                  <SelectItem
                    key={minuteValue}
                    value={minuteValue}
                    disabled={isMinuteDisabled(minuteNum)}
                    className={isMinuteDisabled(minuteNum) ? "text-gray-400" : ""}
                  >
                    {minuteValue}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
