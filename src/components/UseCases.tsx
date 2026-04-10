"use client"
import { motion } from 'framer-motion'
import { Code2, Building2, Briefcase, Star, GitBranch, Globe, Check, Users, Shield, Link, ArrowUpRight, Smartphone, Layers } from 'lucide-react'

const cases = [
  {
    icon: Code2,
    role: "Developers",
    desc: "Share GitHub repos, side projects, and contact info instantly.",
    renderMockup: () => (
      <div className="w-full flex flex-col gap-2 mt-5">
        {[
          { icon: GitBranch, label: "github.com/user", badge: "2.3k ⭐" },
          { icon: Globe, label: "portfolio.dev", badge: "Live" },
          { icon: GitBranch, label: "open-to-work profile", badge: "Public" },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-3 bg-card rounded-xl px-4 py-2.5 border border-border/50 hover:bg-muted/50 transition-colors group/row cursor-pointer">
            <row.icon className="w-4 h-4 text-primary/50 group-hover/row:text-primary transition-colors flex-shrink-0" strokeWidth={1.5} />
            <span className="text-xs font-medium text-muted-foreground truncate flex-1">{row.label}</span>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">{row.badge}</span>
          </div>
        ))}
      </div>
    )
  },
  {
    icon: Building2,
    role: "Enterprises",
    desc: "Manage employee cards globally with central admin controls.",
    renderMockup: () => (
      <div className="w-full mt-5 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Users, label: "Teams", value: "24" },
            { icon: Layers, label: "Cards", value: "847" },
            { icon: Shield, label: "Secure", value: "100%" },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl p-3 flex flex-col items-center border border-border/50 hover:border-primary/30 transition-colors">
              <s.icon className="w-4 h-4 text-primary mb-1.5" strokeWidth={1.5} />
              <div className="text-base font-black text-foreground">{s.value}</div>
              <div className="text-[9px] text-muted-foreground font-medium">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 border border-border/50">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-semibold text-muted-foreground">RBAC policy applied globally</span>
          <Check className="w-3.5 h-3.5 text-primary ml-auto" strokeWidth={2.5} />
        </div>
      </div>
    )
  },
  {
    icon: Briefcase,
    role: "Sales Teams",
    desc: "Convert leads on the spot. Tap, beam contact, sync to CRM.",
    renderMockup: () => (
      <div className="w-full mt-5 flex flex-col gap-2">
        {[
          { name: "Jay Osei", val: "Salesforce", done: true },
          { name: "Priya Nair", val: "HubSpot", done: true },
          { name: "Marco Rossi", val: "Pipedrive", done: false },
        ].map((lead, i) => (
          <div key={i} className="flex items-center gap-3 bg-card rounded-xl px-4 py-2 border border-border/50 hover:border-primary/30 transition-colors group/row cursor-pointer">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-primary-foreground text-[9px] font-black flex-shrink-0 transition-colors ${lead.done ? 'bg-primary' : 'bg-muted-foreground/20'}`}>
              {lead.done ? <Check className="w-3 h-3" strokeWidth={3} /> : '…'}
            </div>
            <span className="text-xs font-bold text-foreground flex-1 truncate">{lead.name}</span>
            <span className={`text-[10px] font-semibold ${lead.done ? 'text-primary' : 'text-muted-foreground'}`}>{lead.val} {lead.done ? '✓' : ''}</span>
          </div>
        ))}
      </div>
    )
  },
  {
    icon: Star,
    role: "Creators",
    desc: "Consolidate your links, socials, and booking lines into one tap.",
    renderMockup: () => (
      <div className="w-full mt-5 flex flex-col gap-2">
        {[
          { icon: Link, label: "tapconnect.me/yourname", badge: "42k Taps" },
          { icon: Smartphone, label: "Instagram · TikTok · X", badge: "3 linked" },
          { icon: Globe, label: "Booking page linked", badge: "Live" },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-3 bg-card rounded-xl px-4 py-2.5 border border-border/50 hover:bg-muted/50 transition-colors group/row cursor-pointer">
            <row.icon className="w-4 h-4 text-primary/50 group-hover/row:text-primary transition-colors flex-shrink-0" strokeWidth={1.5} />
            <span className="text-xs font-medium text-muted-foreground truncate flex-1">{row.label}</span>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">{row.badge}</span>
          </div>
        ))}
      </div>
    )
  },
]

export default function UseCases() {
  return (
    <section className="py-24 relative z-10 bg-background">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground tracking-tight">Built for <span className="gradient-text">Everyone</span></h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Whether you're solo or scaling to thousands, TapConnect grows with you.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {cases.map((uc, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-muted/20 rounded-[2rem] p-6 border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-400 cursor-pointer flex flex-col"
            >
              {/* Icon */}
              <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:scale-110 mb-4">
                <uc.icon className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-bold mb-1.5 text-foreground tracking-tight">{uc.role}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{uc.desc}</p>

              {/* UI Mockup */}
              <div className="flex-1">
                {uc.renderMockup()}
              </div>

              {/* CTA */}
              <div className="mt-5 flex items-center gap-1 font-semibold text-sm text-primary group-hover:gap-2 transition-all duration-300">
                <span>Learn more</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
