"use client"

import "client-only"

import { Users, X, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { EmployeeDataTable } from "@/components/employee-data-table"
import { DepartmentDataTable } from "@/components/department-data-table"
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

import { cn } from "@/lib/utils"

const AI_TEXT = "Currently analyzing your workforce structure spanning multiple departments. We have detected steady growth in commercial sales acquisitions. The engagement metrics indicate outstanding card usage rates across all active employees."

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

export default function EmployeesPage() {
  const [showAiSummary, setShowAiSummary] = useState(true)
  const params = useParams()
  const slug = params?.slug as string

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
            onClick={() => setShowAiSummary(false)} 
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
