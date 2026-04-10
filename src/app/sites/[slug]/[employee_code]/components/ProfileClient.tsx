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
  Bookmark
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from "@/components/ThemeToggle"

export default function ProfileClient({ employee, org, links }: { employee: any, org: any, links: any[] }) {
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [leadSent, setLeadSent] = useState(false)
  const [sendingLead, setSendingLead] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Form State
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' })

  useEffect(() => {
    setMounted(true)
    logTap()
  }, [])

  const logTap = async () => {
    try {
      await supabase.from('taps').insert({
        org_id: org.id,
        employee_id: employee.id,
        device: navigator.userAgent,
        os: navigator.platform,
        // Card ID if available, for now null
      })
    } catch (err) {
      console.error('Failed to log tap:', err)
    }
  }

  const handleSaveContact = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${employee.name}
ORG:${org.name}
TITLE:${employee.designation}
TEL;TYPE=CELL:${employee.phone}
EMAIL:${employee.email}
END:VCARD`
    
    const blob = new Blob([vcard], { type: 'text/vcard' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${employee.name.replace(' ', '_')}.vcf`)
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
          employee_id: employee.id,
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
     const p = platform.toLowerCase();
     if (p.includes('linkedin')) return <Briefcase className="w-5 h-5" />
     if (p.includes('instagram')) return <Globe className="w-5 h-5" />
     if (p.includes('twitter') || p.includes('x')) return <Globe className="w-5 h-5" />
     if (p.includes('facebook')) return <Globe className="w-5 h-5" />
     if (p.includes('web')) return <Globe className="w-5 h-5" />
     return <LinkIcon className="w-5 h-5" />
  }

  if (!mounted) return null

  return (
    <div className="w-full min-h-screen bg-background flex flex-col items-center overflow-x-hidden font-sans pb-20 pt-4 text-foreground transition-colors duration-300">
      
      {/* Figma Container Max Width */}
      <div className="w-full max-w-md mx-auto relative px-5 flex flex-col pt-2 ">
         
         {/* Theme Toggle Utility */}
         <div className="absolute top-6 right-8 z-20">
            <ThemeToggle />
         </div>

         {/* 1. Header Image Cover */}
         <div className="w-full h-40 rounded-[2rem] flex items-center justify-center mt-2 relative overflow-hidden bg-muted shadow-sm border border-border/50">
             {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="absolute inset-0 w-full h-full object-cover" />
             ) : (
                <div className="text-2xl font-black text-muted-foreground/30 tracking-widest uppercase relative z-10">{org.name}</div>
             )}
         </div>

         {/* 2. Avatar intersecting bottom-left Edge matched cleanly to text */}
         <div className="relative -mt-10 ml-5 z-10 w-[104px] h-[104px] rounded-full p-1 bg-background">
            <div className="w-full h-full rounded-full border-[3px] border-background overflow-hidden bg-muted shadow-[0_8px_20px_rgb(0,0,0,0.06)] relative group">
                {employee.photo_url ? (
                   <img src={employee.photo_url} alt={employee.name} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-3xl font-black text-muted-foreground/50">{employee.name.substring(0,2).toUpperCase()}</div>
                )}
            </div>
         </div>

         {/* 3. Typography identity aligned left */}
         <div className="px-5 mt-4 text-left">
            <h1 className="text-[28px] font-black text-foreground tracking-tight leading-none mb-1">{employee.name}</h1>
            <p className="text-xs font-bold text-primary tracking-wide">{employee.designation}</p>
            <p className="text-[13px] font-medium text-muted-foreground leading-relaxed mt-4 max-w-[95%]">
               {employee.bio || "Passionate about connecting with clients and delivering solutions that create real business value."}
            </p>
         </div>

         {/* 4. Transparent Floating Action Module (Monochrome until hovered) */}
         <div className="mt-6 mx-5 flex items-center justify-start gap-2 h-20">
            <a href={`tel:${employee.phone}`} className="flex-1 h-16 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 active:scale-95 group outline-none bg-transparent">
               <Phone className="w-6 h-6 text-foreground mb-1 group-hover:scale-110 group-hover:text-primary transition-all" strokeWidth={2} />
               <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">Call</span>
            </a>
            <a href={employee.phone ? `https://wa.me/${employee.phone.replace(/[^0-9]/g, '')}` : '#'} className="flex-1 h-16 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 active:scale-95 group outline-none bg-transparent">
               <MessageCircle className="w-6 h-6 text-foreground mb-1 group-hover:scale-110 group-hover:text-[#25D366] transition-all" strokeWidth={2} />
               <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider group-hover:text-[#25D366] transition-colors">Chat</span>
            </a>
            <a href={`mailto:${employee.email}`} className="flex-1 h-16 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 active:scale-95 group outline-none bg-transparent">
               <Mail className="w-6 h-6 text-foreground mb-1 group-hover:scale-110 transition-all" strokeWidth={2} />
               <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">Email</span>
            </a>
         </div>

         {/* 5. Premium Theme Actions Block */}
         <div className="mt-5 mx-5 flex gap-3 h-14">
            <button onClick={handleSaveContact} className="flex-1 bg-primary text-primary-foreground rounded-2xl font-black text-[15px] shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
               Save Contact
            </button>
            <button onClick={() => navigator.share && navigator.share({ url: window.location.href, title: `Contact ${employee.name}` })} className="aspect-square h-full rounded-2xl bg-card shadow-sm border border-border/50 flex items-center justify-center transition-all hover:bg-muted active:scale-95 outline-none text-foreground">
               <Share2 className="w-[22px] h-[22px]" strokeWidth={2} />
            </button>
         </div>

         {/* 6. Tabs Variant="Line" Architecture matched exactly to Employee Activity Admin page */}
         <div className="mt-8 px-5 relative h-full w-full max-w-md mx-auto">
             <Tabs defaultValue="overview" className="w-full">
                
                <TabsList variant="line" className="mb-4">
                   <TabsTrigger value="overview">Feeds</TabsTrigger>
                   <TabsTrigger value="analytics">Links</TabsTrigger>
                   <TabsTrigger value="reports">Forms</TabsTrigger>
                </TabsList>

                {/* Feeds Tab (Using Overivew Value natively) */}
                <TabsContent value="overview" className="m-0 focus-visible:outline-none focus:outline-none space-y-4 pt-2">
                   <div className="w-full bg-card rounded-2xl p-5 shadow-sm border border-border/50 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">Company Update</div>
                      <h3 className="font-bold text-lg text-foreground leading-snug mb-2">Latest property launches gracefully completed in {org.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">We are incredibly proud to announce the next phase of luxury developments bridging the entire sector towards perfection.</p>
                   </div>
                   
                   <div className="w-full bg-card rounded-2xl p-5 shadow-sm border border-border/50 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Event</div>
                      <h3 className="font-bold text-lg text-foreground leading-snug mb-2">Annual Keynote Presentation {new Date().getFullYear()}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">Join us across our headquarters to review exactly what the roadmap entitles for our clients everywhere.</p>
                   </div>
                </TabsContent>

                {/* Links Tab (Using Analytics Value natively) */}
                <TabsContent value="analytics" className="m-0 focus-visible:outline-none focus:outline-none space-y-3 pt-2">
                   {links.filter(l => l.is_active).map((link, i) => (
                     <motion.a
                       key={link.id}
                       href={link.url}
                       target="_blank"
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: i * 0.05 }}
                       className="w-full bg-card rounded-2xl p-4 shadow-sm border border-border/50 flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-md"
                     >
                       <div className="flex items-center gap-4 min-w-0">
                         <div className="w-12 h-12 rounded-[1rem] flex items-center justify-center transition-colors shadow-none text-foreground bg-muted border border-border/50">
                           {getPlatformIcon(link.platform)}
                         </div>
                         <div className="flex flex-col min-w-0">
                             <span className="font-bold text-foreground text-[15px] truncate">{link.label || link.platform}</span>
                             <span className="text-[12px] font-medium text-muted-foreground truncate tracking-wide mt-0.5">{link.url.replace(/^https?:\/\//, '')}</span>
                         </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                     </motion.a>
                   ))}
                   {links.filter(l => l.is_active).length === 0 && (
                      <div className="w-full py-10 flex flex-col items-center justify-center text-center opacity-70 bg-card rounded-2xl shadow-sm border border-border/50">
                          <LinkIcon className="w-8 h-8 mb-3 text-muted-foreground" />
                          <p className="text-sm font-semibold text-muted-foreground">No valid links enabled.</p>
                      </div>
                   )}
                </TabsContent>

                {/* Forms Tab (Using Reports Value natively) */}
                <TabsContent value="reports" className="m-0 focus-visible:outline-none focus:outline-none pt-2">
                   {leadSent ? (
                     <div className="py-12 flex flex-col items-center text-center bg-card rounded-2xl shadow-sm border border-border/50">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                        <h3 className="text-xl font-black text-foreground mb-1">Details Sent!</h3>
                        <p className="text-xs font-semibold text-muted-foreground">I will get in touch with you shortly.</p>
                     </div>
                   ) : (
                     <form onSubmit={handleLeadSubmit} className="flex flex-col gap-3 pb-8 bg-card p-6 rounded-3xl shadow-sm border border-border/50">
                        <div className="mb-2">
                            <h3 className="text-[17px] font-bold tracking-tight text-foreground mb-1">{`Drop ${employee.name} a note`}</h3>
                            <p className="text-[13px] font-medium text-muted-foreground">Fill out this quick form securely underneath to instantly engage.</p>
                        </div>
                        <input type="text" placeholder="Full Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-background border border-border p-4 rounded-xl outline-none font-semibold text-[15px] focus:bg-card focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground" />
                        <input type="email" placeholder="Email Address" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-background border border-border p-4 rounded-xl outline-none font-semibold text-[15px] focus:bg-card focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground" />
                        <input type="tel" placeholder="Phone Number" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-background border border-border p-4 rounded-xl outline-none font-semibold text-[15px] focus:bg-card focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground" />
                        <input type="text" placeholder="Company" value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full bg-background border border-border p-4 rounded-xl outline-none font-semibold text-[15px] focus:bg-card focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground" />
                        <button type="submit" disabled={sendingLead} className="w-full bg-primary text-primary-foreground font-bold py-4 mt-2 rounded-xl shadow-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
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
