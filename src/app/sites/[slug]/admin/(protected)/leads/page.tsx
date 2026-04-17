"use client"

import { Magnet, Sparkles, X } from 'lucide-react'
import { useState, useEffect } from 'react'

import { LeadsDataTable } from "@/components/leads-data-table"
import { useParams } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { TypewriterSummary } from "@/components/typewriter-summary"
import { useAISettings } from "@/hooks/use-ai-settings"

const AI_TEXT = "Currently analyzing your inbound pipeline across all recorded sources. We have detected a steady flow of new engagements, with a recent spike in successful conversions. The data indicates high responsiveness translating to a solid lifecycle from capture to close."

export default function LeadsPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [orgId, setOrgId] = useState<string | null>(null)
  const [locallyDismissed, setLocallyDismissed] = useState(false)
  const { settings: aiSettings } = useAISettings(orgId)

  useEffect(() => {
    const fetchOrg = async () => {
      const { data } = await supabase.from('organizations').select('id').eq('slug', slug).single()
      if (data) setOrgId(data.id)
    }
    fetchOrg()
  }, [slug])

  const showAiSummary = aiSettings?.leads_enabled && !locallyDismissed

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
            onClick={() => setLocallyDismissed(true)} 
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

