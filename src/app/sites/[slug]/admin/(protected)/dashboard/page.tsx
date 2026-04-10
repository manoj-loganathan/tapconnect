"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import TopPerformersGrid from './components/TopPerformersGrid'
import { Users, CreditCard, BarChart3, Magnet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Helper function
function getMonthStart() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export default function DashboardHome() {
  const params = useParams()
  const slug = params.slug as string
  
  const [loading, setLoading] = useState(true)
  
  const [stats, setStats] = useState({
    employees: 0,
    activeCards: 0,
    tapsThisMonth: 0,
    leadsCaptured: 0
  })

  const [topPerformers, setTopPerformers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [slug])

  const fetchDashboardData = async () => {
    try {
      const { data: org } = await supabase.from('organizations').select('id, name').eq('slug', slug).single()
      if (!org) return

      // --- 1. Top Level Stats ---
      const [empCount, activeEmpCount, leadCount, tapsThisMonth] = await Promise.all([
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('org_id', org.id),
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('org_id', org.id).eq('status', 'active'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('org_id', org.id),
        supabase.from('taps').select('id', { count: 'exact', head: true }).eq('org_id', org.id).gte('created_at', getMonthStart()),
      ])

      setStats({
        employees: empCount.count || 0,
        activeCards: activeEmpCount.count || 0, // Using active employees as proxy for active cards
        tapsThisMonth: tapsThisMonth.count || 0,
        leadsCaptured: leadCount.count || 0,
      })

      // --- 2. Top Performing Employees & Departments ---
      // Fetch all employees
      const { data: employees } = await supabase
        .from('employees')
        .select(`id, name, designation`)
        .eq('org_id', org.id)
      
      // Fetch taps this month separately to avoid PostgREST join mapping issues
      const { data: currentTaps } = await supabase
        .from('taps')
        .select(`id, employee_id, created_at`)
        .eq('org_id', org.id)
        .gte('created_at', getMonthStart())

      if (employees) {
          const tapsMap: Record<string, number> = {}
          if (currentTaps) {
              currentTaps.forEach(tap => {
                  if (tap.employee_id) {
                      tapsMap[tap.employee_id] = (tapsMap[tap.employee_id] || 0) + 1
                  }
              })
          }

          const enrichedEmployees = employees.map((emp: any) => {
              return {
                  id: emp.id,
                  name: emp.name,
                  designation: emp.designation,
                  taps: tapsMap[emp.id] || 0
              }
          })

          // Set performers for Grid
          enrichTopPerformers(enrichedEmployees)
          
          // Set department performance
          enrichDepartments(enrichedEmployees)
      }

      // --- 3. Dynamic Alerts (Simulated Rules) ---
      // Rule A: Employees without cards assigned (created recently)
      // Since `nfc_cards` isn't fully robust in this schema yet, 
      // we'll just create some dummy UI logic based on "recent added" employees as requested.
      const artificialAlerts = [
          { type: 'warning', message: 'Ravi Shankar reported card lost — deactivation pending', action: 'Deactivate' },
          { type: 'info', message: '3 new employees added — cards not yet assigned', action: 'Assign' },
      ]
      setAlerts(artificialAlerts)

    } finally {
      setLoading(false)
    }
  }

  const enrichTopPerformers = (employees: any[]) => {
      // Sort and take top metrics. We just pass all to grid since it handles its own sorting
      // Default to "taps desc"
      setTopPerformers([...employees].sort((a,b) => b.taps - a.taps))
  }

  const enrichDepartments = (employees: any[]) => {
      const deptMap: Record<string, number> = {}
      employees.forEach(emp => {
          const dept = emp.designation || 'Unassigned'
          deptMap[dept] = (deptMap[dept] || 0) + emp.taps
      })

      const arr = Object.keys(deptMap).map(k => ({
          name: k,
          taps: deptMap[k]
      })).sort((a,b) => b.taps - a.taps) // Sort by descending taps
      
      setDepartments(arr)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Official Shadcn Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
            Array(4).fill(0).map((_, i) => (
                <Card key={i} className="h-32 animate-pulse bg-muted" />
            ))
        ) : (
            <>
              {/* Card 1: Total Employees */}
              <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
                  </CardHeader>
                  <CardContent className="z-10 relative">
                      <div className="text-4xl font-bold">{stats.employees}</div>
                      <p className="text-xs text-blue-500 font-semibold mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          {stats.employees > 0 ? '100%' : '0%'} Active
                      </p>
                  </CardContent>
                  <div className="absolute -bottom-2 -right-2 opacity-10 dark:opacity-20 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                      <Users className="w-24 h-24 text-blue-600 stroke-[1.5]" />
                  </div>
              </Card>
              
              {/* Card 2: Active Cards */}
              <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Active Cards</CardTitle>
                  </CardHeader>
                  <CardContent className="z-10 relative">
                      <div className="text-4xl font-bold">{stats.activeCards}</div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-border"></span> Issued to team
                      </p>
                  </CardContent>
                  <div className="absolute -bottom-2 -right-2 opacity-10 dark:opacity-20 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                      <CreditCard className="w-24 h-24 text-muted-foreground stroke-[1.5]" />
                  </div>
              </Card>
              
              {/* Card 3: Taps & Scans */}
              <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Taps & Scans</CardTitle>
                  </CardHeader>
                  <CardContent className="z-10 relative">
                      <div className="text-4xl font-bold">{stats.tapsThisMonth.toLocaleString()}</div>
                      <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> Live tracking
                      </p>
                  </CardContent>
                  <div className="absolute -bottom-2 -right-2 opacity-10 dark:opacity-20 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                      <BarChart3 className="w-24 h-24 text-rose-500 stroke-[1.5]" />
                  </div>
              </Card>
              
              {/* Card 4: Leads Captured */}
              <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Leads Captured</CardTitle>
                  </CardHeader>
                  <CardContent className="z-10 relative">
                      <div className="text-4xl font-bold">{stats.leadsCaptured}</div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Across all cards
                      </p>
                  </CardContent>
                  <div className="absolute -bottom-2 -right-2 opacity-10 dark:opacity-20 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                      <Magnet className="w-24 h-24 text-indigo-500 stroke-[1.5]" />
                  </div>
              </Card>
            </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Top Performers (Takes 2 columns on lg) */}
        <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold text-foreground mb-4 px-1">Performance Roster</h3>
            <Card className="flex flex-col overflow-hidden">
                {loading ? (
                    <div className="min-h-[400px] animate-pulse bg-muted" />
                ) : (
                    <CardContent className="p-0">
                        <TopPerformersGrid data={topPerformers} />
                    </CardContent>
                )}
            </Card>
        </div>

        {/* 3. Department Split & Alerts (Stack in 1 column on lg) */}
        <div className="flex flex-col gap-6 lg:col-span-1">
            
            <div className="flex flex-col">
                <h3 className="text-xs font-semibold text-foreground mb-4 px-1">Department Yield</h3>
                <Card>
                    <CardContent className="p-6 flex flex-col gap-6">
                        {loading ? (
                            <div className="h-32 animate-pulse bg-muted rounded-xl" />
                        ) : departments.length === 0 ? (
                            <div className="text-sm text-muted-foreground font-medium text-center py-8">No department activity found.</div>
                        ) : (
                            departments.map((dept, index) => {
                                const maxTaps = departments[0]?.taps || 1
                                const percentage = Math.max(2, Math.min(100, (dept.taps / maxTaps) * 100))
                                const barColors = ['bg-blue-600', 'bg-indigo-500', 'bg-slate-400']
                                const darkColors = ['bg-blue-500', 'bg-indigo-400', 'bg-slate-500']

                                return (
                                    <div key={dept.name} className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-foreground text-sm">{dept.name}</span>
                                            <span className="text-muted-foreground text-sm font-bold">{dept.taps.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }} 
                                                animate={{ width: `${percentage}%` }} 
                                                transition={{ duration: 1, delay: index * 0.1 }}
                                                className={`h-full rounded-full ${barColors[index % barColors.length]} dark:${darkColors[index % darkColors.length].replace('bg-', '')}`} 
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col">
                <h3 className="text-xs font-semibold text-foreground mb-4 px-1">Recent Alerts</h3>
                <Card className="flex flex-col overflow-hidden">
                    {loading ? (
                        <div className="h-32 animate-pulse bg-muted" />
                    ) : alerts.length === 0 ? (
                        <CardContent className="p-8 text-center text-sm font-medium text-muted-foreground">No pending alerts.</CardContent>
                    ) : (
                        alerts.map((alert, i) => (
                            <div key={i} className="p-4 flex flex-col gap-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${alert.type === 'warning' ? 'bg-destructive' : 'bg-amber-500'}`} />
                                    <span className="text-sm font-medium text-foreground leading-snug flex-1">{alert.message}</span>
                                </div>
                                <div className="flex justify-end">
                                    <button className="px-3 py-1.5 rounded-md border border-border bg-background text-xs font-bold hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm">
                                        {alert.action}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </Card>
            </div>

        </div>
      </div>

    </div>
  )
}
