"use client"
import * as React from 'react'
import { ShieldAlert, Mail } from 'lucide-react'

export default function DeactivatedView({ org }: { org: any }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
      <div className="max-w-sm w-full space-y-6">
        <div className="flex justify-center">
          <div 
            className="w-20 h-20 rounded-[2rem] flex items-center justify-center animate-pulse"
            style={{ backgroundColor: `${org.brand_color}10` }}
          >
            <ShieldAlert className="w-10 h-10" style={{ color: org.brand_color }} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Account Deactivated</h1>
          <p className="text-muted-foreground leading-relaxed">
            This profile has been deactivated for security or administrative reasons.
          </p>
        </div>
        <div className="p-4 rounded-3xl bg-muted/50 border border-border/50">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center justify-center gap-2">
            <Mail className="w-3 h-3" /> Still have questions?
          </p>
          <p className="text-sm font-semibold">
            Please contact the administrator at <br/>
            <span className="text-primary font-bold mt-1 inline-block">{org.name}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
