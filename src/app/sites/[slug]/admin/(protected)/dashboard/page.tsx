"use client"
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  Users, CreditCard, BarChart3, Magnet, Loader2,
  TrendingUp, Award, Search, Download, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { exportToCsv } from '@/lib/utils'

function getMonthStart() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function getInitials(name: string) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-[#2563EB]', 'bg-[#60A5FA]', 'bg-[#1D4ED8]', 'bg-[#93C5FD]', 'bg-[#3B82F6]'
]

export default function DashboardHome() {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)

  const [stats, setStats] = useState({ employees: 0, activeCards: 0, tapsThisMonth: 0, leadsCaptured: 0 })
  const [topPerformers, setTopPerformers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [recentTaps, setRecentTaps] = useState<any[]>([])
  const [dailyTaps, setDailyTaps] = useState<number[]>([])

  // ── Table state ───────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<'name' | 'designation' | 'taps'>('taps')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const ITEMS_PER_PAGE = 6

  // ── Fetch all data ────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (id?: string) => {
    const resolvedId = id ?? orgId
    if (!resolvedId) return
    setLoading(true)
    try {
      const monthStart = getMonthStart()

      const [
        { count: empCount },
        { count: cardCount },
        { count: tapCount },
        { count: leadCount },
        { data: employees },
        { data: tapsData },
        { data: recentTapsData },
        { data: allMonthTaps },
      ] = await Promise.all([
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('org_id', resolvedId).eq('is_active', true),
        supabase.from('nfc_cards').select('id', { count: 'exact', head: true }).eq('org_id', resolvedId).eq('status', 'active'),
        supabase.from('taps').select('id', { count: 'exact', head: true }).eq('org_id', resolvedId).gte('tapped_at', monthStart),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('org_id', resolvedId),
        supabase.from('employees').select('id, name, designation, dept_id, photo_url, departments(name)').eq('org_id', resolvedId).eq('is_active', true),
        supabase.from('taps').select('employee_id').eq('org_id', resolvedId).gte('tapped_at', monthStart),
        supabase.from('taps').select('id, tapped_at, city, os, employees(name, photo_url)').eq('org_id', resolvedId).order('tapped_at', { ascending: false }).limit(5),
        supabase.from('taps').select('tapped_at').eq('org_id', resolvedId).gte('tapped_at', monthStart),
      ])

      setStats({
        employees: empCount ?? 0,
        activeCards: cardCount ?? 0,
        tapsThisMonth: tapCount ?? 0,
        leadsCaptured: leadCount ?? 0,
      })

      // Taps-per-employee map
      const tapsMap: Record<string, number> = {}
      tapsData?.forEach(t => { if (t.employee_id) tapsMap[t.employee_id] = (tapsMap[t.employee_id] || 0) + 1 })

      // Enrich employees
      const enriched = (employees ?? []).map((emp: any) => ({
        ...emp,
        dept_name: emp.departments?.name ?? 'Unassigned',
        taps: tapsMap[emp.id] || 0,
      }))
      setTopPerformers([...enriched].sort((a, b) => b.taps - a.taps))

      // Department breakdown
      const deptMap: Record<string, { name: string; taps: number }> = {}
      enriched.forEach((emp: any) => {
        const key = emp.dept_name
        if (!deptMap[key]) deptMap[key] = { name: key, taps: 0 }
        deptMap[key].taps += emp.taps
      })
      setDepartments(Object.values(deptMap).sort((a, b) => b.taps - a.taps).slice(0, 5))

      setRecentTaps(recentTapsData ?? [])

      // Daily taps sparkline — last 10 days of this month
      const today = new Date()
      const dayBuckets: Record<number, number> = {}
      ;(allMonthTaps ?? []).forEach((t: any) => {
        const d = new Date(t.tapped_at).getDate()
        dayBuckets[d] = (dayBuckets[d] || 0) + 1
      })
      const last10 = Array.from({ length: 10 }, (_, i) => {
        const day = today.getDate() - 9 + i
        return day > 0 ? (dayBuckets[day] || 0) : 0
      })
      setDailyTaps(last10)
    } finally {
      setLoading(false)
    }
  }, [orgId])

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
      if (!org) return
      setOrgId(org.id)
      fetchAll(org.id)
    }
    init()
  }, [slug])

  // ── Real-time subscriptions ───────────────────────────────────────────────
  useEffect(() => {
    if (!orgId) return
    const channels = [
      supabase.channel(`dash-taps:${orgId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'tapconnect', table: 'taps', filter: `org_id=eq.${orgId}` }, () => fetchAll())
        .subscribe(),
      supabase.channel(`dash-leads:${orgId}`)
        .on('postgres_changes', { event: '*', schema: 'tapconnect', table: 'leads', filter: `org_id=eq.${orgId}` }, () => fetchAll())
        .subscribe(),
      supabase.channel(`dash-cards:${orgId}`)
        .on('postgres_changes', { event: '*', schema: 'tapconnect', table: 'nfc_cards', filter: `org_id=eq.${orgId}` }, () => fetchAll())
        .subscribe(),
      supabase.channel(`dash-emps:${orgId}`)
        .on('postgres_changes', { event: '*', schema: 'tapconnect', table: 'employees', filter: `org_id=eq.${orgId}` }, () => fetchAll())
        .subscribe(),
    ]
    return () => { channels.forEach(c => supabase.removeChannel(c)) }
  }, [orgId, fetchAll])

  // ── Table logic ───────────────────────────────────────────────────────────
  const handleSort = (key: 'name' | 'designation' | 'taps') => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
    setCurrentPage(1)
  }

  const filtered = topPerformers.filter(emp =>
    emp.name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(search.toLowerCase()) ||
    emp.dept_name?.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE)
  const paginated = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const SortIcon = ({ col }: { col: string }) =>
    sortKey === col
      ? <span className="ml-1 text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>
      : <span className="ml-1 text-muted-foreground/30">↕</span>

  // ── OS icon helper ────────────────────────────────────────────────────────
  const OsIcon = ({ os }: { os: string }) => {
    const raw = (os ?? '').toLowerCase()
    const cls = "w-3.5 h-3.5 shrink-0"
    if (raw.includes('ios') || raw.includes('iphone') || raw.includes('ipad')) return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    )
    if (raw.includes('mac')) return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    )
    if (raw.includes('android')) return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0 0 12 1.5a5.84 5.84 0 0 0-2.63.63L7.88.65c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.29 1.31A5.97 5.97 0 0 0 6 7h12a5.97 5.97 0 0 0-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" />
      </svg>
    )
    if (raw.includes('win')) return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
      </svg>
    )
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" />
      </svg>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Interactive Stat Widgets ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Active Employees — real initials, navigate to employees */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          onClick={() => router.push(`/sites/${slug}/admin/employees`)}
          className="bg-card border border-border/50 rounded-xl p-5 shadow-sm overflow-hidden group hover:shadow-md hover:border-blue-500/40 transition-all relative cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none group-hover:from-blue-500/10 transition-all" />
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            {loading
              ? <div className="w-10 h-6 bg-muted/50 animate-pulse rounded" />
              : <span className="text-2xl font-extrabold tracking-tight">{stats.employees}</span>}
          </div>
          <div className="flex -space-x-3 mb-4">
            {loading
              ? Array(4).fill(0).map((_, i) => <div key={i} className="w-10 h-10 rounded-full bg-muted/50 animate-pulse border-2 border-card" />)
              : topPerformers.slice(0, 5).map((emp, i) => (
                <div key={emp.id} title={emp.name}
                  className={`w-10 h-10 rounded-full border-2 border-card flex items-center justify-center text-[11px] text-white font-bold shrink-0 overflow-hidden ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                  {emp.photo_url
                    ? <img src={emp.photo_url} alt={emp.name} className="w-full h-full object-cover" />
                    : getInitials(emp.name)}
                </div>
              ))
            }
            {!loading && stats.employees > 5 && (
              <div className="w-10 h-10 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                +{stats.employees - 5}
              </div>
            )}
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-blue-500/70 transition-colors">Active Employees</p>
        </motion.div>

        {/* Card 2: NFC Cards — NFC arc design, navigate to cards */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          onClick={() => router.push(`/sites/${slug}/admin/cards`)}
          className="bg-card border border-border/50 rounded-xl p-5 shadow-sm overflow-hidden group hover:shadow-md hover:border-indigo-500/40 transition-all relative cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none group-hover:from-indigo-500/10 transition-all" />
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
              <CreditCard className="w-4 h-4 text-indigo-500" />
            </div>
            {loading
              ? <div className="w-10 h-6 bg-muted/50 animate-pulse rounded" />
              : <span className="text-2xl font-extrabold tracking-tight">{stats.activeCards}</span>}
          </div>
          {/* NFC signal arcs */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-10 h-10 shrink-0">
              {[1, 0.65, 0.35].map((s, i) => (
                <div key={i} className="absolute border-2 border-indigo-500 rounded-full"
                  style={{ width: `${s * 100}%`, height: `${s * 100}%`, top: `${(1 - s) * 50}%`, left: `${(1 - s) * 50}%`, opacity: 0.3 + (1 - s) * 0.5 }}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {loading
                ? Array(3).fill(0).map((_, i) => <div key={i} className="h-1.5 bg-muted/40 rounded animate-pulse" />)
                : Array(Math.min(stats.activeCards, 3)).fill(0).map((_, i) => (
                  <motion.div key={i}
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                    className="h-1.5 rounded-full bg-indigo-500/40 border border-indigo-500/20"
                    style={{ width: `${100 - i * 22}%` }}
                  />
                ))}
              {!loading && stats.activeCards === 0 && (
                <div className="h-1.5 w-full rounded-full bg-muted/40 border border-dashed border-border/40" />
              )}
            </div>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-indigo-500/70 transition-colors">Active NFC Cards</p>
        </motion.div>

        {/* Card 3: Taps — interactive hoverable real daily sparkline, navigate to cards */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          onClick={() => router.push(`/sites/${slug}/admin/cards`)}
          className="bg-card border border-border/50 rounded-xl p-5 shadow-sm overflow-hidden group hover:shadow-md hover:border-primary/40 transition-all relative cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none group-hover:from-primary/10 transition-all" />
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
            </div>
            {loading
              ? <div className="w-10 h-6 bg-muted/50 animate-pulse rounded" />
              : <span className="text-2xl font-extrabold tracking-tight">{stats.tapsThisMonth.toLocaleString()}</span>}
          </div>
          {/* Simple decorative bar chart — no hover interaction */}
          <div className="flex items-end gap-1 h-10 mb-3">
            {loading
              ? Array(10).fill(0).map((_, i) => (
                <div key={i} className="flex-1 bg-muted/40 rounded-sm animate-pulse" style={{ height: `${30 + (i * 7) % 60}%` }} />
              ))
              : (() => {
                const bars = dailyTaps.length ? dailyTaps : [2, 5, 3, 8, 4, 6, 3, 7, 5, 9]
                const maxVal = Math.max(...bars, 1)
                return bars.map((val, i) => {
                  const pct = Math.max(10, Math.round((val / maxVal) * 100))
                  const isLatest = i === bars.length - 1
                  return (
                    <motion.div key={i}
                      initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                      transition={{ delay: 0.3 + i * 0.04, type: 'spring', stiffness: 200 }}
                      style={{ height: `${pct}%`, originY: 1 }}
                      className={`flex-1 rounded-sm ${isLatest ? 'bg-primary' : i % 3 === 0 ? 'bg-primary/50' : 'bg-primary/25'}`}
                    />
                  )
                })
              })()
            }
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary/70 transition-colors">Taps This Month</p>
        </motion.div>

        {/* Card 4: Leads — funnel design, navigate to leads */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}
          onClick={() => router.push(`/sites/${slug}/admin/leads`)}
          className="bg-card border border-border/50 rounded-xl p-5 shadow-sm overflow-hidden group hover:shadow-md hover:border-emerald-500/40 transition-all relative cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none group-hover:from-emerald-500/10 transition-all" />
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <Magnet className="w-4 h-4 text-emerald-500" />
            </div>
            {loading
              ? <div className="w-10 h-6 bg-muted/50 animate-pulse rounded" />
              : <span className="text-2xl font-extrabold tracking-tight">{stats.leadsCaptured}</span>}
          </div>
          <div className="space-y-1.5 mb-3">
            {[100, 70, 45, 25].map((w, i) => (
              <motion.div key={i}
                initial={{ width: 0 }} animate={{ width: `${w}%` }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
                className={`h-1.5 rounded-full ${
                  i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-emerald-400/70' : i === 2 ? 'bg-emerald-300/50' : 'bg-emerald-200/40'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-emerald-500/70 transition-colors">Leads Captured</p>
        </motion.div>

      </div>

      {/* ── Main Grid: Table + Sidebar ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Employee Performance Table */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Employee Performance</span>
              <Badge variant="secondary" className="text-[10px] uppercase font-bold">This Month</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Search..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-44 transition-all"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                />
              </div>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs"
                onClick={() => exportToCsv('performers.csv', sorted.map(d => ({ Name: d.name, Department: d.dept_name, Designation: d.designation, Taps: d.taps })))}>
                <Download className="w-3 h-3 mr-1" /> CSV
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border/50 m-4 rounded-xl bg-muted/10">
              <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/10">
                    <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('name')}>
                      Employee <SortIcon col="name" />
                    </th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('designation')}>
                      Role / Dept <SortIcon col="designation" />
                    </th>
                    <th className="px-4 py-3 pr-6 text-right text-[10px] uppercase tracking-widest font-bold text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('taps')}>
                      Taps <SortIcon col="taps" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((emp, i) => {
                    const rank = (currentPage - 1) * ITEMS_PER_PAGE + i
                    return (
                      <motion.tr key={emp.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                              {emp.photo_url
                                ? <img src={emp.photo_url} alt={emp.name} className="w-full h-full object-cover" />
                                : getInitials(emp.name)}
                            </div>
                            <div>
                              <p className="font-semibold text-sm leading-tight">{emp.name}</p>
                              {rank < 3 && <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">#{rank + 1} Performer</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-muted-foreground">{emp.designation || '—'}</p>
                          <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-wide">{emp.dept_name}</p>
                        </td>
                        <td className="px-4 py-3 pr-6 text-right">
                          <span className="font-bold text-sm">{emp.taps}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">taps</span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="px-6 py-3 border-t border-border/30 bg-muted/10 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sorted.length)} of {sorted.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="p-1 rounded-md hover:bg-muted disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentPage(idx + 1)}
                    className={`w-6 h-6 text-xs rounded-md font-bold transition-colors ${currentPage === idx + 1 ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}>
                    {idx + 1}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="p-1 rounded-md hover:bg-muted disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">

          {/* Department Yield */}
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Department Yield</span>
              <span className="text-[10px] text-muted-foreground ml-auto">This month</span>
            </div>
            <div className="p-5 space-y-4">
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />)}</div>
              ) : departments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No tap activity yet.</p>
              ) : (
                departments.map((dept, i) => {
                  const max = departments[0]?.taps || 1
                  const pct = Math.max(4, Math.round((dept.taps / max) * 100))
                  const colors = ['bg-[#2563EB]', 'bg-[#60A5FA]', 'bg-[#93C5FD]', 'bg-[#BFDBFE]', 'bg-[#DBEAFE]']
                  return (
                    <div key={dept.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold truncate">{dept.name}</span>
                        <span className="font-bold text-muted-foreground text-xs shrink-0 ml-2">{dept.taps} taps</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className={`h-full rounded-full ${colors[i % colors.length]}`}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>

          {/* Live Tap Feed */}
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Live Tap Feed</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse ml-1" />
            </div>
            <div className="flex-1">
              {loading ? (
                <div className="p-4 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />)}</div>
              ) : recentTaps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <BarChart3 className="w-6 h-6 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">No taps yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {recentTaps.map((tap: any, i) => (
                    <div key={tap.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                        {tap.employees?.photo_url
                          ? <img src={tap.employees.photo_url} alt="" className="w-full h-full object-cover" />
                          : getInitials(tap.employees?.name ?? '?')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{tap.employees?.name ?? 'Unknown'}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground/60">
                          <OsIcon os={tap.os ?? ''} />
                          <p className="text-[10px] text-muted-foreground">{tap.city ?? 'Unknown'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(tap.tapped_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
