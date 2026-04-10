"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Magnet } from 'lucide-react'

export default function LeadsPage() {
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
      
      <Card>
        <CardHeader>
          <CardTitle>Inbound Contacts</CardTitle>
          <CardDescription>
            This module currently aggregates direct CRM pushes. List views and CRM pipeline mapping are coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[40vh] flex items-center justify-center border-t border-border/50 bg-muted/20">
            <span className="text-muted-foreground text-sm font-medium tracking-tight">CRM Table Placeholder</span>
        </CardContent>
      </Card>
    </div>
  )
}
