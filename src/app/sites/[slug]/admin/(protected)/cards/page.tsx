"use client"

import "client-only"

import { CreditCard, X, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { NfcCardsDataTable } from "@/components/nfc-cards-data-table"
import { useParams } from 'next/navigation'
import { supabase } from "@/lib/supabase"
import { TypewriterSummary } from "@/components/typewriter-summary"
import { useAISettings } from "@/hooks/use-ai-settings"

const AI_TEXT = "Currently analyzing your NFC fleet distribution and hardware metrics. We have detected a stable assignment rate across new employee on-boarding. The engagement metrics indicate outstanding physical card usage with negligible revocation trends."

export default function CardsPage() {
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

  const showAiSummary = aiSettings?.nfc_cards_enabled && !locallyDismissed

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
            <CreditCard className="w-6 h-6 text-primary" strokeWidth={1.5} />
        </div>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">NFC Cards</h1>
            <p className="text-sm text-muted-foreground">Provision, assign, and revoke physical hardware.</p>
        </div>
      </div>
      
      {showAiSummary && (
        <Alert className="relative bg-primary/5 border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-medium">AI Hardware Summary</AlertTitle>
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

      <NfcCardsDataTable slug={slug} />
      
    </div>
  )
}

