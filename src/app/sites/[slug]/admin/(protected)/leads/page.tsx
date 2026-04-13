"use client"

import { Magnet, Sparkles, X } from 'lucide-react'
import { useState, useEffect } from 'react'

import { LeadsDataTable } from "@/components/leads-data-table"
import { useParams } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

const AI_TEXT = "Currently analyzing your inbound pipeline across all recorded sources. We have detected a steady flow of new engagements, with a recent spike in successful conversions. The data indicates high responsiveness translating to a solid lifecycle from capture to close."

function TypewriterSummary({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('')
  const [loading, setLoading] = useState(true)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
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
        }, 15)
        return () => clearInterval(interval)
    }, 1500)
    
    return () => clearTimeout(loader)
  }, [text])

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

export default function LeadsPage() {
  const [showAiSummary, setShowAiSummary] = useState(true)
  const params = useParams()
  const slug = params?.slug as string

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
            <Magnet className="w-6 h-6 text-primary" strokeWidth={1.5} />
        </div>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Lead Capture</h1>
            <p className="text-sm text-muted-foreground">Monitor and manage externally generated contact pipelines.</p>
        </div>
      </div>
      
      {showAiSummary && (
        <Alert className="relative bg-primary/5 border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-medium">AI Pipeline Summary</AlertTitle>
          <AlertDescription className="mt-2 min-h-[60px]">
             <TypewriterSummary text={AI_TEXT} />
          </AlertDescription>
          <button 
            onClick={() => setShowAiSummary(false)} 
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      <LeadsDataTable slug={slug} />
    </div>
  )
}
