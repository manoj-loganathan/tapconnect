"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { ColorPicker } from 'antd'
import { 
  Settings, 
  User, 
  ShieldCheck, 
  Palette, 
  Bell, 
  History, 
  Save, 
  Loader2,
  CheckCircle2,
  Globe,
  Mail,
  Smartphone,
  ShieldAlert,
  KeyRound,
  MessageSquare,
  Lock,
  Camera,
  ExternalLink,
  CalendarDays,
  Monitor,
  MonitorSmartphone,
  MapPin,
  Activity,
  ShieldCheck as ShieldCheckIcon,
  ShieldIcon,
  CreditCard,
  Download,
  Search,
  Filter,
  MoreVertical,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Wand2,
  Brain
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { BillingDataTable } from "@/components/billing-data-table"
import { AuditDataTable } from "@/components/audit-data-table"
import { supabase } from "@/lib/supabase"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

// Mock data for Audit Logs
const MOCK_LOGS = [
  { id: 1, action: "Organization profile updated", user: "Admin", date: "2 mins ago", type: "system" },
  { id: 2, action: "New employee 'John Doe' added", user: "Admin", date: "1 hour ago", type: "employee" },
  { id: 3, action: "Brand color changed to #2563EB", user: "Admin", date: "3 hours ago", type: "appearance" },
  { id: 4, action: "Monthly billing report exported", user: "Admin", date: "Yesterday", type: "billing" },
  { id: 5, action: "Support ticket #442 closed", user: "System", date: "2 days ago", type: "support" },
  { id: 6, action: "NFC Card provisioned for Sarah Smith", user: "Admin", date: "3 days ago", type: "card" },
]

interface OrgFormData {
  name: string
  logo_url: string
  admin_name: string
  admin_email: string
  admin_phone: string
  brand_color: string
  accent_color: string
}

export default function SettingsPage() {
  const params = useParams()
  const slug = params.slug as string
  const { theme, setTheme } = useTheme()

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [orgData, setOrgData] = React.useState<any>(null)
  const [stats, setStats] = React.useState({
    employeeCount: 0,
    healthStatus: 'Checking...'
  })
  
  const [authSessions, setAuthSessions] = React.useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = React.useState(true)
  
  const [invoices, setInvoices] = React.useState<any[]>([])
  const [loadingInvoices, setLoadingInvoices] = React.useState(true)
  
  const [appAccent, setAppAccent] = React.useState('#2563EB')
  const [appChartTheme, setAppChartTheme] = React.useState('ocean')
  const [appFont, setAppFont] = React.useState('Inter')
  const [isMounted, setIsMounted] = React.useState(false)
  
  const [extraEmails, setExtraEmails] = React.useState<string[]>([])
  const [newEmailInput, setNewEmailInput] = React.useState('')
  const [notifSettings, setNotifSettings] = React.useState<any>({
    id: "",
    leads: false,
    taps: false,
    nfc_cards: false,
    daily_pulse: false,
    weekly_roundup: false,
    monthly_digest: false,
    invoices_receipts: false,
    accounting_updates: false,
    upcoming_bills: false,
  })
  
  // AI Settings State
  const [aiSettings, setAiSettings] = React.useState({
    employees_enabled: false,
    nfc_cards_enabled: false,
    leads_enabled: false,
    links_enabled: false,
  })
  const [prompts, setPrompts] = React.useState<{prompt: string}[]>([])
  const [aiLoading, setAiLoading] = React.useState(false)
  const [isEditingPrompt, setIsEditingPrompt] = React.useState<{index: number, text: string} | null>(null)
  const [newPromptText, setNewPromptText] = React.useState('')
  const [isAddingPrompt, setIsAddingPrompt] = React.useState(false)

  React.useEffect(() => {
     const storedAccent = localStorage.getItem('app-accent')
     const storedChart = localStorage.getItem('app-chart-theme')
     const storedFont = localStorage.getItem('app-font')
     
     if (storedAccent) setAppAccent(storedAccent)
     if (storedChart) setAppChartTheme(storedChart)
     if (storedFont) setAppFont(storedFont)
     
     setIsMounted(true)
  }, [])

  React.useEffect(() => {
      if (!isMounted) return
      localStorage.setItem('app-accent', appAccent)
      document.documentElement.style.setProperty('--primary', appAccent)
      document.documentElement.style.setProperty('--ring', appAccent)
  }, [appAccent, isMounted])

  React.useEffect(() => {
      if (!isMounted) return
      localStorage.setItem('app-chart-theme', appChartTheme)
      document.documentElement.dataset.chart = appChartTheme
  }, [appChartTheme, isMounted])

  React.useEffect(() => {
      if (!isMounted) return
      localStorage.setItem('app-font', appFont)
      if (appFont === 'Inter') document.documentElement.dataset.font = 'inter'
      else if (appFont === 'Jakarta') document.documentElement.dataset.font = 'jakarta'
      else if (appFont === 'Outfit') document.documentElement.dataset.font = 'outfit'
      else if (appFont === 'DM Sans') document.documentElement.dataset.font = 'dmsans'
  }, [appFont, isMounted])
  
  const [formData, setFormData] = React.useState<OrgFormData>({
    name: "",
    logo_url: "",
    admin_name: "",
    admin_email: "",
    admin_phone: "",
    brand_color: "#2563eb",
    accent_color: "#eab308",
  })

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const brandColorRef = React.useRef<HTMLInputElement>(null)
  const accentColorRef = React.useRef<HTMLInputElement>(null)

  // Fetch Org Data
  const fetchOrgData = React.useCallback(async () => {
    setLoading(true)
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (org && !orgError) {
      setOrgData(org)
      setFormData({
        name: org.name || "",
        logo_url: org.logo_url || "",
        admin_name: org.admin_name || "",
        admin_email: org.admin_email || "",
        admin_phone: org.admin_phone || "",
        brand_color: org.brand_color || "#2563eb",
        accent_color: org.accent_color || "#eab308",
      })

      // Fetch Employee Stats
      const { count, error: countError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
      
      setStats({
        employeeCount: count || 0,
        healthStatus: countError ? 'Degraded' : 'Healthy'
      })
    }

    setLoading(false)

    // Load Connected Devices / Sessions
    if (org?.id) {
      setLoadingSessions(true)
      try {
        const { data, error } = await supabase
          .from('auth_logs')
          .select('*')
          .eq('org_id', org.id)
          .order('created_at', { ascending: false })
          .limit(5)
        
        if (!error && data) {
          setAuthSessions(data)
        } else {
          setAuthSessions([])
        }
      } catch (err) {
        setAuthSessions([])
      } finally {
        setLoadingSessions(false)
      }

      setLoadingInvoices(true)
      try {
        const { data: invData, error: invError } = await supabase
          .from('billing')
          .select('*')
          .eq('org_id', org.id)
          .order('created_at', { ascending: false })
        
        if (!invError && invData) {
          setInvoices(invData)
        } else {
          setInvoices([])
        }
      } catch (err) {
        setInvoices([])
      } finally {
        setLoadingInvoices(false)
      }

      // Real-time Billing Subscription
      const billingChannel = supabase
        .channel(`billing:${org.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'tapconnect',
            table: 'billing',
            filter: `org_id=eq.${org.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setInvoices(prev => [payload.new, ...prev])
            } else if (payload.eventType === 'UPDATE') {
              setInvoices(prev => prev.map(inv => inv.id === payload.new.id ? payload.new : inv))
            } else if (payload.eventType === 'DELETE') {
              setInvoices(prev => prev.filter(inv => inv.id === payload.old.id))
            }
          }
        )
        .subscribe()

      // Fetch Notification Settings
      try {
        const { data: notifData, error: notifError } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('org_id', org.id)
          .maybeSingle()

        if (notifData) {
            setNotifSettings(notifData)
            if (notifData.additional_recipients) setExtraEmails(notifData.additional_recipients)
        } else if (!notifError) {
            const { data: newNotif } = await supabase
               .from('notification_settings')
               .insert([{ org_id: org.id }])
               .select()
               .single()
            if (newNotif) setNotifSettings(newNotif)
        }
      } catch (err) {
        console.error("Notif fetch error", err)
      }
      
      // Real-time Notification Subscription
      const notifChannel = supabase
        .channel(`notifs:${org.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'tapconnect',
            table: 'notification_settings',
            filter: `org_id=eq.${org.id}`,
          },
          (payload) => {
             setNotifSettings((prev: any) => ({ ...prev, ...payload.new }))
             if (payload.new.additional_recipients) {
                 setExtraEmails(payload.new.additional_recipients)
             } else {
                 setExtraEmails([])
             }
          }
        )
        .subscribe()

      // Fetch AI Usage Settings
      setAiLoading(true)
      try {
        const { data: aiData, error: aiError } = await supabase
          .from('ai_usage')
          .select('*')
          .eq('org_id', org.id)
          .maybeSingle()
        
        if (!aiError && aiData) {
          setAiSettings({
            employees_enabled: aiData.employees_enabled || false,
            nfc_cards_enabled: aiData.nfc_cards_enabled || false,
            leads_enabled: aiData.leads_enabled || false,
            links_enabled: aiData.links_enabled || false,
          })
          setPrompts(Array.isArray(aiData.prompts) ? aiData.prompts : [])
        } else if (!aiData) {
            // If no settings found, initialize with defaults (limit to 6)
            setPrompts([
                { "prompt": "Provide a concise summary of the dataset including totals, trends, and key highlights." },
                { "prompt": "Summarize the dataset and highlight the most important insights and patterns." },
                { "prompt": "Filter the dataset based on selected criteria and return relevant results." },
                { "prompt": "Format the dataset into a clean and structured table view." },
                { "prompt": "Analyze the dataset and identify key trends, anomalies, and insights." },
                { "prompt": "Prepare the dataset in a structured format suitable for Excel export." }
            ])
        }
      } catch (err) {
          console.error("AI Settings Fetch Error:", err)
      } finally {
        setAiLoading(false)
      }

      return () => {
        supabase.removeChannel(billingChannel)
        supabase.removeChannel(notifChannel)
      }
    } else {
      setLoadingSessions(false)
      setLoadingInvoices(false)
    }
  }, [slug])

  React.useEffect(() => {
    fetchOrgData()
  }, [fetchOrgData])

  const handleSaveProfile = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('organizations')
      .update({
        name: formData.name,
        admin_name: formData.admin_name,
        admin_email: formData.admin_email,
        admin_phone: formData.admin_phone,
        brand_color: formData.brand_color,
        accent_color: formData.accent_color,
      })
      .eq('id', orgData.id)
    
    if (!error) {
      setOrgData({ ...orgData, ...formData })
    }
    setSaving(false)
  }

  const handlePlanChange = async (newPlan: 'basic' | 'premium') => {
    if (!orgData?.id) return
    setSaving(true)
    
    try {
      const invoiceNum = `INV-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString().slice(-4)}`
      const baseAmount = newPlan === 'premium' ? 60000 : 5000
      const gst = Math.round(baseAmount * 0.18)
      
      const { error } = await supabase
        .from('billing')
        .insert([{
          org_id: orgData.id,
          invoice_number: invoiceNum,
          plan: newPlan,
          period_start: new Date().toISOString().split('T')[0],
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          gst_percent: 18,
          gst_amount: gst,
          total_amount: baseAmount + gst,
          status: 'pending',
          payment_method: 'Manual Selection'
        }])
      
      if (error) throw error
    } catch (err) {
      console.error("Plan Change Error:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteInvoice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('billing')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (err) {
      console.error("Delete Invoice Error:", err)
    }
  }

  const handleUpdateInvoiceStatus = async (id: string, currentStatus: string) => {
    const statusCycle: Record<string, string> = {
      'pending': 'paid',
      'paid': 'overdue',
      'overdue': 'pending'
    }
    const nextStatus = statusCycle[currentStatus] || 'pending'
    
    try {
      const { error } = await supabase
        .from('billing')
        .update({ status: nextStatus, paid_at: nextStatus === 'paid' ? new Date().toISOString() : null })
        .eq('id', id)
      
      if (error) throw error
    } catch (err) {
      console.error("Update Status Error:", err)
    }
  }

  const handleSaveAISettings = async (updatedSettings?: any, updatedPrompts?: any[]) => {
    if (!orgData?.id) return
    setSaving(true)
    
    // Check if record exists
    const { data: existing } = await supabase
      .from('ai_usage')
      .select('id')
      .eq('org_id', orgData.id)
      .maybeSingle()
    
    const payload = {
      org_id: orgData.id,
      ...(updatedSettings || aiSettings),
      prompts: (updatedPrompts || prompts),
      updated_at: new Date().toISOString()
    }
    
    let error
    if (existing) {
      const { error: updateError } = await supabase
        .from('ai_usage')
        .update(payload)
        .eq('id', existing.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('ai_usage')
        .insert([payload])
      error = insertError
    }
    
    if (error) {
        console.error("Save AI Error:", error)
    }
    setSaving(false)
  }

  const handleNotificationToggle = async (key: string, value: boolean) => {
     if (!notifSettings.id) return
     setNotifSettings((prev: any) => ({ ...prev, [key]: value }))
     await supabase.from('notification_settings').update({ [key]: value }).eq('id', notifSettings.id)
  }

  const handleUpdateExtraEmails = async (newEmails: string[]) => {
      setExtraEmails(newEmails);
      if (!notifSettings.id) return;
      await supabase.from('notification_settings').update({ additional_recipients: newEmails }).eq('id', notifSettings.id)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !orgData) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${slug}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('tapconnect')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading logo:', uploadError)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('tapconnect')
      .getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ logo_url: publicUrl })
      .eq('id', orgData.id)

    if (!updateError) {
      setFormData((prev: OrgFormData) => ({ ...prev, logo_url: publicUrl }))
      setOrgData((prev: any) => ({ ...prev, logo_url: publicUrl }))
    }
    setUploading(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Synchronizing organization vault...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl ring-1 ring-primary/20">
              <Settings className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
          <div>
              <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure your organization's environment, administrative profile, and security.
              </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList variant="line" className="w-full justify-start border-b border-border/40 pb-0 mb-8">
          <TabsTrigger value="profile" className="pb-3 text-sm px-4 data-[state=active]:text-primary">
            Profile
          </TabsTrigger>
          <TabsTrigger value="billing" className="pb-3 text-sm px-4 data-[state=active]:text-primary">
            Billing
          </TabsTrigger>
          <TabsTrigger value="security" className="pb-3 text-sm px-4 data-[state=active]:text-primary">
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className="pb-3 text-sm px-4 data-[state=active]:text-primary">
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notification" className="pb-3 text-sm px-4 data-[state=active]:text-primary">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="ai" className="pb-3 text-sm px-4 data-[state=active]:text-primary">
            AI Labs
          </TabsTrigger>
          <TabsTrigger value="audit" className="pb-3 text-sm px-4 data-[state=active]:text-primary">
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <div className="mt-2 min-h-[500px]">
          {/* ── PROFILE TAB ────────────────────────────────────────────────── */}
          <TabsContent value="profile" className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* General Identity */}
            <section>
                <div className="flex items-start gap-4 mb-8">
                    <div className="p-2.5 bg-muted/40 rounded-xl border border-border/40 shrink-0">
                        <Globe className="w-[18px] h-[18px] text-blue-500" />
                    </div>
                    <div className="space-y-1 mt-0.5">
                        <h2 className="text-lg font-bold tracking-tight">General Identity</h2>
                        <p className="text-sm text-muted-foreground">Basic organizational data and branding identifiers.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    {/* Left Column: Upload Logo */}
                    <div className="flex flex-col w-full">
                        <Label className="text-sm font-medium leading-none mb-3">Upload Your Logo</Label>
                        <div 
                            className="group relative w-full h-[228px] bg-muted/20 border-2 border-dashed border-primary/30 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-all overflow-hidden p-6"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? (
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            ) : formData.logo_url ? (
                                <>
                                    <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain p-2 drop-shadow-md" />
                                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                        <div className="flex flex-col items-center gap-3 scale-95 group-hover:scale-100 transition-transform">
                                            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl">
                                                <Camera className="w-6 h-6 text-primary-foreground" />
                                            </div>
                                            <p className="text-xs font-black tracking-[0.2em] uppercase text-foreground drop-shadow-md">Change Logo</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center scale-95 group-hover:scale-100 transition-transform">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                                            <span className="text-primary-foreground text-3xl font-light leading-none">+</span>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-extrabold text-sm tracking-tight text-foreground">Click to upload your logo</p>
                                        <p className="text-xs text-muted-foreground mt-1.5 font-medium">Supports JPG, PNG (Max 5MB)</p>
                                    </div>
                                </div>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleLogoUpload} 
                                className="hidden" 
                                accept="image/*"
                            />
                        </div>
                    </div>

                    {/* Right Column: Identity Details Stack */}
                    <div className="flex flex-col justify-center space-y-8 h-[228px] mt-7">
                        <div className="space-y-2.5">
                            <Label className="text-sm font-medium leading-none">Company Name</Label>
                            <Input 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="Enter the name..."
                                className="h-14 text-sm font-bold border-border/40 bg-muted/10 focus:bg-background transition-colors"
                            />
                        </div>
                        
                        <div className="space-y-2.5">
                            <Label className="text-sm font-medium leading-none">Company Website (Slug)</Label>
                            <div className="h-14 flex items-center px-5 gap-3 bg-muted/40 border border-border/40 rounded-xl text-sm font-bold text-muted-foreground">
                                <Globe className="w-5 h-5 opacity-40 shrink-0" />
                                <span className="truncate whitespace-nowrap overflow-hidden">envitra.in/sites/<span className="text-foreground">{orgData?.slug}</span></span>
                                <Lock className="w-4 h-4 ml-auto opacity-30 shrink-0" />
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 italic font-medium px-1">This permanent URL connects users to your public portal.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Separator className="opacity-50" />

            {/* Admin Profile Section */}
            <section>
                <div className="flex items-start gap-4 mb-8">
                    <div className="p-2.5 bg-muted/40 rounded-xl border border-border/40 shrink-0">
                        <ShieldCheck className="w-[18px] h-[18px] text-primary" />
                    </div>
                    <div className="space-y-1 mt-0.5">
                        <h2 className="text-lg font-bold tracking-tight">Administrative Liaison</h2>
                        <p className="text-sm text-muted-foreground">Primary account holder and administrative contact details.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="space-y-2.5">
                            <Label className="text-sm font-medium leading-none">Admin Full Name</Label>
                            <Input 
                                value={formData.admin_name}
                                onChange={(e) => setFormData({...formData, admin_name: e.target.value})}
                                className="h-14 font-bold border-border/40 bg-muted/5 focus:bg-background"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <Label className="text-sm font-medium leading-none">Admin Email Address</Label>
                            <div className="relative">
                                <Input 
                                    value={formData.admin_email}
                                    onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                                    className="h-14 font-bold pl-12 border-border/40 bg-muted/5 focus:bg-background"
                                />
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2.5">
                            <Label className="text-sm font-medium leading-none">Admin Phone Number</Label>
                            <div className="relative">
                                <Input 
                                    value={formData.admin_phone}
                                    onChange={(e) => setFormData({...formData, admin_phone: e.target.value})}
                                    className="h-14 font-bold pl-12 border-border/40 bg-muted/5 focus:bg-background"
                                />
                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <Label className="text-sm font-medium leading-none">Onboarded At</Label>
                            <div className="flex items-center gap-3 px-5 h-14 bg-muted/20 border border-border/40 rounded-xl text-sm font-bold text-muted-foreground/60 italic">
                                <CalendarDays className="w-5 h-5" />
                                <span>{orgData?.onboarded_at ? format(new Date(orgData.onboarded_at), 'PPP') : 'Not available'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Separator className="opacity-50" />

            {/* Brand Customization & NFC Preview Section */}
            <section className="relative">
                

                <div className="flex items-start gap-4 mb-8">
                    <div className="p-2.5 bg-muted/40 rounded-xl border border-border/40 shrink-0">
                        <Palette className="w-[18px] h-[18px] text-purple-500" />
                    </div>
                    <div className="space-y-1 mt-0.5">
                        <h2 className="text-lg font-bold tracking-tight">Brand Customization</h2>
                        <p className="text-sm text-muted-foreground">Design your organization's digital interface and smart hardware colors.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {/* Left: NFC Card Preview */}
                    <div className="flex flex-col items-center justify-center space-y-6 relative">
                        {/* Glow Effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-3xl opacity-50 pointer-events-none rounded-full" style={{ backgroundColor: formData.brand_color }} />
                        
                        <div 
                            className="relative w-[320px] h-[200px] rounded-[24px] shadow-2xl border border-white/20 overflow-hidden transform transition-all duration-500 z-10" 
                            style={{ backgroundColor: formData.brand_color }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-black/10 to-transparent" />
                            
                            {/* NFC Symbol (White, Top Right) */}
                            <div className="absolute top-6 right-6 text-white">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 drop-shadow-md">
                                    <path d="M6 2L6 22" />
                                    <path d="M10 4L10 20" />
                                    <path d="M14 6L14 18" />
                                    <path d="M18 8L18 16" />
                                </svg>
                            </div>

                            {/* Text Details (Accent Color, Logo Removed) */}
                            <div className="absolute bottom-6 left-6 flex flex-col gap-0.5" style={{ color: formData.accent_color }}>
                                <span className="font-extrabold tracking-wide drop-shadow-md text-[15px]">{formData.name || 'Organization Identity'}</span>
                                <span className="font-bold text-[10px] uppercase tracking-widest opacity-90">Smart Access</span>
                            </div>
                        </div>
                        <Label className="text-xs font-medium text-muted-foreground text-center">Live Smart Card Preview</Label>
                    </div>

                    {/* Right: Color Pickers */}
                    <div className="space-y-6">
                        <div className="flex flex-col h-full justify-between space-y-4 pt-2">
                            <Label className="text-sm font-medium leading-none mb-1">Visual Identity Tokens</Label>
                            
                            {/* Brand Color Picker */}
                            <ColorPicker 
                                value={formData.brand_color} 
                                onChange={(color, hex) => setFormData({...formData, brand_color: hex})}
                                trigger="click"
                            >
                                <div className="group relative h-[88px] w-full rounded-2xl flex items-center px-6 gap-6 cursor-pointer hover:-translate-y-1 transition-all border border-border/40 bg-muted/10 shadow-sm overflow-hidden">
                                    <div className="absolute inset-0 z-0 transition-opacity opacity-0 group-hover:opacity-10" style={{ backgroundColor: formData.brand_color }} />
                                    <div className="w-12 h-12 rounded-xl border-[3px] border-background shadow-md shrink-0 z-10" style={{ backgroundColor: formData.brand_color }} />
                                    <div className="flex flex-col z-10 flex-1">
                                        <span className="text-base font-bold tracking-tight">Primary Brand Color</span>
                                        <span className="text-xs font-mono text-muted-foreground uppercase">{formData.brand_color}</span>
                                    </div>
                                </div>
                            </ColorPicker>

                            {/* Accent Color Picker */}
                            <ColorPicker 
                                value={formData.accent_color} 
                                onChange={(color, hex) => setFormData({...formData, accent_color: hex})}
                                trigger="click"
                            >
                                <div className="group relative h-[88px] w-full rounded-2xl flex items-center px-6 gap-6 cursor-pointer hover:-translate-y-1 transition-all border border-border/40 bg-muted/10 shadow-sm overflow-hidden">
                                    <div className="absolute inset-0 z-0 transition-opacity opacity-0 group-hover:opacity-10" style={{ backgroundColor: formData.accent_color }} />
                                    <div className="w-12 h-12 rounded-xl border-[3px] border-background shadow-md shrink-0 z-10" style={{ backgroundColor: formData.accent_color }} />
                                    <div className="flex flex-col z-10 flex-1">
                                        <span className="text-base font-bold tracking-tight">Highlight Accent Color</span>
                                        <span className="text-xs font-mono text-muted-foreground uppercase">{formData.accent_color}</span>
                                    </div>
                                </div>
                            </ColorPicker>
                            <p className="text-[10px] text-muted-foreground/60 italic font-medium px-2 pt-2">
                                These colors dictate the styling of physical hardware and digital wallets.
                            </p>
                        </div>
                    </div>
                 </div>
            </section>

            <div className="flex justify-end pt-2 pb-6">
                <Button 
                    onClick={handleSaveProfile} 
                    disabled={saving}
                    className="min-w-[180px] h-11 font-semibold text-sm shadow-sm hover:-translate-y-0.5 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> 
                      Save Changes
                    </>
                  )}
                </Button>
            </div>
          </TabsContent>

          {/* ── BILLING TAB ──────────────────────────────────────────────── */}
          <TabsContent value="billing" className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <section>
                <div className="flex items-start gap-4 mb-8">
                    <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20 shrink-0">
                        <CreditCard className="w-[18px] h-[18px] text-primary" />
                    </div>
                    <div className="space-y-1 mt-0.5">
                        <h2 className="text-lg font-bold tracking-tight">Subscription & Billing</h2>
                        <p className="text-sm text-muted-foreground">Manage your current plan, upgrade options, and invoicing history.</p>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                    {/* Basic Plan */}
                    <div className={cn("border rounded-2xl p-7 relative overflow-hidden flex flex-col justify-between transition-all", (invoices[0]?.plan !== 'premium') ? "border-primary/40 bg-primary/5" : "border-border/50 bg-card")}>
                        {(invoices[0]?.plan !== 'premium') && (
                            <div className="absolute top-0 right-6 py-1 px-3.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest rounded-b-lg">Current Plan</div>
                        )}
                        <div>
                            <div className="space-y-1.5 mb-6 mt-1">
                                <h3 className="text-xl font-bold tracking-tight">Basic</h3>
                                <p className="text-sm text-muted-foreground">Perfect for small teams getting started.</p>
                            </div>
                            <div className="flex items-end gap-1.5 mb-6">
                                <span className="text-4xl font-black tracking-tight">₹5,000</span>
                                <span className="text-sm font-medium text-muted-foreground mb-1">/&nbsp;month</span>
                            </div>
                        </div>
                        <Button 
                            variant={(invoices[0]?.plan !== 'premium') ? "outline" : "default"} 
                            className="w-full h-10 font-semibold text-sm" 
                            disabled={(invoices[0]?.plan !== 'premium' || saving)}
                            onClick={() => handlePlanChange('basic')}
                        >
                            {(invoices[0]?.plan !== 'premium') ? "Your Current Plan" : "Downgrade to Basic"}
                        </Button>
                    </div>

                    {/* Premium Plan */}
                    <div className={cn("border rounded-2xl p-7 relative overflow-hidden flex flex-col justify-between transition-all", (invoices[0]?.plan === 'premium') ? "border-primary/40 bg-primary/5" : "border-border/50 bg-card")}>
                        {/* Most Popular badge */}
                        {(invoices[0]?.plan !== 'premium') && (
                            <div className="absolute top-0 right-6 py-1 px-3.5 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-b-lg">Most Popular</div>
                        )}
                        {(invoices[0]?.plan === 'premium') && (
                            <div className="absolute top-0 right-6 py-1 px-3.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest rounded-b-lg">Current Plan</div>
                        )}
                        <div>
                            <div className="space-y-1.5 mb-6 mt-1">
                                <h3 className="text-xl font-bold tracking-tight">Premium</h3>
                                <p className="text-sm text-muted-foreground">Built for large-scale organizations.</p>
                            </div>
                            <div className="flex items-end gap-1.5 mb-1">
                                <span className="text-4xl font-black tracking-tight">₹60,000</span>
                                <span className="text-sm font-medium text-muted-foreground mb-1">/&nbsp;year</span>
                            </div>
                            <p className="text-xs text-emerald-600 font-semibold mb-6">₹5,000/mo — save 2 months vs. monthly billing</p>
                        </div>
                        <Button 
                            variant={(invoices[0]?.plan === 'premium') ? "outline" : "default"} 
                            className="w-full h-10 font-semibold text-sm" 
                            disabled={(invoices[0]?.plan === 'premium' || saving)}
                            onClick={() => handlePlanChange('premium')}
                        >
                            {(invoices[0]?.plan === 'premium') ? "Your Current Plan" : "Upgrade to Premium"}
                        </Button>
                    </div>
                </div>

                {/* Billing History Table */}
                <BillingDataTable 
                    data={invoices} 
                    onDelete={handleDeleteInvoice}
                    onStatusChange={handleUpdateInvoiceStatus}
                />
            </section>
          </TabsContent>

          {/* ── SECURITY TAB ──────────────────────────────────────────────── */}
          <TabsContent value="security" className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Account Security Portfolio */}
            <section>
                <div className="flex items-start gap-4 mb-8">
                    <div className="p-2.5 bg-muted/40 rounded-xl border border-border/40 shrink-0">
                        <KeyRound className="w-[18px] h-[18px] text-primary" />
                    </div>
                    <div className="space-y-1 mt-0.5">
                        <h2 className="text-lg font-bold tracking-tight">Account Security Portfolio</h2>
                        <p className="text-sm text-muted-foreground">Update your administrative access credentials and manage secure session keys.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="border border-border/40 bg-card rounded-2xl overflow-hidden">
                        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                             <div className="flex items-start gap-4">
                                 <div className="p-3 bg-muted/50 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                                    <Lock className="w-5 h-5 text-muted-foreground" />
                                 </div>
                                 <div className="space-y-1">
                                     <h3 className="font-bold tracking-tight">Account Password</h3>
                                     <p className="text-xs text-muted-foreground font-medium">Last changed <span className="font-semibold text-foreground/80">Jan 14, 2026</span></p>
                                 </div>
                             </div>
                             <Button variant="secondary" className="h-9 font-semibold text-xs px-5 shadow-sm w-full sm:w-auto">Change Password</Button>
                        </div>
                        <div className="px-6 py-3.5 bg-amber-500/5 dark:bg-amber-500/10 border-t border-amber-500/10 flex items-start gap-3">
                            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-800 dark:text-amber-200/80 font-medium leading-relaxed">
                                For security reasons, resetting your password will instantly terminate all active administrative sessions across all devices.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Separator className="opacity-50" />

            {/* 2FA Section */}
            <section>
                <div className="flex items-start gap-4 mb-8">
                    <div className="p-2.5 bg-muted/40 rounded-xl border border-border/40 shrink-0">
                        <ShieldAlert className="w-[18px] h-[18px] text-rose-500" />
                    </div>
                    <div className="space-y-1 mt-0.5">
                        <h2 className="text-lg font-bold tracking-tight">Two-factor authentication (2FA)</h2>
                        <p className="text-sm text-muted-foreground">Keep your account secure by enabling 2FA via SMS or using OTP form authenticator app.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* SMS 2FA */}
                    <div className="border border-border/40 bg-muted/5 rounded-2xl flex flex-row items-center p-5 gap-4">
                        <div className="p-2.5 bg-muted/50 rounded-xl shrink-0">
                            <MessageSquare className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold tracking-tight">Text message (SMS)</h3>
                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">Coming Soon</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">Receive a one-time passcode via SMS each time you log in.</p>
                        </div>
                        <div className="shrink-0 opacity-30">
                            <Switch checked={false} disabled />
                        </div>
                    </div>

                    {/* TOTP 2FA */}
                    <div className="border border-border/40 bg-muted/5 rounded-2xl flex flex-row items-center p-5 gap-4">
                        <div className="p-2.5 bg-muted/50 rounded-xl shrink-0">
                            <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold tracking-tight">Authenticator app (TOTP)</h3>
                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">Coming Soon</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">Use an app to receive a temporary one-time passcode each time you log in.</p>
                        </div>
                        <div className="shrink-0 opacity-30">
                            <Switch checked={false} disabled />
                        </div>
                    </div>
                </div>
            </section>

            <Separator className="opacity-50 my-10" />

            {/* Browsers and devices */}
            <section>
                <div className="flex items-start gap-4 mb-8">
                    <div className="p-2.5 bg-muted/40 rounded-xl border border-border/40 shrink-0">
                        <MonitorSmartphone className="w-[18px] h-[18px] text-primary" />
                    </div>
                    <div className="space-y-1 mt-0.5">
                        <h2 className="text-lg font-bold tracking-tight">Browsers and devices</h2>
                        <p className="text-sm text-muted-foreground">These browsers and devices are currently signed in to your account. Remove any unauthorized devices.</p>
                    </div>
                </div>

                <div className="border border-border/40 bg-card rounded-2xl overflow-hidden">
                    {loadingSessions ? (
                        <div className="p-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                    ) : authSessions.length > 0 ? (
                        <div className="divide-y divide-border/40">
                        {authSessions.map((session, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-muted/10 transition-colors gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-muted/50 border border-border/60 flex items-center justify-center shrink-0">
                                       <Monitor className="w-4 h-4 text-muted-foreground/80" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{session.browser || 'Unknown Browser'}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                            <MapPin className="w-3 h-3" />
                                            {session.location || 'Unknown Location'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 pl-13 sm:pl-0">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {session.is_current ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Current session</Badge>
                                        ) : (
                                            session.created_at ? format(new Date(session.created_at), 'MMM d, yyyy') : 'Unknown date'
                                        )}
                                    </span>
                                    {!session.is_current && (
                                        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 font-semibold">Remove</Button>
                                    )}
                                </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-10 gap-3">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                                <ShieldCheckIcon className="w-6 h-6 text-primary" />
                            </div>
                            <p className="text-sm font-semibold">No active sessions found.</p>
                            <p className="text-xs text-muted-foreground text-center max-w-[360px]">No remote authentication signatures or login devices were detected for this account.</p>
                        </div>
                    )}
                </div>
            </section>
          </TabsContent>

          {/* ── APPEARANCE TAB ────────────────────────────────────────────── */}
          <TabsContent value="appearance" className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <section>
                <div className="flex items-start gap-4 mb-8">
                    <div className="p-2.5 bg-muted/40 rounded-xl border border-border/40 shrink-0">
                        <Palette className="w-[18px] h-[18px] text-primary" />
                    </div>
                    <div className="space-y-1 mt-0.5">
                        <h2 className="text-lg font-bold tracking-tight">Interface Preferences</h2>
                        <p className="text-sm text-muted-foreground">Customize how Tap Connect looks on your administrative devices.</p>
                    </div>
                </div>

                <div className="divide-y divide-border/50">
                  {/* Row 1: Theme */}
                  <div className="py-8 first:pt-0 last:pb-0">
                      <div className="space-y-1 mb-6">
                            <Label className="text-base font-bold text-foreground/90">Theme</Label>
                            <p className="text-sm text-muted-foreground">Select your default interface theme</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-6">
                          {/* Dark */}
                          <div className="group cursor-pointer flex flex-col items-center gap-3" onClick={() => setTheme('dark')}>
                              <div className={cn("w-40 h-24 rounded-xl border-2 overflow-hidden transition-all", theme === 'dark' ? "border-primary shadow-sm" : "border-transparent bg-muted/20 hover:border-border/60")}>
                                   <div className="w-full h-full bg-slate-950 flex flex-col">
                                       <div className="h-5 w-full border-b border-white/10 flex items-center px-2 gap-1.5 shrink-0">
                                            <div className="w-6 h-1.5 rounded-full bg-white/20"></div>
                                            <div className="w-10 h-1.5 rounded-full bg-white/10 ml-auto mr-1"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                       </div>
                                       <div className="flex-1 p-2 flex gap-2">
                                           <div className="w-8 h-full rounded-md bg-white/5"></div>
                                           <div className="flex-1 space-y-1.5">
                                               <div className="w-full h-9 rounded-md bg-white/10"></div>
                                               <div className="w-3/4 h-2.5 rounded-md bg-white/5"></div>
                                           </div>
                                       </div>
                                   </div>
                              </div>
                              <span className={cn("text-xs font-semibold", theme === 'dark' ? "text-primary" : "text-muted-foreground group-hover:text-foreground/80")}>Dark</span>
                          </div>

                          {/* System */}
                          <div className="group cursor-pointer flex flex-col items-center gap-3" onClick={() => setTheme('system')}>
                              <div className={cn("w-40 h-24 rounded-xl border-2 overflow-hidden transition-all flex", theme === 'system' ? "border-primary shadow-sm" : "border-transparent bg-muted/20 hover:border-border/60")}>
                                   <div className="w-1/2 h-full bg-slate-100 flex flex-col border-r border-border/80">
                                       <div className="h-5 w-full border-b border-black/5 flex items-center px-2 gap-1 shrink-0">
                                            <div className="w-5 h-1.5 rounded-full bg-black/10"></div>
                                       </div>
                                       <div className="flex-1 p-2 flex flex-col gap-1.5">
                                            <div className="w-full h-7 rounded-md bg-white shadow-sm"></div>
                                            <div className="w-2/3 h-2 rounded-md bg-black/5"></div>
                                       </div>
                                   </div>
                                   <div className="w-1/2 h-full bg-slate-950 flex flex-col">
                                       <div className="h-5 w-full border-b border-white/10 flex items-center justify-end px-1.5 gap-1.5 shrink-0">
                                            <div className="w-6 h-1.5 rounded-full bg-white/10 mr-1"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                       </div>
                                       <div className="flex-1 p-2 flex gap-1.5">
                                            <div className="w-6 h-full rounded-md bg-white/5"></div>
                                            <div className="flex-1 h-7 rounded-md bg-white/10"></div>
                                       </div>
                                   </div>
                              </div>
                              <span className={cn("text-xs font-semibold", theme === 'system' ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80")}>System</span>
                          </div>

                          {/* Light */}
                          <div className="group cursor-pointer flex flex-col items-center gap-3" onClick={() => setTheme('light')}>
                              <div className={cn("w-40 h-24 rounded-xl border-2 overflow-hidden transition-all", theme === 'light' ? "border-primary shadow-sm" : "border-transparent bg-muted/20 hover:border-border/60")}>
                                   <div className="w-full h-full bg-slate-100 flex flex-col">
                                       <div className="h-5 w-full border-b border-black/5 flex items-center px-2 gap-1.5 shrink-0">
                                            <div className="w-6 h-1.5 rounded-full bg-black/10"></div>
                                            <div className="w-10 h-1.5 rounded-full bg-black/5 ml-auto mr-1"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                       </div>
                                       <div className="flex-1 p-2 flex gap-2">
                                           <div className="w-8 h-full rounded-md bg-white border border-black/5"></div>
                                           <div className="flex-1 space-y-1.5">
                                               <div className="w-full h-9 rounded-md bg-white border border-black/5 shadow-sm"></div>
                                               <div className="w-3/4 h-2.5 rounded-md bg-black/5"></div>
                                           </div>
                                       </div>
                                   </div>
                              </div>
                              <span className={cn("text-xs font-semibold", theme === 'light' ? "text-primary" : "text-muted-foreground group-hover:text-foreground/80")}>Light</span>
                          </div>
                      </div>
                  </div>

                  {/* Row 2: Accent Color */}
                  <div className="py-8">
                       <div className="space-y-1 mb-6">
                            <Label className="text-base font-bold text-foreground/90">Accent Color</Label>
                            <p className="text-sm text-muted-foreground">Highlight color for main objects, e.g. buttons</p>
                      </div>
                      <div className="flex items-center gap-4">
                          {['#2563EB', '#06B6D4', '#10B981', '#8B5CF6', '#F59E0B'].map(color => (
                              <button
                                 key={color}
                                 onClick={() => setAppAccent(color)}
                                 className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all", appAccent === color ? "ring-[2.5px] ring-offset-[3px] ring-offset-background scale-110 shadow-sm" : "hover:scale-105 shadow-sm")}
                                 style={{ backgroundColor: color, '--tw-ring-color': color } as React.CSSProperties}
                              >
                                  {appAccent === color && <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={3} />}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Row 3: Chart Palette Theme */}
                  <div className="py-8">
                       <div className="space-y-1 mb-6">
                            <Label className="text-base font-bold text-foreground/90">Data Visualization Colors</Label>
                            <p className="text-sm text-muted-foreground">Select a dynamic color palette mapping across all progress bars, statistics, and live charts</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                          {[
                              { id: 'ocean', name: 'Ocean Blue', colors: ['#2563EB', '#60A5FA', '#1D4ED8', '#93C5FD', '#3B82F6'] },
                              { id: 'sunset', name: 'Vibrant Sunset', colors: ['#F43F5E', '#FB923C', '#DB2777', '#FBBF24', '#E11D48'] },
                              { id: 'emerald', name: 'Emerald Forest', colors: ['#10B981', '#34D399', '#059669', '#6EE7B7', '#047857'] },
                              { id: 'neon', name: 'Neon Cyberpunk', colors: ['#8B5CF6', '#C084FC', '#7C3AED', '#E879F9', '#6D28D9'] }
                          ].map(theme => (
                              <div 
                                  key={theme.id}
                                  onClick={() => setAppChartTheme(theme.id)}
                                  className={cn("cursor-pointer rounded-2xl border-2 p-5 transition-all hover:border-border", appChartTheme === theme.id ? "border-primary bg-primary/5 shadow-sm" : "border-border/40 bg-muted/20")}
                              >
                                  <span className={cn("text-[15px] font-bold block mb-4", appChartTheme === theme.id ? "text-primary" : "text-foreground")}>{theme.name}</span>
                                  <div className="flex w-full h-10 overflow-hidden rounded-lg shadow-inner">
                                      {theme.colors.map((c, i) => (
                                          <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }}></div>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Row 4: Font Style */}
                  <div className="py-8">
                      <div className="space-y-1 mb-6">
                            <Label className="text-base font-bold text-foreground/90">Font style</Label>
                            <p className="text-sm text-muted-foreground">Font style for text and headings</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                          {[{ name: 'Inter', family: 'var(--font-inter)' }, { name: 'Jakarta', family: 'var(--font-jakarta)' }, { name: 'Outfit', family: 'var(--font-outfit)' }, { name: 'DM Sans', family: 'var(--font-dmsans)' }].map(f => (
                              <button
                                 key={f.name}
                                 title={f.name}
                                 onClick={() => setAppFont(f.name)}
                                 style={{ fontFamily: f.family }}
                                 className={cn("h-14 px-5 rounded-xl border-2 flex flex-col items-center justify-center transition-all", appFont === f.name ? "border-primary text-primary shadow-sm bg-primary/5" : "border-border/60 text-foreground/80 hover:bg-muted/50 hover:border-border")}
                              >
                                  <span className="text-lg font-bold leading-none">Aa</span>
                                  <span className="text-[9px] mt-1.5 uppercase tracking-widest font-bold opacity-60 leading-none">{f.name}</span>
                              </button>
                          ))}
                      </div>
                  </div>
                </div>
            </section>
          </TabsContent>

          {/* ── NOTIFICATIONS TAB ─────────────────────────────────────────── */}
          <TabsContent value="notification" className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500 pb-10 w-full">
            <div className="flex items-start gap-4 mb-8 border-b border-border/40 pb-6 w-full">
                <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20 shrink-0">
                    <Bell className="w-[18px] h-[18px] text-primary" />
                </div>
                <div className="space-y-1.5 mt-0.5">
                    <h2 className="text-xl font-bold tracking-tight">Notification Preferences</h2>
                    <p className="text-sm text-muted-foreground">Choose what updates you want to receive and manage your communication flow.</p>
                </div>
            </div>

            <div className="space-y-10 w-full">
                {/* Section 1: Employee Activity */}
                <section className="w-full">
                    <h3 className="text-xs font-black text-muted-foreground tracking-[0.15em] uppercase mb-4 ml-1">Employee Activity</h3>
                    <div className="border border-border/50 rounded-2xl bg-card divide-y divide-border/50 w-full overflow-hidden shadow-sm">
                        {[
                            { id: "leads", title: "LEADS", desc: "Get notified immediately when a new lead is captured by an employee." },
                            { id: "taps", title: "TAPS", desc: "Receive alerts when NFC cards are scanned or shared." },
                            { id: "nfc_cards", title: "NFC CARDS", desc: "Status updates when cards are requested, activated, or deactivated." }
                        ].map((v, i) => (
                            <div key={i} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors w-full">
                                <div className="space-y-1.5 pr-6 flex-1">
                                    <Label className="text-[15px] font-bold tracking-widest text-foreground cursor-pointer block">{v.title}</Label>
                                    <p className="text-[13px] text-muted-foreground leading-relaxed">{v.desc}</p>
                                </div>
                                <Switch 
                                    checked={notifSettings[v.id] || false} 
                                    onCheckedChange={(checked) => handleNotificationToggle(v.id, checked)}
                                    className="data-[state=checked]:bg-primary shrink-0" 
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section 2: Report */}
                <section className="w-full">
                    <h3 className="text-xs font-black text-muted-foreground tracking-[0.15em] uppercase mb-4 ml-1">Report</h3>
                    <div className="border border-border/50 rounded-2xl bg-card divide-y divide-border/50 w-full overflow-hidden shadow-sm">
                        {[
                            { id: "daily_pulse", title: "DAILY PULSE", desc: "A morning summary of the previous day's taps and lead capture metrics." },
                            { id: "weekly_roundup", title: "WEEKLY ROUNDUP", desc: "A weekly rollup report with performance comparisons across departments." },
                            { id: "monthly_digest", title: "MONTHLY DIGEST", desc: "A comprehensive monthly report detailing analytical growth and asset usage." }
                        ].map((v, i) => (
                            <div key={i} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors w-full">
                                <div className="space-y-1.5 pr-6 flex-1">
                                    <Label className="text-[15px] font-bold tracking-widest text-foreground cursor-pointer block">{v.title}</Label>
                                    <p className="text-[13px] text-muted-foreground leading-relaxed">{v.desc}</p>
                                </div>
                                <Switch 
                                    checked={notifSettings[v.id] || false} 
                                    onCheckedChange={(checked) => handleNotificationToggle(v.id, checked)}
                                    className="data-[state=checked]:bg-primary shrink-0" 
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section 3: Payment and billing */}
                <section className="w-full">
                    <h3 className="text-xs font-black text-muted-foreground tracking-[0.15em] uppercase mb-4 ml-1">Payment & Billing</h3>
                    <div className="border border-border/50 rounded-2xl bg-card divide-y divide-border/50 w-full overflow-hidden shadow-sm">
                        {[
                            { id: "invoices_receipts", title: "INVOICES & RECEIPTS", desc: "Receive immediate copies of your invoices when payments are processed." },
                            { id: "accounting_updates", title: "ACCOUNTING UPDATES", desc: "When accounting and bookkeeping transactions need your attention." },
                            { id: "upcoming_bills", title: "UPCOMING BILLS", desc: "When you need to be reminded of upcoming invoice renewals or late bills." }
                        ].map((v, i) => (
                            <div key={i} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors w-full">
                                <div className="space-y-1.5 pr-6 flex-1">
                                    <Label className="text-[15px] font-bold tracking-widest text-foreground cursor-pointer block">{v.title}</Label>
                                    <p className="text-[13px] text-muted-foreground leading-relaxed">{v.desc}</p>
                                </div>
                                <Switch 
                                    checked={notifSettings[v.id] || false} 
                                    onCheckedChange={(checked) => handleNotificationToggle(v.id, checked)}
                                    className="data-[state=checked]:bg-primary shrink-0" 
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section 4: Email Delivery Configuration */}
                <section className="w-full">
                    <h3 className="text-xs font-black text-muted-foreground tracking-[0.15em] uppercase mb-4 ml-1">Delivery Channels</h3>
                    <div className="border border-border/50 rounded-2xl bg-card w-full overflow-hidden shadow-sm flex flex-col xl:flex-row">
                        
                        {/* Primary Admin Block */}
                        <div className="p-6 border-b xl:border-b-0 xl:border-r border-border/50 bg-muted/10 flex-1 flex flex-col justify-start">
                            <div className="space-y-1.5 mb-8">
                                <Label className="text-[15px] font-bold tracking-widest text-foreground block">PRIMARY ADMIN</Label>
                                <p className="text-[13px] text-muted-foreground leading-relaxed">Default recipient for all configured platform notifications.</p>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background border border-border/50 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Mail className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="text-sm font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">{formData.admin_email || 'admin@example.com'}</span>
                                </div>
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none shadow-none text-[10px] uppercase font-bold tracking-wider shrink-0">Active</Badge>
                            </div>

                            {/* Dynamic Space Filler */}
                            {extraEmails.length > 0 && (
                                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl animate-in fade-in zoom-in-95 duration-500">
                                    <div className="flex items-start gap-3">
                                        <Activity className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                        <div className="space-y-1.5">
                                            <p className="text-[11px] font-black text-primary tracking-widest uppercase">Split Delivery Active</p>
                                            <p className="text-[12px] text-muted-foreground leading-relaxed">System notifications will automatically copy all {extraEmails.length} secondary recipients ensuring your broader team is kept completely in the loop.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Additional Recipients Block */}
                        <div className="p-6 flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-6">
                                    <div className="space-y-1.5 flex-1 pr-6">
                                        <Label className="text-[15px] font-bold tracking-widest text-foreground block">ADDITIONAL RECIPIENTS</Label>
                                        <p className="text-[13px] text-muted-foreground leading-relaxed">Add team members or external addresses to receive a copy of these alerts. You can add up to 3.</p>
                                    </div>
                                    <Badge variant="outline" className="shrink-0 text-xs font-bold text-muted-foreground bg-muted/20 border-border/50">
                                        {extraEmails.length} / 3
                                    </Badge>
                                </div>
                                
                                {extraEmails.length > 0 && (
                                    <div className="space-y-3 mb-6">
                                        {extraEmails.map((email, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-muted/20 border border-border/50 rounded-xl animate-in slide-in-from-bottom-2 fade-in duration-300">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                                        <Mail className="w-3.5 h-3.5 text-primary" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">{email}</span>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleUpdateExtraEmails(extraEmails.filter((_, i) => i !== idx))}
                                                    className="h-7 text-[10px] text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 uppercase font-bold tracking-wider"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3 mt-auto">
                                <Input 
                                    placeholder={extraEmails.length >= 3 ? "Limit reached" : "finance@company.com"}
                                    value={newEmailInput}
                                    onChange={(e) => setNewEmailInput(e.target.value)}
                                    disabled={extraEmails.length >= 3}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const trimmedEmail = newEmailInput.trim();
                                            if (trimmedEmail && extraEmails.length < 3) {
                                                const normalizedPrev = extraEmails.map(em => em.toLowerCase());
                                                if (!normalizedPrev.includes(trimmedEmail.toLowerCase())) {
                                                    handleUpdateExtraEmails([...extraEmails, trimmedEmail]);
                                                }
                                                setNewEmailInput('');
                                            }
                                        }
                                    }}
                                    className="h-11 bg-muted/20 border-border/50 flex-1 rounded-xl disabled:opacity-50" 
                                />
                                <Button 
                                    disabled={extraEmails.length >= 3}
                                    className="h-11 px-5 rounded-xl font-bold tracking-widest text-xs shrink-0 transition-transform active:scale-95 disabled:opacity-50"
                                    onClick={() => {
                                        const trimmedEmail = newEmailInput.trim();
                                        if (trimmedEmail && extraEmails.length < 3) {
                                            const normalizedPrev = extraEmails.map(em => em.toLowerCase());
                                            if (!normalizedPrev.includes(trimmedEmail.toLowerCase())) {
                                                handleUpdateExtraEmails([...extraEmails, trimmedEmail]);
                                            }
                                            setNewEmailInput('');
                                        }
                                    }}
                                >
                                    ADD EMAIL
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
          </TabsContent>

          {/* ── AI LABS TAB ───────────────────────────────────────────────── */}
          <TabsContent value="ai" className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <section>
                <div className="flex items-start gap-4 mb-8">
                    <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20 shrink-0">
                        <Sparkles className="w-[18px] h-[18px] text-primary" />
                    </div>
                    <div className="space-y-1 mt-0.5">
                        <h2 className="text-lg font-bold tracking-tight">AI Intelligence Suite</h2>
                        <p className="text-sm text-muted-foreground">Configure how AI models summarize and process data across your organizational dashboard.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Module Toggles */}
                    {[
                        { id: 'employees_enabled', label: 'Employee Summaries', desc: 'AI-generated snapshots of employee activity and performance.', icon: User },
                        { id: 'nfc_cards_enabled', label: 'NFC Card Intelligence', desc: 'Deep analysis of card tap patterns and location heatmaps.', icon: MonitorSmartphone },
                        { id: 'leads_enabled', label: 'Lead Generation Insights', desc: 'Predictive leads scoring and engagement summaries.', icon: Smartphone },
                        { id: 'links_enabled', label: 'Link Management AI', desc: 'Automatic optimization and categorization of managed links.', icon: Globe },
                    ].map((feature) => (
                        <div key={feature.id} className="border border-border/40 bg-card rounded-2xl p-6 flex items-start gap-4 hover:border-primary/20 transition-all group">
                            <div className="p-3 bg-muted/50 rounded-xl group-hover:bg-primary/5 transition-colors">
                                <feature.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <h3 className="text-[15px] font-bold tracking-tight text-foreground">{feature.label}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                            </div>
                            <Switch 
                                checked={(aiSettings as any)[feature.id]} 
                                onCheckedChange={(val) => {
                                    const next = { ...aiSettings, [feature.id]: val }
                                    setAiSettings(next)
                                    handleSaveAISettings(next)
                                }}
                                className="mt-1"
                            />
                        </div>
                    ))}
                </div>

                <Separator className="my-12 opacity-50" />

                {/* Prompt Management */}
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-1">
                             <div className="flex items-center gap-2.5 mb-2">
                                <div className="p-2 bg-muted/40 rounded-lg">
                                    <Wand2 className="w-4 h-4 text-primary" />
                                </div>
                                <h2 className="text-base font-bold tracking-tight">AI Prompt Library</h2>
                             </div>
                             <p className="text-sm text-muted-foreground max-w-2xl">Manage the baseline instructions used by our models to process your datasets and generate summaries.</p>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsAddingPrompt(true)}
                            disabled={prompts.length >= 6}
                            className="h-9 px-4 rounded-xl font-bold text-xs uppercase tracking-widest gap-2 bg-background border-border/40 hover:bg-muted/30 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Plus className="w-3.5 h-3.5" /> {prompts.length >= 6 ? 'LIMIT REACHED' : 'ADD NEW PROMPT'}
                        </Button>
                    </div>

                    {/* New Prompt Input */}
                    {isAddingPrompt && (
                        <div className="p-5 border border-primary/20 bg-primary/5 rounded-2xl animate-in zoom-in-95 duration-300 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-primary tracking-widest uppercase ml-1">NEW PROMPT DIRECTIVE</Label>
                                <Input 
                                    className="h-12 bg-background border-primary/20 font-medium placeholder:italic text-sm" 
                                    placeholder="Enter AI prompt instruction..."
                                    value={newPromptText}
                                    onChange={(e) => setNewPromptText(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                                <Button variant="ghost" size="sm" onClick={() => { setIsAddingPrompt(false); setNewPromptText(''); }} className="text-xs font-bold uppercase tracking-widest h-8 px-4">Cancel</Button>
                                <Button 
                                    size="sm" 
                                    onClick={() => {
                                        if (newPromptText.trim()) {
                                            const nextPrompts = [{ prompt: newPromptText.trim() }, ...prompts]
                                            setPrompts(nextPrompts)
                                            handleSaveAISettings(undefined, nextPrompts)
                                            setNewPromptText('')
                                            setIsAddingPrompt(false)
                                        }
                                    }}
                                    className="text-xs font-bold uppercase tracking-widest h-8 px-5 rounded-lg"
                                >
                                    Append to Library
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {prompts.map((p, idx) => (
                            <div key={idx} className="group border border-border/40 bg-card rounded-2xl p-5 hover:border-primary/20 hover:shadow-sm transition-all animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-start justify-between gap-6">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[9px] font-black tracking-[0.2em] uppercase text-muted-foreground bg-muted/20 border-border/40 border-none px-2 py-0.5">Prompt #{idx + 1}</Badge>
                                        </div>
                                        {isEditingPrompt?.index === idx ? (
                                            <div className="space-y-3">
                                                <Input 
                                                    className="h-11 bg-muted/20 border-primary/30 font-medium shadow-inner"
                                                    value={isEditingPrompt.text}
                                                    onChange={(e) => setIsEditingPrompt({ ...isEditingPrompt, text: e.target.value })}
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Button size="sm" className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest rounded-lg" onClick={() => {
                                                        const newPrompts = [...prompts]
                                                        newPrompts[idx] = { prompt: isEditingPrompt.text }
                                                        setPrompts(newPrompts)
                                                        handleSaveAISettings(undefined, newPrompts)
                                                        setIsEditingPrompt(null)
                                                    }}>Save Changes</Button>
                                                    <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest" onClick={() => setIsEditingPrompt(null)}>Cancel</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm font-semibold leading-relaxed text-foreground/80 pl-1">{p.prompt}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-10 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors" onClick={() => setIsEditingPrompt({ index: idx, text: p.prompt })}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-colors" onClick={() => {
                                            const nextPrompts = prompts.filter((_, i) => i !== idx)
                                            setPrompts(nextPrompts)
                                            handleSaveAISettings(undefined, nextPrompts)
                                        }}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
          </TabsContent>

          {/* ── AUDIT LOG TAB ─────────────────────────────────────────────── */}
          <TabsContent value="audit" className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <section>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-muted/40 rounded-xl border border-border/40 shrink-0">
                            <History className="w-[18px] h-[18px] text-primary" />
                        </div>
                        <div className="space-y-1 mt-0.5">
                            <h2 className="text-lg font-bold tracking-tight">Administrative Ledger</h2>
                            <p className="text-sm text-muted-foreground">A real-time record of all administrative actions performed within this site.</p>
                        </div>
                    </div>
                </div>
                
                <AuditDataTable data={MOCK_LOGS} />
            </section>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
