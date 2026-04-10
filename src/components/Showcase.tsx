"use client"
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Activity, ArrowUpRight, Bell, Users, MousePointer, BarChart3, Download, ChevronRight, Zap } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

// Animated count-up number  
function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [triggered, setTriggered] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !triggered) {
        setTriggered(true)
        let start = 0
        const step = target / 60
        const timer = setInterval(() => {
          start += step
          if (start >= target) { setValue(target); clearInterval(timer) }
          else setValue(Math.floor(start))
        }, 16)
      }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, triggered])
  return <div ref={ref}>{value.toLocaleString()}{suffix}</div>
}

const bars = [40, 55, 35, 75, 60, 88, 110, 72, 95, 115, 80, 130]
const weekDays = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const recentActivity = [
  { name: 'Anika Sharma', time: '2s ago', icon: MousePointer, tag: 'Tapped Card' },
  { name: 'James Liu',    time: '4m ago', icon: Users,        tag: 'Connected' },
  { name: 'Sara Osei',   time: '11m ago', icon: Download,     tag: 'Exported to CRM' },
]

export default function Showcase() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)

  return (
    <section id="showcase" className="py-24 relative overflow-hidden bg-background">
      <div className="container mx-auto px-6 max-w-[1200px]">

        {/* Section header */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 bg-[#0071e3]/5 border border-[#0071e3]/10 rounded-full px-4 py-2 mb-8">
              <Zap className="w-4 h-4 text-[#0071e3]" />
              <span className="text-xs font-bold text-[#0071e3] uppercase tracking-widest">Live Dashboard</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground tracking-tight leading-[1.1]">
              Designed for <br />
              <span className="gradient-text">Performance</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
              Experience a dashboard that brings all your networking analytics into one clean, seamless interface. Real-time updates push directly to your connections.
            </p>

            <ul className="space-y-5 mb-12">
              {[
                { icon: BarChart3, text: 'Track tap engagement in real-time' },
                { icon: Users,     text: 'Manage multiple profiles from one account' },
                { icon: Download,  text: 'Export connections directly to your CRM' },
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0071e3]/5 border border-[#0071e3]/10 flex items-center justify-center text-[#0071e3] group-hover:bg-[#0071e3] group-hover:text-white transition-all duration-300 flex-shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-foreground">{item.text}</span>
                </motion.li>
              ))}
            </ul>

            <button className="apple-btn px-6 py-3.5 text-base font-semibold flex items-center gap-2 hover:gap-3 transition-all w-max">
              View Analytics Demo <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Dashboard Mockup / Right Column */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-1 lg:order-2 relative"
          >
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-[#0071e3]/5 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative bg-card rounded-[2rem] shadow-2xl border border-border/50 overflow-hidden">
              {/* Dashboard header bar */}
              <div className="bg-muted/30 px-6 py-4 flex items-center justify-between border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#0071e3]" /> Analytics Overview
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[11px] font-bold text-green-600">Live</span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Taps', value: 2405, suffix: '', color: '#0071e3', icon: MousePointer },
                    { label: 'Connections', value: 891, suffix: '', color: '#7c3aed', icon: Users },
                    { label: 'CRM Exports', value: 143, suffix: '', color: '#059669', icon: Download },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.04, y: -2 }}
                      className="bg-muted/30 rounded-2xl p-4 border border-border/50 cursor-default"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                        <ArrowUpRight className="w-4 h-4" style={{ color: stat.color }} />
                      </div>
                      <div className="text-2xl font-black text-foreground tracking-tight">
                        <CountUp target={stat.value} />
                      </div>
                      <div className="mt-2 h-1 w-full bg-border rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: stat.color }} initial={{ width: 0 }} whileInView={{ width: `${55 + i * 15}%` }} transition={{ duration: 1, delay: 0.4 + i * 0.1 }} />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Bar Chart */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-bold text-foreground">Monthly Taps</div>
                    <div className="text-xs text-primary font-medium bg-primary/10 px-3 py-1 rounded-full border border-primary/20">2024</div>
                  </div>
                  <div className="h-28 flex items-end gap-1.5 group">
                    {bars.map((height, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
                        <div className="text-[9px] font-bold text-[#0071e3] transition-all duration-200 mb-1" style={{ opacity: hoveredBar === i ? 1 : 0 }}>
                          {height * 10}
                        </div>
                        <motion.div
                          initial={{ height: 0 }}
                          whileInView={{ height: `${(height / 130) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05, duration: 0.4, type: 'spring' }}
                          className="w-full rounded-t-lg cursor-pointer transition-all duration-200"
                          style={{ background: hoveredBar === i ? '#0071e3' : hoveredBar !== null ? '#e0e9ff' : '#0071e380' }}
                        />
                        <div className="text-[8px] font-medium text-muted-foreground/50">{weekDays[i]}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity Feed */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-bold text-foreground">Recent Activity</div>
                    <Bell className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    {recentActivity.map((act, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        whileHover={{ x: 4 }}
                        className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 cursor-pointer hover:border-[#0071e3]/40 transition-all"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3] flex-shrink-0">
                          <act.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">{act.name}</div>
                          <div className="text-[10px] text-muted-foreground">{act.time}</div>
                        </div>
                        <div className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/5 px-2 py-1 rounded-full border border-[#0071e3]/10 flex-shrink-0">
                          {act.tag}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
