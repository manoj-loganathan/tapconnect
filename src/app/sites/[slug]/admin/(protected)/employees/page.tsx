"use client"

import "client-only"

import { Users, X, Sparkles } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmployeeDataTable } from "@/components/employee-data-table"
import { DepartmentDataTable } from "@/components/department-data-table"
import { useParams } from 'next/navigation'
import { supabase } from "@/lib/supabase"
import { TypewriterSummary } from "@/components/typewriter-summary"
import { useAISettings } from "@/hooks/use-ai-settings"

const AI_TEXT = "Currently analyzing your workforce structure spanning multiple departments. We have detected steady growth in commercial sales acquisitions. The engagement metrics indicate outstanding card usage rates across all active employees."

export default function EmployeesPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [orgId, setOrgId] = useState<string | null>(null)
  const [locallyDismissed, setLocallyDismissed] = useState(false)
  const { settings: aiSettings, loading: aiLoading } = useAISettings(orgId)

  useEffect(() => {
    const fetchOrg = async () => {
      const { data } = await supabase.from('organizations').select('id').eq('slug', slug).single()
      if (data) setOrgId(data.id)
    }
    fetchOrg()
  }, [slug])

  const showAiSummary = aiSettings?.employees_enabled && !locallyDismissed

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="w-6 h-6 text-primary" strokeWidth={1.5} />
        </div>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
            <p className="text-sm text-muted-foreground">Manage your workforce, departments, and designations.</p>
        </div>
      </div>
      
      {showAiSummary && (
        <Alert className="relative bg-primary/5 border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-medium">AI Workforce Summary</AlertTitle>
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

      <Tabs defaultValue="employees" className="w-full">
        <TabsList variant="line" className="w-full justify-start border-b border-border/40 pb-0 mb-6">
          <TabsTrigger value="employees" className="pb-3 text-sm">Employees</TabsTrigger>
          <TabsTrigger value="departments" className="pb-3 text-sm">Departments</TabsTrigger>
        </TabsList>
        <TabsContent value="employees">
           <EmployeeDataTable slug={slug} />
        </TabsContent>
        <TabsContent value="departments">
           <DepartmentDataTable slug={slug} />
        </TabsContent>
      </Tabs>
      
    </div>
  )
}

