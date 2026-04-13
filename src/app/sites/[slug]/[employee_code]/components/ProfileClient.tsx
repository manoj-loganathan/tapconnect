"use client"
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  UserPlus, 
  Share2, 
  ChevronRight, 
  Globe, 
  Plus,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Briefcase,
  Link as LinkIcon,
  Bookmark,
  Contact
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from "@/components/ThemeToggle"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit2, Save, X, Settings2 } from 'lucide-react'
import DeactivatedView from './DeactivatedView'

export default function ProfileClient({ 
  employee, 
  org, 
  links, 
  isLocked,
  activeCardId
}: { 
  employee: any, 
  org: any, 
  links: any[],
  isLocked: boolean,
  activeCardId: string | null
}) {
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [leadSent, setLeadSent] = useState(false)
  const [sendingLead, setSendingLead] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Realtime Live State
  const [liveEmployee, setLiveEmployee] = useState(employee)
  const [liveLinks, setLiveLinks] = useState(links)

  // Form State
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' })

  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
     phone: employee.phone || '',
     email: employee.email || ''
  })
  const [saving, setSaving] = useState(false)

  // Realtime Logic
  const [liveLocked, setLiveLocked] = useState(isLocked)
  const [liveDeactivated, setLiveDeactivated] = useState(false)

  // Re-calculate locked state from card array
  const calculateLockedStatus = (cards: any[]) => {
    const activeCards = cards.filter(c => c.status === 'active')
    if (activeCards.length === 0) return true
    return activeCards.every(c => c.is_locked)
  }

  // Re-calculate deactivated state from employee and cards
  const calculateDeactivatedStatus = (emp: any, cards: any[]) => {
    if (!emp.is_active) return true
    if (cards && cards.length > 0) {
      return cards.every(c => c.status === 'deactivated')
    }
    return false
  }

  useEffect(() => {
    setMounted(true)
    logTap()
    
    // Realtime subscriptions
    const channel = supabase.channel(`profile-${employee.id}`)
      .on('postgres_changes', { event: '*', schema: 'tapconnect', table: 'employees', filter: `id=eq.${employee.id}` }, async (payload: any) => {
        if (payload.new) {
           setLiveEmployee(payload.new)
           // If employee becomes inactive, deactivate immediately
           if (payload.new.is_active === false) setLiveDeactivated(true)
           else {
             // Re-check overall status if they become active
             const { data: cards } = await supabase.from('nfc_cards').select('*').eq('employee_id', employee.id)
             setLiveDeactivated(calculateDeactivatedStatus(payload.new, cards || []))
           }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'tapconnect', table: 'nfc_cards', filter: `employee_id=eq.${employee.id}` }, async () => {
         // Re-fetch cards and re-calc everything
         const { data: cards } = await supabase.from('nfc_cards').select('*').eq('employee_id', employee.id)
         if (cards) {
            setLiveLocked(calculateLockedStatus(cards))
            setLiveDeactivated(calculateDeactivatedStatus(liveEmployee, cards))
            
            // If it becomes locked, exit edit mode
            const locked = calculateLockedStatus(cards)
            if (locked) setIsEditing(false)
         }
      })
      .on('postgres_changes', { event: '*', schema: 'tapconnect', table: 'card_links', filter: `org_id=eq.${org.id}` }, async () => {
         // Re-fetch links if any change happens, to handle assigned_to matching easily
         const { data } = await supabase.from('card_links').select('*').eq('org_id', org.id)
         if (data) {
           const sorted = data.filter(l => l.assigned_to?.includes(employee.id) && l.is_active)
             .sort((a,b) => (a.display_order ?? 0) - (b.display_order ?? 0))
           setLiveLinks(sorted)
         }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [employee.id, org.id])

  const logTap = async () => {
    try {
      let city = 'Unknown'
      try {
        const res = await fetch('https://ipapi.co/json/')
        const data = await res.json()
        if (data.city) city = data.city
      } catch (err) {
        console.warn('Could not fetch geolocation', err)
      }

      await supabase.from('taps').insert({
        org_id: org.id,
        employee_id: employee.id,
        card_id: activeCardId,
        device: navigator.userAgent,
        os: navigator.platform,
        city: city
      })
    } catch (err) {
      console.error('Failed to log tap:', err)
    }
  }

  const handleLinkClick = async (link: any) => {
    try {
      await supabase.from('card_link_clicks').insert({
        org_id: org.id,
        card_link_id: link.id,
        employee_id: liveEmployee.id,
        platform: link.platform
      })
    } catch (err) {
      console.error('Failed to log link click:', err)
    }
  }

  const handleSaveContact = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${liveEmployee.name}
ORG:${org.name}
TITLE:${liveEmployee.designation}
TEL;TYPE=CELL:${liveEmployee.phone}
EMAIL:${liveEmployee.email}
END:VCARD`
    
    const blob = new Blob([vcard], { type: 'text/vcard' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${liveEmployee.name.replace(' ', '_')}.vcf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSendingLead(true)
    try {
       const { error } = await supabase.from('leads').insert({
          org_id: org.id,
          employee_id: liveEmployee.id,
          visitor_name: form.name,
          visitor_email: form.email,
          visitor_phone: form.phone,
          visitor_company: form.company,
          status: 'new'
       })
       if (error) throw error
       setLeadSent(true)
       setTimeout(() => {
         setShowLeadForm(false)
         setLeadSent(false)
         setForm({ name: '', email: '', phone: '', company: '' })
       }, 2000)
    } catch (err) {
       alert('Failed to send details. Please try again.')
    } finally {
       setSendingLead(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    let p = (platform || '').toLowerCase().trim()
    if (p.includes('linkedin')) p = 'linkedin'
    else if (p.includes('whatsapp') || p.includes('wa.me')) p = 'whatsapp'
    else if (p.includes('insta')) p = 'instagram'
    else if (p.includes('twitter') || p === 'x') p = 'twitter'
    else if (p.includes('calendly')) p = 'calendly'

    const cls = "w-[18px] h-[18px] opacity-60"

    if (p === 'linkedin') return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    )
    if (p === 'whatsapp') return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
    )
    if (p === 'instagram') return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
    )
    if (p === 'twitter') return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
        </svg>
    )
    if (p === 'calendly') return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5C3.9 4 3 4.9 3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zm0-13H5V6h14v1z" />
        </svg>
    )

    const fallbackCls = "w-[18px] h-[18px] text-muted-foreground opacity-70"
    switch (p) {
        case 'website': return <Globe className={fallbackCls} />
        case 'vcard': return <Contact className={fallbackCls} />
        case 'form': return <Globe className={fallbackCls} />
        default: return <LinkIcon className={fallbackCls} />
    }
  }

  if (!mounted) return null

  if (liveDeactivated) {
    return <DeactivatedView org={org} />
  }

  return (
    <div className="w-full min-h-screen bg-background flex flex-col items-center overflow-x-hidden font-sans pb-20 pt-4 text-foreground transition-colors duration-300">
      
      {/* Figma Container Max Width - Scales for Tablets */}
      <div className="w-full max-w-md md:max-w-2xl mx-auto relative px-5 md:px-10 flex flex-col pt-2 ">
         
         {/* Theme Toggle Utility */}
         <div className="absolute top-6 right-8 z-20 flex items-center gap-2">
            {!liveLocked && (
                <button 
                  onClick={() => setIsEditing(!isEditing)} 
                  className="p-2 rounded-full bg-background border border-border shadow-sm hover:bg-muted transition-colors text-foreground"
                >
                  {isEditing ? <X className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
                </button>
            )}
            <ThemeToggle />
         </div>

         {/* 1. Header Image Cover */}
         <div className="w-full h-40 md:h-56 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mt-2 relative overflow-hidden bg-muted shadow-sm border border-border/50">
             {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="absolute inset-0 w-full h-full object-cover" />
             ) : (
                <div className="text-2xl md:text-3xl font-black text-muted-foreground/30 tracking-widest uppercase relative z-10">{org.name}</div>
             )}
         </div>

         {/* 2. Avatar intersecting bottom-left Edge matched cleanly to text */}
         <div className="relative -mt-10 md:-mt-14 ml-5 md:ml-8 z-10 w-[104px] h-[104px] md:w-[136px] md:h-[136px] rounded-full p-1 bg-background">
            <div className="w-full h-full rounded-full border-[3px] md:border-[4px] border-background overflow-hidden bg-muted shadow-[0_8px_20px_rgb(0,0,0,0.06)] relative group">
                {liveEmployee.photo_url ? (
                   <img src={liveEmployee.photo_url} alt={liveEmployee.name} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-3xl md:text-5xl font-black text-muted-foreground/50">{liveEmployee.name?.substring(0,2).toUpperCase()}</div>
                )}
            </div>
         </div>

          {/* 3. Typography identity aligned left */}
          <div className="px-5 md:px-8 mt-4 md:mt-6 text-left">
            <h1 className="text-[28px] md:text-[40px] font-black text-foreground tracking-tight leading-none mb-1">{liveEmployee.name}</h1>
            <p className="text-xs md:text-sm font-bold text-primary tracking-wide uppercase">{liveEmployee.designation}</p>
            <p className="text-[13px] md:text-[16px] font-medium text-muted-foreground leading-relaxed mt-4 md:mt-6 max-w-[95%]">
               {liveEmployee.bio || "Passionate about connecting with clients and delivering solutions that create real business value."}
            </p>
          </div>

          <AnimatePresence>
            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-5 mt-6 space-y-4 overflow-hidden"
              >
                <div className="bg-muted/30 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-border/50 space-y-4 md:space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={editForm.phone} 
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+1 234 567 890"
                      className="w-full bg-background border border-border/50 rounded-xl md:rounded-2xl px-4 py-3 md:py-4 text-sm md:text-base font-semibold focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                    <input 
                      type="email" 
                      value={editForm.email} 
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="name@company.com"
                      className="w-full bg-background border border-border/50 rounded-xl md:rounded-2xl px-4 py-3 md:py-4 text-sm md:text-base font-semibold focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-2 md:gap-4 pt-2">
                    <button 
                      onClick={async () => {
                         setSaving(true)
                         try {
                            const { error } = await supabase
                             .from('employees')
                             .update({ phone: editForm.phone, email: editForm.email })
                             .eq('id', liveEmployee.id)
                            
                            if (error) throw error
                            setIsEditing(false)
                         } catch (err) {
                            alert('Failed to save changes.')
                         } finally {
                            setSaving(false)
                         }
                      }}
                      disabled={saving}
                      className="flex-1 bg-primary text-primary-foreground font-bold py-3 md:py-4 rounded-xl md:rounded-2xl shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Info
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-4 md:px-6 bg-muted text-muted-foreground font-bold py-3 md:py-4 rounded-xl md:rounded-2xl hover:bg-muted/80 active:scale-95 transition-all text-sm md:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

         {/* 4. Transparent Floating Action Module (Monochrome until hovered) */}
         <div className="mt-6 md:mt-10 mx-5 md:mx-8 flex items-center justify-start gap-2 h-20 md:h-28">
            <a href={`tel:${liveEmployee.phone}`} className="flex-1 h-16 md:h-24 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 active:scale-95 group outline-none bg-transparent">
               <Phone className="w-6 h-6 md:w-8 md:h-8 text-foreground mb-1 group-hover:scale-110 group-hover:text-primary transition-all" strokeWidth={2} />
               <span className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">Call</span>
            </a>
            <a href={liveEmployee.phone ? `https://wa.me/${liveEmployee.phone.replace(/[^0-9]/g, '')}` : '#'} className="flex-1 h-16 md:h-24 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 active:scale-95 group outline-none bg-transparent">
               <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-foreground mb-1 group-hover:scale-110 group-hover:text-[#25D366] transition-all" strokeWidth={2} />
               <span className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-wider group-hover:text-[#25D366] transition-colors">Chat</span>
            </a>
            <a href={`mailto:${liveEmployee.email}`} className="flex-1 h-16 md:h-24 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 active:scale-95 group outline-none bg-transparent">
               <Mail className="w-6 h-6 md:w-8 md:h-8 text-foreground mb-1 group-hover:scale-110 transition-all" strokeWidth={2} />
               <span className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">Email</span>
            </a>
         </div>

         {/* 5. Premium Theme Actions Block */}
         <div className="mt-5 md:mt-8 mx-5 md:mx-8 flex gap-3 h-14 md:h-16">
            <button onClick={handleSaveContact} className="flex-1 bg-primary text-primary-foreground rounded-2xl md:rounded-3xl font-black text-[15px] md:text-lg shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
               Save Contact
            </button>
            <button onClick={() => navigator.share && navigator.share({ url: window.location.href, title: `Contact ${liveEmployee.name}` })} className="aspect-square h-full rounded-2xl md:rounded-3xl bg-card shadow-sm border border-border/50 flex items-center justify-center transition-all hover:bg-muted active:scale-95 outline-none text-foreground">
               <Share2 className="w-[22px] h-[22px] md:w-7 md:h-7" strokeWidth={2} />
            </button>
         </div>

         {/* 6. Tabs Variant="Line" Architecture scales for tablets */}
         <div className="mt-8 md:mt-12 px-5 md:px-8 relative h-full w-full max-w-md md:max-w-2xl mx-auto">
             <Tabs defaultValue="overview" className="w-full">
                
                <TabsList variant="line" className="mb-4 md:mb-8">
                   <TabsTrigger value="overview" className="text-xs md:text-sm">Feeds</TabsTrigger>
                   <TabsTrigger value="analytics" className="text-xs md:text-sm">Links</TabsTrigger>
                   <TabsTrigger value="reports" className="text-xs md:text-sm">Forms</TabsTrigger>
                </TabsList>

                {/* Feeds Tab */}
                <TabsContent value="overview" className="m-0 focus-visible:outline-none focus:outline-none grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                   <div className="w-full bg-card rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-border/50 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">Company Update</div>
                      <h3 className="font-bold text-lg md:text-xl text-foreground leading-snug mb-2">Latest property launches gracefully completed in {org.name}</h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-2">We are incredibly proud to announce the next phase of luxury developments bridging the entire sector towards perfection.</p>
                   </div>
                   
                   <div className="w-full bg-card rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-border/50 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary mb-2">Event</div>
                      <h3 className="font-bold text-lg md:text-xl text-foreground leading-snug mb-2">Annual Keynote Presentation {new Date().getFullYear()}</h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-2">Join us across our headquarters to review exactly what the roadmap entitles for our clients everywhere.</p>
                   </div>
                </TabsContent>

                {/* Links Tab */}
                <TabsContent value="analytics" className="m-0 focus-visible:outline-none focus:outline-none grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                   {liveLinks.filter((l: any) => l.is_active).map((link: any, i: number) => (
                     <motion.a
                       key={link.id}
                       href={link.url}
                       target="_blank"
                       onClick={() => handleLinkClick(link)}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: i * 0.05 }}
                       className="w-full bg-card rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-sm border border-border/50 flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-md"
                     >
                       <div className="flex items-center gap-4 min-w-0">
                         <div className="w-12 h-12 md:w-14 md:h-14 rounded-[1rem] md:rounded-2xl flex items-center justify-center transition-colors shadow-none text-foreground bg-muted border border-border/50">
                           {getPlatformIcon(link.platform)}
                         </div>
                         <div className="flex flex-col min-w-0">
                             <span className="font-bold text-foreground text-[15px] md:text-[17px] truncate">{link.label || link.platform}</span>
                             <span className="text-[12px] md:text-[13px] font-medium text-muted-foreground truncate tracking-wide mt-0.5">{link.url.replace(/^https?:\/\//, '')}</span>
                         </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                     </motion.a>
                   ))}
                   {liveLinks.filter((l: any) => l.is_active).length === 0 && (
                      <div className="w-full col-span-full py-10 flex flex-col items-center justify-center text-center opacity-70 bg-card rounded-2xl shadow-sm border border-border/50">
                          <LinkIcon className="w-8 h-8 mb-3 text-muted-foreground" />
                          <p className="text-sm font-semibold text-muted-foreground">No valid links enabled.</p>
                      </div>
                   )}
                </TabsContent>

                {/* Forms Tab */}
                <TabsContent value="reports" className="m-0 focus-visible:outline-none focus:outline-none pt-2">
                   {leadSent ? (
                     <div className="py-12 flex flex-col items-center text-center bg-card rounded-2xl md:rounded-3xl shadow-sm border border-border/50">
                        <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-emerald-500 mb-3" />
                        <h3 className="text-xl md:text-2xl font-black text-foreground mb-1">Details Sent!</h3>
                        <p className="text-xs md:text-sm font-semibold text-muted-foreground">I will get in touch with you shortly.</p>
                     </div>
                   ) : (
                     <form onSubmit={handleLeadSubmit} className="flex flex-col gap-3 pb-8 bg-card p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-border/50">
                        <div className="mb-2 md:mb-6 text-center">
                            <h3 className="text-[17px] md:text-2xl font-bold tracking-tight text-foreground mb-1">{`Drop ${liveEmployee.name?.split(' ')[0]} a note`}</h3>
                            <p className="text-[13px] md:text-base font-medium text-muted-foreground">Fill out this quick form securely underneath to instantly engage.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input type="text" placeholder="Full Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-background border border-border p-4 md:p-5 rounded-xl md:rounded-2xl outline-none font-semibold text-[15px] md:text-base focus:bg-card focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground" />
                            <input type="email" placeholder="Email Address" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-background border border-border p-4 md:p-5 rounded-xl md:rounded-2xl outline-none font-semibold text-[15px] md:text-base focus:bg-card focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground" />
                            <input type="tel" placeholder="Phone Number" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-background border border-border p-4 md:p-5 rounded-xl md:rounded-2xl outline-none font-semibold text-[15px] md:text-base focus:bg-card focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground" />
                            <input type="text" placeholder="Company" value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full bg-background border border-border p-4 md:p-5 rounded-xl md:rounded-2xl outline-none font-semibold text-[15px] md:text-base focus:bg-card focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground" />
                        </div>
                        <button type="submit" disabled={sendingLead} className="w-full bg-primary text-primary-foreground font-bold py-4 md:py-5 mt-2 rounded-xl md:rounded-2xl shadow-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all text-base md:text-lg">
                           {sendingLead ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Details directly'}
                        </button>
                     </form>
                   )}
                </TabsContent>

             </Tabs>
         </div>

      </div>
    </div>
  )
}
