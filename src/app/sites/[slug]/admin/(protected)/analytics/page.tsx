"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="w-6 h-6 text-primary" strokeWidth={1.5} />
        </div>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground">Deep dive into tap velocity, geolocations, and ROI.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Visualization</CardTitle>
          <CardDescription>
            Heatmaps, geographic clustering, and timeline velocity charting will render here.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[40vh] flex items-center justify-center border-t border-border/50 bg-muted/20">
            <span className="text-muted-foreground text-sm font-medium tracking-tight">Charts Container Placeholder</span>
        </CardContent>
      </Card>
    </div>
  )
}
