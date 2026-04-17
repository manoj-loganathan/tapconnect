"use client"

import * as React from "react"
import { format, startOfDay, endOfDay } from "date-fns"
import {
  Calendar as CalendarIcon, TrendingUp, TrendingDown,
  Users, Activity, MousePointerClick, Loader2, Sparkles, Link2, Trophy, Globe, Contact, MapPin, Briefcase, Filter
} from "lucide-react"

// helper
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
      default: return <Link2 className={fallbackCls} />
  }
}
import { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent, type ChartConfig
} from "@/components/ui/chart"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

const chartConfig = {
  iOS: { label: "iOS", color: "var(--chart-1)" },
  Android: { label: "Android", color: "var(--chart-2)" },
  Windows: { label: "Windows", color: "var(--chart-3)" },
  Mac: { label: "Mac", color: "var(--chart-4)" },
  Other: { label: "Other", color: "var(--chart-5)" },
} satisfies ChartConfig

// ─── DateSelector ─────────────────────────────────────────────────────────────
// Defined OUTSIDE AnalyticsDashboard to prevent re-creation on every render
interface DateSelectorProps {
  date: DateRange | undefined
  setDate: (d: DateRange | undefined) => void
  minDate: Date | null
}
function DateSelector({ date, setDate, minDate }: DateSelectorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[260px] justify-start text-left font-normal bg-card border-border hover:bg-muted/50 hover:text-foreground transition-all shadow-sm",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to && date.to.getTime() !== date.from.getTime() ? (
              <>{format(date.from, "LLL dd, y")} – {format(date.to, "LLL dd, y")}</>
            ) : (
              format(date.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-border" align="end">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={setDate}
          numberOfMonths={2}
          disabled={(d) => {
            const maxDate = endOfDay(new Date())
            return d > maxDate
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
interface MetricCardProps {
  title: string
  value: React.ReactNode
  subtitle: string
  trend: "up" | "down"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>
  delay: number
  loading?: boolean
}
function MetricCard({ title, value, subtitle, trend, icon: Icon, delay, loading }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group bg-card border border-border/50 shadow-sm rounded-xl p-6 hover:shadow-md hover:border-primary/30 transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-16 h-16 text-primary" />
      </div>
      <div className="flex flex-col relative z-10">
        <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2">{title}</span>
        <div className="flex items-end gap-3 mt-1">
          <span className="text-4xl font-extrabold tracking-tight">
            {loading ? <Loader2 className="w-8 h-8 animate-spin mt-1" /> : value}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-3">
          {trend === "up"
            ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            : <TrendingDown className="w-3.5 h-3.5 text-amber-500" />}
          <span className={cn("text-xs font-semibold", trend === "up" ? "text-emerald-500" : "text-amber-500")}>
            {subtitle}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function AnalyticsDashboard({ slug }: { slug: string }) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })

  const [loading, setLoading] = React.useState(true)
  const [orgId, setOrgId] = React.useState<string | null>(null)
  const [cachedOrgDate, setCachedOrgDate] = React.useState<Date | null>(null)
  const [taps, setTaps] = React.useState<any[]>([])
  const [leads, setLeads] = React.useState<any[]>([])
  const [linkClicks, setLinkClicks] = React.useState<any[]>([])
  const [employeesMap, setEmployeesMap] = React.useState<Record<string, { name: string; avatar_url?: string | null; dept_id?: string | null }>>({})
  const [deptsMap, setDeptsMap] = React.useState<Record<string, string>>({})

  // ── fetch org + employees once ────────────────────────────────────────────
  const fetchBaseData = React.useCallback(async () => {
    const { data: org } = await supabase
      .from("organizations").select("id, created_at").eq("slug", slug).single()
    if (!org) return

    setOrgId(org.id)
    setCachedOrgDate(new Date(org.created_at))

    const [{ data: emps }, { data: depts }] = await Promise.all([
      supabase.from("employees").select("id, name, photo_url, dept_id").eq("org_id", org.id),
      supabase.from("departments").select("id, name").eq("org_id", org.id)
    ])
      
    if (emps) {
      const map: Record<string, { name: string; avatar_url?: string | null; dept_id?: string | null }> = {}
      emps.forEach(e => { map[e.id] = { name: e.name, avatar_url: e.photo_url, dept_id: e.dept_id } })
      setEmployeesMap(map)
    }

    if (depts) {
      const map: Record<string, string> = {}
      depts.forEach(d => { map[d.id] = d.name })
      setDeptsMap(map)
    }
  }, [slug])

  // ── fetch range data ──────────────────────────────────────────────────────
  const fetchRangeData = React.useCallback(async () => {
    if (!orgId || !date?.from) return
    setLoading(true)

    const startISO = startOfDay(date.from).toISOString()
    const endISO = endOfDay(date.to ?? date.from).toISOString()

    try {
      const [_taps, _leads, _clicks] = await Promise.all([
        supabase.from("taps").select("*").eq("org_id", orgId).gte("tapped_at", startISO).lte("tapped_at", endISO),
        supabase.from("leads").select("*").eq("org_id", orgId).gte("captured_at", startISO).lte("captured_at", endISO),
        supabase.from("card_link_clicks").select("*").eq("org_id", orgId).gte("clicked_at", startISO).lte("clicked_at", endISO),
      ])

      setTaps(_taps.data ?? [])
      setLeads(_leads.data ?? [])
      setLinkClicks(_clicks.data ?? [])
    } catch (err) {
      console.error("Dashboard fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [orgId, date])

  // ── effects ───────────────────────────────────────────────────────────────
  React.useEffect(() => { fetchBaseData() }, [fetchBaseData])

  React.useEffect(() => {
    if (orgId) fetchRangeData()
  }, [orgId, date, fetchRangeData])

  // ── realtime ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!orgId) return
    const r1 = supabase.channel(`taps-an:${orgId}`)
      .on("postgres_changes", { event: "INSERT", schema: "tapconnect", table: "taps" }, fetchRangeData)
      .subscribe()
    const r2 = supabase.channel(`leads-an:${orgId}`)
      .on("postgres_changes", { event: "*", schema: "tapconnect", table: "leads", filter: `org_id=eq.${orgId}` }, fetchRangeData)
      .subscribe()
    const r3 = supabase.channel(`clicks-an:${orgId}`)
      .on("postgres_changes", { event: "INSERT", schema: "tapconnect", table: "card_link_clicks", filter: `org_id=eq.${orgId}` }, fetchRangeData)
      .subscribe()
    return () => {
      supabase.removeChannel(r1)
      supabase.removeChannel(r2)
      supabase.removeChannel(r3)
    }
  }, [orgId, fetchRangeData])

  // ── derived metrics ───────────────────────────────────────────────────────
  const daysDiff = date?.to && date?.from
    ? Math.max(1, Math.ceil((date.to.getTime() - date.from.getTime()) / 86_400_000))
    : 1

  const avgTapsDay = Math.round(taps.length / daysDiff)
  const conversionRate = taps.length > 0 ? Math.round((leads.length / taps.length) * 100) : 0
  const engagementRate = taps.length > 0 ? Math.round((linkClicks.length / taps.length) * 100) : 0

  // top employee
  const empCounts: Record<string, number> = {}
  taps.forEach(t => { empCounts[t.employee_id] = (empCounts[t.employee_id] ?? 0) + 1 })
  const sortedEmps = Object.entries(empCounts).sort((a, b) => b[1] - a[1])
  const topEmpData = sortedEmps[0]
    ? { name: employeesMap[sortedEmps[0][0]]?.name ?? "Unknown", count: sortedEmps[0][1] }
    : null

  // bar chart data: per-employee OS breakdown
  const empGraphMap: Record<string, any> = {}
  Object.keys(employeesMap).forEach(id => {
    empGraphMap[id] = {
      name: employeesMap[id].name.split(" ")[0],
      iOS: 0, Android: 0, Windows: 0, Mac: 0, Other: 0, _total: 0,
    }
  })
  taps.forEach(t => {
    const entry = empGraphMap[t.employee_id]
    if (!entry) return
    const raw = (t.os ?? "").toLowerCase()
    let os: string
    if (raw.includes("ios") || raw.includes("iphone") || raw.includes("ipad")) os = "iOS"
    else if (raw.includes("android")) os = "Android"
    else if (raw.includes("win")) os = "Windows"
    else if (raw.includes("mac")) os = "Mac"
    else os = "Other"
    entry[os] += 1
    entry._total += 1
  })
  const barData = Object.values(empGraphMap)
    .filter(d => d._total > 0)
    .sort((a, b) => b._total - a._total)

  // Leads Pipeline distribution (REAL DATA)
  const leadStatuses: Record<string, number> = {}
  leads.forEach(l => {
    const status = l.status ? l.status.replace("_", " ").toLowerCase() : "unknown"
    leadStatuses[status] = (leadStatuses[status] || 0) + 1
  })
  const leadDistribution = Object.entries(leadStatuses)
    .sort((a,b) => b[1] - a[1])

  // Department Performance (REAL DATA)
  const deptTaps: Record<string, number> = {}
  taps.forEach(t => {
    const emp = employeesMap[t.employee_id]
    const deptName = (emp && emp.dept_id && deptsMap[emp.dept_id]) ? deptsMap[emp.dept_id] : "Unassigned"
    deptTaps[deptName] = (deptTaps[deptName] || 0) + 1
  })
  const deptDistribution = Object.entries(deptTaps)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5) // top 5 departments
    .slice(0, 10)

  // desktop / mobile totals
  const DESKTOP_OS = ["windows", "mac"]
  const totalDesktop = taps.filter(t => DESKTOP_OS.some(o => (t.os ?? "").toLowerCase().includes(o))).length
  const totalMobile = taps.length - totalDesktop

  // top links
  const linkCounts: Record<string, number> = {}
  linkClicks.forEach(c => {
    const p = c.platform ?? "General"
    linkCounts[p] = (linkCounts[p] ?? 0) + 1
  })
  const sortedLinks = Object.entries(linkCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // geo distribution (REAL DATA)
  const cityCounts: Record<string, number> = {}
  taps.forEach(t => {
    if (t.city) {
      cityCounts[t.city] = (cityCounts[t.city] || 0) + 1
    }
  })
  const cityDistribution = Object.entries(cityCounts)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5)

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-10">

      {/* Date Picker */}
      <div className="flex justify-end">
        <DateSelector date={date} setDate={setDate} minDate={cachedOrgDate} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="AVG TAPS/DAY" value={avgTapsDay} subtitle="+12% week-over-week" trend="up" icon={Activity} delay={0.1} loading={loading} />
        <MetricCard title="CONVERSION RATE" value={`${conversionRate}%`} subtitle="+8% this month" trend="up" icon={Sparkles} delay={0.2} loading={loading} />
        <MetricCard title="TOP EMPLOYEE" value={topEmpData?.name.split(" ")[0] ?? "-"} subtitle={topEmpData ? `${topEmpData.count} taps` : "No activity"} trend="up" icon={Users} delay={0.3} loading={loading} />
        <MetricCard title="ENGAGEMENT" value={`${engagementRate}%`} subtitle="+5% vs last week" trend="up" icon={MousePointerClick} delay={0.4} loading={loading} />
      </div>

      {/* Bar Chart + Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border/50 rounded-xl p-6 shadow-sm"
        >
          {/* Chart header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight">Taps by Employee &amp; OS</h3>
              <p className="text-sm text-muted-foreground mt-1">Total taps in selected period, grouped by operating system</p>
            </div>
            <div className="flex items-center shrink-0">
              <div className="px-4 text-right">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase">Total Taps</p>
                <p className="text-2xl font-extrabold tracking-tight mt-0.5">{taps.length.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Chart body */}
          {barData.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Activity className="w-10 h-10 opacity-20" />
              <p className="text-sm font-medium">No tap data for the selected period</p>
              <p className="text-xs opacity-50">Try expanding the date range</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={barData} margin={{ top: 5, right: 8, bottom: 5, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.15)" />
                <XAxis
                  dataKey="name"
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 12, fill: "var(--foreground)", fontWeight: 600 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--foreground)", fontWeight: 500 }}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted-foreground)/0.08)", radius: 4 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-card border border-border/50 shadow-md rounded-xl p-4 text-sm min-w-[150px]">
                          <p className="font-bold mb-3 pb-3 border-b border-border/50 text-foreground">{label}</p>
                          <div className="space-y-2.5">
                            {payload.map((entry: any, idx: number) => (
                               <div key={idx} className="flex justify-between items-center gap-6 text-muted-foreground">
                                 <span className="flex items-center gap-2 font-medium">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                    {entry.name}
                                 </span>
                                 <span className="font-bold text-foreground">{entry.value}</span>
                               </div>
                            ))}
                            <div className="flex justify-between items-center gap-6 mt-3 pt-3 border-t border-border/50 text-foreground">
                               <span className="font-black text-xs uppercase tracking-wider text-muted-foreground">Total Taps</span>
                               <span className="font-black text-[15px]">{data._total}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="iOS" fill="var(--color-iOS)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Android" fill="var(--color-Android)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Windows" fill="var(--color-Windows)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Mac" fill="var(--color-Mac)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Other" fill="var(--color-Other)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ChartContainer>
          )}
        </motion.div>

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col"
        >
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" /> Top Performers
          </h3>
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {sortedEmps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tap data in window.</p>
            ) : (
              sortedEmps.slice(0, 5).map(([id, count], i) => {
                const emp = employeesMap[id]
                const initials = emp?.name
                  ? emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                  : "?"
                // Cycle through blue shades for avatar backgrounds
                const avatarColors = [
                  "bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"
                ]
                const avatarBg = avatarColors[i % avatarColors.length]

                // Rank color treatment
                let rankColor = "text-muted-foreground font-semibold"
                if (i === 0) rankColor = "text-yellow-500 font-bold"
                else if (i === 1) rankColor = "text-slate-400 font-bold"
                else if (i === 2) rankColor = "text-amber-600 font-bold"

                return (
                  <div key={id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-all group">
                    <div className="flex items-center gap-4">
                      {/* Rank Number */}
                      <span className={`w-4 text-center text-sm ${rankColor}`}>
                        {i + 1}
                      </span>
                      {/* Avatar */}
                      <div className={`relative w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden ${emp?.avatar_url ? '' : avatarBg}`}>
                        {emp?.avatar_url ? (
                          <img src={emp.avatar_url} alt={emp.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold">{emp?.name ?? "Unknown"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{count}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Taps</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Row 3 (NEW): Departments + Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance - Horizontal Ranking Bars */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col justify-between"
        >
          <h3 className="text-base font-bold mb-6 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" /> Department Performance
          </h3>
          <div className="flex-1 flex flex-col justify-center space-y-5">
            {(() => {
              const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
              const totalDeptTaps = deptDistribution.length > 0 ? deptDistribution.reduce((acc, curr) => acc + curr[1], 0) : 0;
              const hasData = deptDistribution.length > 0;

              if (!hasData) {
                return <div className="text-sm font-medium text-muted-foreground bg-muted/20 p-8 rounded-xl border border-dashed border-border/50 text-center flex flex-col items-center justify-center gap-2"><Briefcase className="w-6 h-6 opacity-30" /> No department data</div>;
              }

              return deptDistribution.map(([dept, count], idx) => {
                const percent = Math.round((count / totalDeptTaps) * 100);
                return (
                  <div key={idx} className="space-y-2 group">
                    <div className="flex justify-between items-end text-sm">
                       <span className="font-semibold text-foreground capitalize tracking-tight">{dept}</span>
                       <div className="flex items-center gap-3">
                         <span className="font-bold">{count} <span className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase ml-0.5">TAPS</span></span>
                         <span className="w-9 font-medium text-[11px] text-muted-foreground bg-muted/50 text-center py-0.5 rounded transition-colors group-hover:bg-muted">{percent}%</span>
                       </div>
                    </div>
                    <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden shadow-inner">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${percent}%` }}
                         transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                         className="h-full rounded-full transition-all"
                         style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                       />
                    </div>
                  </div>
                )
              });
            })()}
          </div>
        </motion.div>

        {/* Leads Analytics - Pipeline Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-base font-bold flex items-center gap-2">
               <Filter className="w-4 h-4 text-primary" /> Leads Pipeline
             </h3>
             <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-md tracking-wider uppercase">Funnel</span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            {leadDistribution.length === 0 ? (
                <div className="text-sm font-medium text-muted-foreground bg-muted/20 p-8 rounded-xl border border-dashed border-border/50 text-center flex flex-col items-center justify-center gap-2"><Filter className="w-6 h-6 opacity-30" /> No leads captured</div>
            ) : (
              (() => {
                const totalLeads = leads.length;
                
                // standardizing pipeline array
                const pipeline = [
                  { id: 'new', label: 'New', color: 'bg-blue-500', count: leadStatuses['new'] || 0 },
                  { id: 'followed up', label: 'Followed Up', color: 'bg-amber-500', count: leadStatuses['followed up'] || 0 },
                  { id: 'converted', label: 'Converted', color: 'bg-emerald-500', count: leadStatuses['converted'] || 0 },
                  { id: 'lost', label: 'Lost', color: 'bg-rose-500', count: leadStatuses['lost'] || 0 }
                ];

                return (
                  <div className="grid grid-cols-2 gap-4">
                    {pipeline.map((step, idx) => {
                       const percent = totalLeads > 0 ? Math.round((step.count / totalLeads) * 100) : 0;
                       return (
                         <div key={idx} className="p-4 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/30 transition-colors relative overflow-hidden group">
                            {/* Accent line top */}
                            <div className={`absolute top-0 left-0 right-0 h-1 ${step.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                            
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">{step.label}</span>
                            
                            <div className="flex items-end justify-between mt-3">
                              <span className="text-3xl font-black tracking-tighter leading-none">{step.count}</span>
                              <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-0.5">Share</span>
                                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded bg-background shadow-sm border border-border/50`}>{percent}%</span>
                              </div>
                            </div>
                         </div>
                       )
                    })}
                  </div>
                )
              })()
            )}
          </div>
        </motion.div>
      </div>

      {/* Row 4 (Reordered): Top Links + Geo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-card border border-border/50 rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-base font-bold mb-5 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" /> Top Links
          </h3>
          <div className="space-y-3">
            {sortedLinks.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm font-medium border border-dashed border-border/50 rounded-xl">No link clicks tracked.</div>
            ) : (
              sortedLinks.map(([plat, count], idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-background border border-border/50 flex items-center justify-center text-muted-foreground shadow-sm">
                         {getPlatformIcon(plat)}
                      </div>
                      <span className="font-semibold capitalize text-foreground">{plat}</span>
                   </div>
                   <div className="flex items-end flex-col justify-center">
                      <span className="font-bold text-[15px]">{count}</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Clicks</span>
                   </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col"
        >
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Geographic Distribution
          </h3>
          <div className="flex-1 flex flex-col items-center gap-4">
            {(() => {
              const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
              const totalGeoTaps = cityDistribution.length > 0 ? cityDistribution.reduce((acc, curr) => acc + curr[1], 0) : 0;
              const hasData = cityDistribution.length > 0;
              const pieData = hasData
                ? cityDistribution.map(([name, value]) => ({ name, value }))
                : [{ name: "No Data", value: 1 }];

              return (
                <>
                  {/* Large full-width centered donut */}
                  <div className="relative w-full flex-1" style={{ minHeight: '220px' }}>
                    <ChartContainer config={chartConfig} className="w-full h-full absolute inset-0">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%" cy="50%"
                          innerRadius={75}
                          outerRadius={110}
                          stroke="none"
                          paddingAngle={hasData ? 3 : 0}
                          dataKey="value"
                          cornerRadius={5}
                        >
                          {pieData.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={hasData ? COLORS[index % COLORS.length] : 'hsl(var(--muted)/0.3)'}
                            />
                          ))}
                        </Pie>
                        {hasData && (
                          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        )}
                      </PieChart>
                    </ChartContainer>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      {hasData ? (
                        <>
                          <span className="text-4xl font-black tracking-tighter text-foreground leading-none">{totalGeoTaps}</span>
                          <span className="text-[10px] mt-1.5 uppercase font-bold text-muted-foreground tracking-[0.2em]">Total Taps</span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <MapPin className="w-8 h-8 text-muted-foreground/20" />
                          <span className="text-xs text-muted-foreground/50 font-medium">No location data</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Compact horizontal legend below chart */}
                  {hasData && (
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-3 border-t border-border/40 w-full">
                      {cityDistribution.map(([city, count], idx) => {
                        const percent = Math.round((count / totalGeoTaps) * 100);
                        return (
                          <div key={idx} className="flex items-center gap-1.5 group">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="text-xs font-semibold text-foreground">{city}</span>
                            <span className="text-[11px] font-bold text-muted-foreground">{count}</span>
                            <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/60 px-1.5 py-0.5 rounded group-hover:bg-muted transition-colors">{percent}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
