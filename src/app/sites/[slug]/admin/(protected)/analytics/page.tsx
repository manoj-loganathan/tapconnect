"use client"

import { BarChart3 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'

export default function AnalyticsPage() {
  const params = useParams()
  const slug = params?.slug as string

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
      
      <AnalyticsDashboard slug={slug} />
    </div>
  )
}
