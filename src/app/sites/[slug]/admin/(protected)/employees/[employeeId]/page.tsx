"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { Edit, ArrowLeft, Search, MoreVertical, Briefcase, Mail, Phone, Calendar, MapPin, MousePointerClick, UserPlus, Fingerprint, ExternalLink, Globe, Link as LinkIcon, Contact, FileText } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { addDays, format } from "date-fns"
import { type DateRange } from "react-day-picker"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"

let cachedEmployeeList: EmployeeListData[] | null = null;
let cachedSlug: string | null = null;
let cachedOrgDate: string | null = null;

type EmployeeListData = {
    id: string
    name: string
    designation: string
    photo_url: string
    employee_code: string
}

type EmployeeDetailsData = EmployeeListData & {
    email: string
    phone: string | null
    created_at: string
    nfc_cards: { card_code: string; card_url: string; status: string }[] | null
    departments: { name: string } | null
}

export default function EmployeeDetailPage() {
    const params = useParams()
    const router = useRouter()
    const employeeId = params?.employeeId as string
    const slug = params?.slug as string

    const [employeeList, setEmployeeList] = React.useState<EmployeeListData[]>([])
    const [searchQuery, setSearchQuery] = React.useState("")

    const [employee, setEmployee] = React.useState<EmployeeDetailsData | null>(null)
    const [tapCount, setTapCount] = React.useState<number>(0)
    const [leadCount, setLeadCount] = React.useState<number>(0)

    const [loadingList, setLoadingList] = React.useState(true)
    const [loadingDetail, setLoadingDetail] = React.useState(true)
    const [links, setLinks] = React.useState<any[]>([])
    const [orgId, setOrgId] = React.useState<string | null>(null)

    // NEW STATES
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(),
        to: new Date()
    })
    const [activityFeed, setActivityFeed] = React.useState<any[]>([])
    const [loadingAnalytics, setLoadingAnalytics] = React.useState(false)

    // Fetch Left Sidebar List
    React.useEffect(() => {
        async function loadDirectory() {
            if (cachedSlug === slug && cachedEmployeeList) {
                setEmployeeList(cachedEmployeeList)
                setLoadingList(false)
                return
            }

            const { data: orgData } = await supabase.from('organizations').select('id, created_at').eq('slug', slug).single()
            if (orgData) {
                cachedOrgDate = orgData.created_at
                setOrgId(orgData.id)
                const { data: allEmps } = await supabase
                    .from('employees')
                    .select('id, name, designation, photo_url, employee_code')
                    .eq('org_id', orgData.id)
                    .order('employee_code', { ascending: true })

                cachedEmployeeList = allEmps || []
                cachedSlug = slug
                setEmployeeList(cachedEmployeeList)
            }
            setLoadingList(false)
        }
        loadDirectory()
    }, [slug])

    // Fetch Right Detail View
    React.useEffect(() => {
        async function loadDetailData() {
            if (!employeeId) return;
            setLoadingDetail(true)

            const { data: empData } = await supabase
                .from('employees')
                .select(`
          id, name, designation, photo_url, employee_code, email, phone, created_at,
          departments(name),
          nfc_cards(card_code, card_url, status)
        `)
                .eq('id', employeeId)
                .single()

            if (empData) {
                setEmployee(empData as any)
                // Fetch org_id from the employee's org for links query
                const { data: orgData } = await supabase
                    .from('organizations')
                    .select('id')
                    .eq('slug', slug)
                    .single()

                if (orgData) {
                    setOrgId(orgData.id)
                    // Fetch ALL active org links
                    const { data: linksData } = await supabase
                        .from('card_links')
                        .select('*')
                        .eq('org_id', orgData.id)
                        .eq('is_active', true)
                        .order('display_order', { ascending: true })
                    setLinks(linksData || [])
                }
            }

            setLoadingDetail(false)
        }

        loadDetailData()
    }, [employeeId, slug])

    // Realtime: employee profile updates (card assignment, name, etc.)
    React.useEffect(() => {
        if (!orgId) return

        const empChannel = supabase
            .channel(`employees:${orgId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'tapconnect', table: 'employees', filter: `org_id=eq.${orgId}` },
                (payload) => {
                    const updated = payload.new as any
                    // Update sidebar list
                    setEmployeeList(prev => {
                        const next = prev.map(e => e.id === updated.id ? { ...e, ...updated } : e)
                        cachedEmployeeList = next
                        return next
                    })
                    // Update detail view if it's the currently viewed employee
                    if (updated.id === employeeId) {
                        setEmployee(prev => prev ? { ...prev, ...updated } : prev)
                    }
                }
            )
            .subscribe()

        const linksChannel = supabase
            .channel(`card_links_emp:${orgId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'tapconnect', table: 'card_links', filter: `org_id=eq.${orgId}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newLink = payload.new as any
                        if (newLink.is_active) {
                            setLinks(prev => [...prev, newLink].sort((a, b) => a.display_order - b.display_order))
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updated = payload.new as any
                        setLinks(prev =>
                            updated.is_active
                                ? prev.map(l => l.id === updated.id ? updated : l).sort((a, b) => a.display_order - b.display_order)
                                : prev.filter(l => l.id !== updated.id) // remove if deactivated
                        )
                    } else if (payload.eventType === 'DELETE') {
                        setLinks(prev => prev.filter(l => l.id !== payload.old?.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(empChannel)
            supabase.removeChannel(linksChannel)
        }
    }, [orgId, employeeId])

    // Toggle employee link assignment
    // null or not-in-list = OFF. Turn ON adds employee. Turn OFF removes employee.
    const handleToggleLink = async (link: any) => {
        const currentAssigned: string[] = link.assigned_to || [] // treat null as empty array
        const isAssigned = currentAssigned.includes(employeeId)

        let newAssigned: string[]
        if (isAssigned) {
            // Turn OFF — remove employee
            newAssigned = currentAssigned.filter((id: string) => id !== employeeId)
        } else {
            // Turn ON — add employee
            newAssigned = [...currentAssigned, employeeId]
        }

        // Optimistic update
        setLinks(prev => prev.map(l =>
            l.id === link.id ? { ...l, assigned_to: newAssigned } : l
        ))

        const { error } = await supabase
            .from('card_links')
            .update({ assigned_to: newAssigned.length > 0 ? newAssigned : null })
            .eq('id', link.id)

        if (error) {
            console.error('Failed to update link assignment:', error)
            // Rollback
            setLinks(prev => prev.map(l => l.id === link.id ? link : l))
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

        // Lucide fallbacks
        const fallbackCls = "w-[18px] h-[18px] text-muted-foreground opacity-70"
        if (p === 'website') return <Globe className={fallbackCls} />
        if (p === 'vcard') return <Contact className={fallbackCls} />
        if (p === 'form') return <FileText className={fallbackCls} />
        return <LinkIcon className={fallbackCls} />
    }

    // Fetch Analytics & Feed
    React.useEffect(() => {
        async function loadAnalytics() {
            if (!employeeId || !date?.from) return
            setLoadingAnalytics(true)

            const startDate = new Date(date.from)
            startDate.setHours(0, 0, 0, 0)

            const endDate = new Date(date.to || date.from)
            endDate.setHours(23, 59, 59, 999)

            const startISO = startDate.toISOString()
            const endISO = endDate.toISOString()

            // Taps
            const { data: tapsData } = await supabase
                .from('taps')
                .select('*')
                .eq('employee_id', employeeId)
                .gte('tapped_at', startISO)
                .lte('tapped_at', endISO)
                .order('tapped_at', { ascending: false })

            setTapCount(tapsData?.length || 0)

            // Leads
            const { data: leadsData } = await supabase
                .from('leads')
                .select('*')
                .eq('employee_id', employeeId)
                .gte('captured_at', startISO)
                .lte('captured_at', endISO)
                .order('captured_at', { ascending: false })

            setLeadCount(leadsData?.length || 0)

            const feed: any[] = []
            if (tapsData) {
                tapsData.forEach(t => feed.push({ type: 'tap', timestamp: new Date(t.tapped_at).getTime(), data: t }))
            }
            if (leadsData) {
                leadsData.forEach(l => feed.push({ type: 'lead', timestamp: new Date(l.captured_at).getTime(), data: l }))
            }
            feed.sort((a, b) => b.timestamp - a.timestamp)
            setActivityFeed(feed)
            setLoadingAnalytics(false)
        }
        loadAnalytics()
    }, [employeeId, date])

    const filteredEmployees = React.useMemo(() => {
        if (!searchQuery) return employeeList
        return employeeList.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.employee_code?.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [searchQuery, employeeList])

    const renderDetail = () => {
        if (loadingDetail) {
            return (
                <div className="space-y-6 pt-6 px-2 animate-in fade-in">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-20 h-20 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 pt-4">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                </div>
            )
        }

        if (!employee) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <Fingerprint className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h2 className="text-xl font-bold">Record Not Found</h2>
                    <p className="text-muted-foreground">This employee profile may have been deleted.</p>
                </div>
            )
        }

        const card = employee.nfc_cards?.[0]
        const cardStatus = card?.status || 'Blank'
        const joinedDate = new Date(employee.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
        const expString = joinedDate

        return (
            <div className="animate-in fade-in duration-500 overflow-y-auto pr-2 pb-10">
                {/* Header Identity block */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b pb-8">
                    <div className="p-1">
                        {employee.photo_url ? (
                            <img src={employee.photo_url} alt={employee.name} className="w-24 h-24 rounded-full object-cover shadow-sm ring-1 ring-border ring-offset-2 ring-offset-background" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl ring-1 ring-border ring-offset-2 ring-offset-background">
                                {employee.name.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-center sm:items-start mt-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{employee.name}</h1>
                            {cardStatus === 'active' && <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 shadow-none border-blue-200">Active Card</Badge>}
                        </div>
                        <p className="text-base text-muted-foreground mt-1 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            {employee.designation || 'No Designation'}
                            <span className="text-border mx-1">•</span>
                            {employee.departments?.name || 'No Department'}
                        </p>
                    </div>
                </div>

                {/* Overview Meta grid */}
                <div className="mt-8">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-foreground tracking-tight">Overview</h3>
                            <p className="text-sm text-muted-foreground">Joined: {expString}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-muted-foreground hidden sm:block">Date:</span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        id="date-picker-range"
                                        size="sm"
                                        className={cn(
                                            "justify-start text-left font-normal h-8",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to && date.to.getTime() !== date.from.getTime() ? (
                                                <>
                                                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(date.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <CalendarComponent
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={1}
                                        disabled={(d) => {
                                            const maxDate = new Date();
                                            const minDate = cachedOrgDate ? new Date(cachedOrgDate) : new Date(0);
                                            return d > maxDate || d < minDate;
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="border rounded-xl p-4 flex flex-col justify-between bg-card hover:bg-accent/10 transition-colors">
                            <span className="text-xs font-medium text-muted-foreground">Total Taps</span>
                            <span className="text-2xl font-bold mt-2 text-blue-600">{tapCount}</span>
                        </div>
                        <div className="border rounded-xl p-4 flex flex-col justify-between bg-card hover:bg-accent/10 transition-colors">
                            <span className="text-xs font-medium text-muted-foreground">Leads Captured</span>
                            <span className="text-2xl font-bold mt-2 text-emerald-600">{leadCount}</span>
                        </div>
                        <div className="border rounded-xl p-4 flex flex-col justify-between bg-card hover:bg-accent/10 transition-colors">
                            <span className="text-xs font-medium text-muted-foreground">Card Status</span>
                            <span className="text-lg font-bold mt-2 capitalize">{cardStatus}</span>
                        </div>
                        <div className="border rounded-xl p-4 flex flex-col justify-between bg-card hover:bg-accent/10 transition-colors cursor-pointer group" onClick={() => card?.card_url && window.open(`${card.card_url}`, '_blank')}>
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">Card URL <ExternalLink className="w-3 h-3 group-hover:text-primary transition-colors" /></span>
                            <span className="text-lg font-bold mt-2 text-primary truncate">{card?.card_url || '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Work Details Section */}
                <div className="mt-8 border rounded-2xl overflow-hidden bg-card">
                    <div className="flex items-center justify-between p-5 border-b bg-muted/20">
                        <div className="flex items-center gap-3">
                            <h3 className="text-base font-bold tracking-tight">Work Details</h3>
                            {cardStatus === 'active' && <Badge className="bg-emerald-500 hover:bg-emerald-600 shadow-none">Active</Badge>}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground hidden sm:block">EMP {employee.employee_code || '—'}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6 md:p-8">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-medium mb-1">Company Department</span>
                            <span className="text-sm font-medium text-foreground">{employee.departments?.name || 'Management'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date Joined</span>
                            <span className="text-sm font-medium text-foreground">{expString}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone Number</span>
                            <span className="text-sm font-medium text-foreground">{employee.phone || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Base Location</span>
                            <span className="text-sm font-medium text-foreground">HQ</span>
                        </div>
                        <div className="flex flex-col md:col-span-2 border-t pt-5 mt-2">
                            <span className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email Address</span>
                            <span className="text-sm font-medium text-foreground">{employee.email || '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Employee Activity Feed */}
                <div className="mt-8 pt-4 border-t">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-foreground tracking-tight">Employee Activity</h3>
                    </div>

                    <Tabs defaultValue="links" className="w-full">
                        <TabsList variant="line" className="mb-4">
                            <TabsTrigger value="links">Links</TabsTrigger>
                            <TabsTrigger value="taps">Taps</TabsTrigger>
                            <TabsTrigger value="leads">Leads</TabsTrigger>
                        </TabsList>

                        <TabsContent value="links" className="m-0 focus-visible:outline-none">
                            <div className="border rounded-2xl bg-card overflow-hidden divide-y">
                                {links.length === 0 ? (
                                    <div className="p-8 flex flex-col items-center justify-center text-center">
                                        <LinkIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                        <h4 className="font-semibold text-foreground">No Active Links</h4>
                                        <p className="text-sm text-muted-foreground mt-1">No links have been configured for this organisation yet.</p>
                                    </div>
                                ) : (
                                    links.map((link) => {
                                        // OFF when assigned_to is null OR employee not in list
                                        const assigned: string[] = link.assigned_to || []
                                        const isAssigned = assigned.includes(employeeId)

                                        return (
                                            <div key={link.id} className="p-4 flex items-center justify-between transition-colors hover:bg-muted/30">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                        {getPlatformIcon(link.platform)}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-semibold text-sm text-foreground truncate capitalize">{link.label || link.platform}</span>
                                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors truncate mt-0.5">{link.url}</a>
                                                    </div>
                                                </div>
                                                <div className="pl-4 flex items-center gap-2 shrink-0">
                                                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${isAssigned ? 'text-emerald-500' : 'text-muted-foreground/40'}`}>
                                                        {isAssigned ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                    <Switch
                                                        checked={isAssigned}
                                                        onCheckedChange={() => handleToggleLink(link)}
                                                        className="data-[state=checked]:bg-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="taps" className="m-0 focus-visible:outline-none">
                            <div className="border rounded-2xl bg-card overflow-hidden">
                                {loadingAnalytics ? (
                                    <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Loading taps...</div>
                                ) : activityFeed.filter(f => f.type === 'tap').length === 0 ? (
                                    <div className="p-8 flex flex-col items-center justify-center text-center">
                                        <MousePointerClick className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                        <h4 className="font-semibold text-foreground">No Taps</h4>
                                        <p className="text-sm text-muted-foreground mt-1">No NFC scans recorded on {date?.from ? (date.to && date.from.getTime() !== date.to.getTime() ? `${format(date.from, "LLL dd, y")} to ${format(date.to, "LLL dd, y")}` : format(date.from, "LLL dd, y")) : 'the selected dates'}.</p>
                                    </div>
                                ) : (
                                    activityFeed.filter(f => f.type === 'tap').map((item, idx, arr) => {
                                        const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        const cityStr = item.data.city || 'Unknown Location'
                                        const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(cityStr)}&t=&z=13&ie=UTF8&iwloc=&output=embed`

                                        return (
                                            <div key={item.data.id} className={cn("p-5 flex gap-4 transition-colors hover:bg-muted/30", idx !== arr.length - 1 && "border-b")}>
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-1">
                                                    <MousePointerClick className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold flex justify-between items-center whitespace-nowrap">
                                                        <span>NFC Card Tapped</span>
                                                        <span className="text-xs font-normal text-muted-foreground ml-2">{timeStr}</span>
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground mt-0.5">Scanned on {item.data.device || 'a device'} running {item.data.os || 'unknown OS'}.</p>

                                                    {item.data.city && (
                                                        <div className="mt-4 h-[180px] w-full rounded-xl overflow-hidden ring-1 ring-border/50 shadow-sm relative z-0">
                                                            <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-sm text-xs px-2.5 py-1.5 rounded-md shadow-sm z-10 flex items-center font-bold text-foreground ring-1 ring-border/50">
                                                                <MapPin className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> {cityStr}
                                                            </div>
                                                            <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={mapUrl} allowFullScreen />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="leads" className="m-0 focus-visible:outline-none">
                            <div className="border rounded-2xl bg-card overflow-hidden">
                                {loadingAnalytics ? (
                                    <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Loading leads...</div>
                                ) : activityFeed.filter(f => f.type === 'lead').length === 0 ? (
                                    <div className="p-8 flex flex-col items-center justify-center text-center">
                                        <UserPlus className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                        <h4 className="font-semibold text-foreground">No Leads</h4>
                                        <p className="text-sm text-muted-foreground mt-1">No leads captured on {date?.from ? (date.to && date.from.getTime() !== date.to.getTime() ? `${format(date.from, "LLL dd, y")} to ${format(date.to, "LLL dd, y")}` : format(date.from, "LLL dd, y")) : 'the selected dates'}.</p>
                                    </div>
                                ) : (
                                    activityFeed.filter(f => f.type === 'lead').map((item, idx, arr) => {
                                        const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                                        return (
                                            <div key={item.data.id} className={cn("p-5 flex gap-4 transition-colors hover:bg-muted/30", idx !== arr.length - 1 && "border-b")}>
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-1">
                                                    <UserPlus className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold flex justify-between items-center whitespace-nowrap">
                                                        <span>New Lead Captured</span>
                                                        <span className="text-xs font-normal text-muted-foreground ml-2">{timeStr}</span>
                                                    </h4>
                                                    <div className="text-sm text-muted-foreground mt-1.5 space-y-1">
                                                        <p><strong className="text-foreground">{item.data.visitor_name || 'Anonymous'}</strong> submitted contact information.</p>
                                                        {item.data.visitor_email && <p className="text-xs flex items-center"><Mail className="w-3 h-3 mr-1.5" /> {item.data.visitor_email}</p>}
                                                        {item.data.visitor_company && <p className="text-xs flex items-center"><Briefcase className="w-3 h-3 mr-1.5" /> {item.data.visitor_company}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-8rem)] pb-4">

            {/* LEFT SIDEBAR - EMPLOYEE DIRECTORY */}
            <div className="w-full lg:w-[350px] shrink-0 lg:border-r border-border flex flex-col h-[300px] lg:h-full pr-0 lg:pr-6">

                <div className="pb-4 border-b border-border/50 mb-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search profiles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-background border rounded-lg text-sm outline-none focus:ring-1 focus:ring-ring transition-shadow shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1">
                    {loadingList ? (
                        <div className="space-y-2 py-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex gap-3 items-center">
                                    <Skeleton className="w-10 h-10 rounded-full" />
                                    <div className="space-y-2 flex-1"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        filteredEmployees.length > 0 ? (
                            filteredEmployees.map(emp => {
                                const isActive = emp.id === employeeId
                                return (
                                    <div
                                        key={emp.id}
                                        onClick={() => router.push(`/sites/${slug}/admin/employees/${emp.id}`)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                                            isActive ? "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 border shadow-sm" : "hover:bg-muted border border-transparent"
                                        )}
                                    >
                                        {emp.photo_url ? (
                                            <img src={emp.photo_url} className={cn("w-10 h-10 rounded-full object-cover shrink-0 ring-1", isActive ? "ring-blue-300" : "ring-border")} />
                                        ) : (
                                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ring-1", isActive ? "bg-blue-100 text-blue-700 ring-blue-300 dark:bg-blue-900 dark:text-blue-300" : "bg-primary/5 text-muted-foreground ring-border")}>
                                                {emp.name.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex flex-col min-w-0">
                                            <span className={cn("font-bold text-sm truncate", isActive ? "text-foreground" : "text-muted-foreground")}>{emp.name}</span>
                                            <span className="text-xs text-muted-foreground truncate">{emp.designation || 'Staff'}</span>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-center p-4 text-sm text-muted-foreground">No employees match your search.</div>
                        )
                    )}
                </div>
            </div>

            {/* RIGHT SIDE - DETAIL VIEW CONTAINER */}
            <div className="flex-1 flex flex-col overflow-hidden pl-0 lg:pl-6 pt-4 lg:pt-0">
                <div className="flex-1 overflow-y-auto">
                    {renderDetail()}
                </div>
            </div>

        </div>
    )
}
