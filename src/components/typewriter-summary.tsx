"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface TypewriterSummaryProps {
  text: string
  speed?: number
  delay?: number
}

export function TypewriterSummary({ text, speed = 15, delay = 1500 }: TypewriterSummaryProps) {
  const [displayedText, setDisplayedText] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [typing, setTyping] = React.useState(false)

  React.useEffect(() => {
    const loader = setTimeout(() => {
        setLoading(false)
        setTyping(true)
        let index = 0
        const interval = setInterval(() => {
           setDisplayedText(text.slice(0, index))
           index++
           if (index > text.length) {
               clearInterval(interval)
               setTyping(false)
           }
        }, speed)
        return () => clearInterval(interval)
    }, delay)
    
    return () => clearTimeout(loader)
  }, [text, speed, delay])

  if (loading) return (
     <div className="flex flex-col gap-2">
         <Skeleton className="h-4 w-full max-w-[500px]" />
         <Skeleton className="h-4 w-full max-w-[400px]" />
         <Skeleton className="h-4 w-[250px]" />
     </div>
  )

  return (
      <div className="text-sm text-muted-foreground leading-relaxed pr-[20px] pb-2">
         {displayedText}
         {typing && <span className="animate-pulse">|</span>}
      </div>
  )
}
