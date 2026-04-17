"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase"

export interface AISettings {
  employees_enabled: boolean
  nfc_cards_enabled: boolean
  leads_enabled: boolean
  links_enabled: boolean
}

export function useAISettings(orgId: string | null) {
  const [settings, setSettings] = React.useState<AISettings | null>(null)
  const [loading, setLoading] = React.useState(true)

  const fetchSettings = React.useCallback(async () => {
    if (!orgId) return
    try {
      const { data, error } = await supabase
        .from('ai_usage')
        .select('employees_enabled, nfc_cards_enabled, leads_enabled, links_enabled')
        .eq('org_id', orgId)
        .maybeSingle()

      if (!error && data) {
        setSettings(data)
      } else if (!data) {
        // If no record exists, default to all false
        setSettings({
          employees_enabled: false,
          nfc_cards_enabled: false,
          leads_enabled: false,
          links_enabled: false
        })
      }
    } catch (err) {
      console.error("Error fetching AI settings:", err)
    } finally {
      setLoading(false)
    }
  }, [orgId])

  React.useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  React.useEffect(() => {
    if (!orgId) return

    const channel = supabase
      .channel(`internal:ai_usage:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'tapconnect',
          table: 'ai_usage',
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          if (payload.new) {
            setSettings(payload.new as AISettings)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId])

  return { settings, loading, refresh: fetchSettings }
}
