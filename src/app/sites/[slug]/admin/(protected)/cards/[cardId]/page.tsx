"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { 
  ArrowLeft, 
  CreditCard, 
  Cpu, 
  Calendar as CalendarIcon, 
  MapPin, 
  MousePointerClick, 
  Lock, 
  Unlock, 
  ChevronRight,
  ExternalLink,
  History,
  Info,
  User,
  Zap,
  FileDown
} from "lucide-react"
import * as XLSX from "xlsx"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns"

type CardDetails = {
  id: string
  card_code: string
  uid: string
  chip_type: string
  status: string
  is_locked: boolean
  programmed_at: string
  activated_at: string | null
  deactivated_at: string | null
  deactivation_reason: string | null
  card_url: string
  employees: {
    id: string
    name: string
    designation: string
    photo_url: string
    email: string
  } | null
}

type TapLog = {
  id: string
  tapped_at: string
  city: string | null
  device: string | null
  os: string | null
  employees: {
    name: string
    photo_url: string
  } | null
}

export default function CardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cardId = params?.cardId as string
  const slug = params?.slug as string

  const [card, setCard] = React.useState<CardDetails | null>(null)
  const [taps, setTaps] = React.useState<TapLog[]>([])
  const [loading, setLoading] = React.useState(true)
  const [locking, setLocking] = React.useState(false)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()

  const fetchCardData = React.useCallback(async () => {
    if (!cardId) return
    
    // Fetch card details with employee
    const { data: cardData, error: cardError } = await supabase
      .from('nfc_cards')
      .select(`
        *,
        employees (
          id,
          name,
          designation,
          photo_url,
          email
        )
      `)
      .eq('id', cardId)
      .single()

    if (cardError) {
      console.error('Error fetching card:', cardError)
      setLoading(false)
      return
    }

    setCard(cardData as any)

    // Fetch taps for this card
    // Note: We use the alias or table name. Based on NfcCardsDataTable, we assume a relationship exists.
    // If the card_id column is unknown, we'll try filtering by a likely column name.
    // We'll try 'card_id' first as inferred from the table's relationship.
    const { data: tapsData, error: tapsError } = await supabase
      .from('taps')
      .select('*, employees(name, photo_url)')
      .eq('card_id', cardId)
      .order('tapped_at', { ascending: false })

    if (!tapsError) {
      setTaps(tapsData || [])
    } else {
        console.warn('Taps fetch error (possibly missing card_id column):', tapsError)
        // Fallback: If no card_id, maybe taps are only linked via employee? 
        // But the user wants history for THIS card.
    }

    setLoading(false)
  }, [cardId])

  React.useEffect(() => {
    fetchCardData()

    // Real-time subscription for card updates
    const cardChannel = supabase
      .channel(`card-detail-${cardId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'tapconnect', table: 'nfc_cards', filter: `id=eq.${cardId}` },
        (payload) => {
          setCard(prev => prev ? { ...prev, ...payload.new } : null)
        }
      )
      .subscribe()

    // Real-time subscription for new taps (need to re-fetch to get employee join)
    const tapsChannel = supabase
      .channel(`card-taps-${cardId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'tapconnect', table: 'taps', filter: `card_id=eq.${cardId}` },
        () => { fetchCardData() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(cardChannel)
      supabase.removeChannel(tapsChannel)
    }
  }, [cardId, fetchCardData])

  const handleToggleLock = async () => {
    if (!card || locking) return
    setLocking(true)

    const newLockedState = !card.is_locked
    const { error } = await supabase
      .from('nfc_cards')
      .update({ is_locked: newLockedState })
      .eq('id', card.id)

    if (error) {
      console.error('Error toggling lock:', error)
    }
    setLocking(false)
  }

  const filteredTaps = taps.filter(tap => {
    if (!dateRange?.from) return true
    
    const tapDate = new Date(tap.tapped_at)
    const start = startOfDay(dateRange.from)
    const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)
    
    return isWithinInterval(tapDate, { start, end })
  })

  const handleExport = () => {
    const exportData = filteredTaps.map(tap => ({
      "Timestamp": format(new Date(tap.tapped_at), 'PPP p'),
      "Location": tap.city || 'Unknown',
      "Device": tap.device || 'N/A',
      "OS": tap.os || 'N/A',
      "User Agent": tap.device // Original UA
    }))
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Hardware History")
    XLSX.writeFile(wb, `${card?.card_code}_history_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Skeleton className="h-4 w-20" />
          <ChevronRight className="w-4 h-4" />
          <Skeleton className="h-4 w-24" />
          <ChevronRight className="w-4 h-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex justify-between items-start">
          <div className="space-y-3">
             <Skeleton className="h-10 w-64" />
             <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Skeleton className="lg:col-span-2 h-[400px] rounded-2xl" />
           <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Info className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Card Not Found</h2>
        <p className="text-muted-foreground mt-2">The NFC card you are looking for does not exist or has been removed.</p>
        <Button variant="outline" className="mt-6" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{card.card_code}</h1>
            <Badge className={cn(
              "capitalize px-2.5 py-0.5 text-[11px] font-bold tracking-wider",
              card.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
              card.status === 'deactivated' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
              'bg-amber-500/10 text-amber-500 border-amber-500/20'
            )}>
              {card.status}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Cpu className="w-4 h-4" /> 
            UID: <span className="font-mono text-foreground font-semibold">{card.uid}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant={card.is_locked ? "default" : "outline"}
            className={cn("h-11 px-6 rounded-xl font-bold transition-all", card.is_locked ? "bg-rose-600 hover:bg-rose-700 text-white" : "")}
            onClick={handleToggleLock}
            disabled={locking}
          >
            {locking ? <Zap className="w-4 h-4 mr-2 animate-spin" /> : card.is_locked ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
            {card.is_locked ? 'Unlock Profile' : 'Lock Profile'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Card & Taps */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Detailed Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-card border rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Card Specifications
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Internal ID</span>
                    <span className="text-sm font-mono text-foreground font-medium">{card.id.split('-')[0]}...</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Chip Standard</span>
                    <span className="text-sm text-foreground font-medium">{card.chip_type || 'NFC216'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Programmed Date</span>
                    <span className="text-sm text-foreground font-medium">{card.programmed_at ? format(new Date(card.programmed_at), 'PPP') : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Activated Date</span>
                    <span className="text-sm text-foreground font-medium">{card.activated_at ? format(new Date(card.activated_at), 'PPP') : 'Not Activated'}</span>
                  </div>
                  {card.status === 'deactivated' && (
                    <div className="flex flex-col py-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-rose-500 font-bold">Deactivated At</span>
                        <span className="text-sm text-rose-500 font-medium">{card.deactivated_at ? format(new Date(card.deactivated_at), 'PPP') : '—'}</span>
                      </div>
                      {card.deactivation_reason && (
                        <p className="mt-1 text-[11px] text-muted-foreground italic">Reason: {card.deactivation_reason}</p>
                      )}
                    </div>
                  )}
                </div>
             </div>

             <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => card.card_url && window.open(card.card_url, '_blank')}>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-primary" /> Public Identity
                </h3>
                <div className="flex flex-col items-center justify-center py-4 bg-muted/20 rounded-xl border border-dashed border-border group-hover:bg-muted/30 transition-colors">
                  <div className="p-3 bg-background rounded-full shadow-sm mb-3">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">PROG. DESTINATION</p>
                  <p className="text-sm font-bold text-primary truncate max-w-[200px]">{card.card_url || 'envitra.in/c/...'}</p>
                </div>
             </div>
          </div>

          {/* Tap History */}
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <History className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Hardware Engagement History</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{taps.length} TOTAL INTERACTIONS</p>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-9 w-[240px] justify-start text-left font-normal bg-background border-border/60 hover:bg-muted/50",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span className="text-[13px]">Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button variant="outline" size="sm" className="h-9 font-bold text-[11px] uppercase tracking-wider gap-2 px-3 border-border/60 hover:bg-muted/50" onClick={handleExport}>
                    <FileDown className="w-3.5 h-3.5" />
                    Export
                  </Button>
               </div>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/5">
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Timestamp</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Location</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground text-right w-[40%]">Device Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {filteredTaps.length === 0 ? (
                      <tr>
                          <td colSpan={3} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <MousePointerClick className="w-8 h-8 opacity-20" />
                            <p className="text-sm font-medium">No interactions found for this period</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTaps.map((tap) => (
                        <tr key={tap.id} className="hover:bg-muted/10 transition-colors group">
                          <td className="px-6 py-5 text-sm font-semibold text-foreground align-top">
                            {format(new Date(tap.tapped_at), 'MMM dd, p')}
                          </td>
                          <td className="px-6 py-5 text-sm text-muted-foreground align-top">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-blue-500" />
                              <span className="font-medium text-foreground">{tap.city || '—'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm align-top text-right">
                             <div className="flex flex-col items-end gap-1.5 max-w-full">
                               <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-bold text-muted-foreground uppercase">{(tap.os || 'UNKNOWN').replace(/_/g, ' ')}</span>
                                <span className="font-bold text-primary text-[11px] truncate max-w-[200px] block" title={tap.device || ''}>
                                  {tap.device?.split(' ')[0] || 'Mobile'} Client
                                </span>
                               </div>
                               <p className="text-[10px] text-muted-foreground line-clamp-1 leading-relaxed max-w-[300px] opacity-60 group-hover:opacity-100 transition-opacity" title={tap.device || ''}>
                                 {tap.device}
                               </p>
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
               </table>
            </div>
          </div>
        </div>

        {/* Right Column: Holder & Actions */}
        <div className="space-y-6">
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
             <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Assigned Holder
             </h3>
             
             {card.employees ? (
               <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    {card.employees.photo_url ? (
                      <img src={card.employees.photo_url} alt={card.employees.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-border ring-offset-2" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                        {card.employees.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <h4 className="font-bold text-lg text-foreground truncate">{card.employees.name}</h4>
                      <p className="text-sm text-muted-foreground truncate">{card.employees.designation}</p>
                    </div>
                 </div>

                 <div className="space-y-4 pt-2 border-t border-border/50">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email Address</span>
                      <span className="text-sm font-semibold truncate">{card.employees.email}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between h-10 font-bold group"
                      onClick={() => router.push(`/sites/${slug}/admin/employees/${card.employees?.id}`)}
                    >
                      View Full Profile
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                 </div>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-border rounded-xl">
                  <div className="p-3 bg-muted rounded-full mb-3">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">Unassigned Hardware</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1 uppercase tracking-wider">This card is currently blank</p>
                  <Button variant="outline" size="sm" className="mt-4 font-bold h-9">Assign Now</Button>
               </div>
             )}
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
             <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" /> Quick Insights
             </h3>
             <p className="text-xs text-muted-foreground leading-relaxed">
               {card.status === 'active' 
                 ? "This card is operational and transmitting profile data. Ensure the NFC chip remains clean and avoids magnetic interference."
                 : "This hardware is currently offline. Taps will not resolve to a profile until the card is reactivated by an administrator."}
             </p>
             <div className="mt-4 flex flex-col gap-2">
                <div className="bg-background/50 p-3 rounded-lg flex justify-between items-center text-[11px] font-bold">
                  <span className="text-muted-foreground">LAST ACTIVITY</span>
                  <span className="text-foreground">{taps[0] ? format(new Date(taps[0].tapped_at), 'MMM dd') : 'None'}</span>
                </div>
                <div className="bg-background/50 p-3 rounded-lg flex justify-between items-center text-[11px] font-bold">
                  <span className="text-muted-foreground">ENGAGEMENT SCORE</span>
                  <span className="text-emerald-500">{taps.length > 5 ? 'High' : 'Normal'}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
