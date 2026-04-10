"use client"
import { motion } from 'framer-motion'
import { Database, Server, Globe, Shield, Zap, Code2, Flame, Hash, Cpu, GitBranch } from 'lucide-react'
import { NfcIcon } from './NfcIcon'

// Integration brand logos with definitively color URLs and custom local assets
const brandLogos = [
  { name: 'Salesforce', slug: 'salesforce', color: '00A1E0' },
  { name: 'HubSpot',    slug: 'hubspot',    color: 'FF7A59' },
  { name: 'Slack',      slug: 'slack',      color: '#4A154B', local: '/images/icons8-slack-new-48.png' },
  { name: 'Notion',     slug: 'notion',     color: '000000' },
  { name: 'Zapier',     slug: 'zapier',     color: '#ff4a00' },
  { name: 'LinkedIn',   slug: 'linkedin',   color: '#0A66C2', local: '/images/icons8-linkedin-48.png' },
]

// 4 icons in inner circle (rotate SLOW)
const inner = [
  { name: 'Next.js',   icon: Code2,    color: '#000000', startAngle: 0   },
  { name: 'Supabase',  icon: Database, color: '#3ecf8e', startAngle: 90  },
  { name: 'Vercel',    icon: Globe,     color: '#555555', startAngle: 180 },
  { name: 'Node.js',   icon: Server,    color: '#539e43', startAngle: 270 },
]

// 6 icons in outer circle (rotate FAST)
const outer = [
  { name: 'Stripe',    icon: Shield,    color: '#625afa', startAngle: 0   },
  { name: 'Turbo',     icon: Zap,       color: '#ef4444', startAngle: 60  },
  { name: 'Firebase',  icon: Flame,     color: '#FFCA28', startAngle: 120 },
  { name: 'Slack',     icon: Hash,      color: '#4A154B', startAngle: 180, image: '/images/icons8-slack-new-48.png' },
  { name: 'Groq AI',   icon: Cpu,       color: '#f25022', startAngle: 240 },
  { name: 'n8n',       icon: GitBranch, color: '#ff6d5a', startAngle: 300 },
]

const INNER_R = 100 
const OUTER_R = 190 
const ORBIT_SIZE = 500

function OrbitItem({ icon: Icon, name, color, radius, startAngle, duration, image }: {
  icon: React.ElementType, name: string, color: string,
  radius: number, startAngle: number, duration: number,
  image?: string
}) {
  return (
    <motion.div
      className="absolute"
      style={{
        left: ORBIT_SIZE / 2,
        top: ORBIT_SIZE / 2,
        width: 0,
        height: 0,
      }}
      animate={{ rotate: [startAngle, startAngle + 360] }}
      transition={{ duration, ease: 'linear', repeat: Infinity }}
    >
      <motion.div
        className="absolute flex flex-col items-center"
        style={{ left: radius, top: 0, x: '-50%', y: '-50%' }}
        animate={{ rotate: [-(startAngle), -(startAngle + 360)] }}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
        initial={{ rotate: -startAngle }}
      >
        <div
          className="w-10 h-10 rounded-xl bg-card flex items-center justify-center shadow-lg border border-border/50 transition-all duration-300 overflow-hidden"
          style={{ boxShadow: `0 4px 20px ${color}10` }}
        >
          {image ? (
            <img src={image} alt={name} className="w-6 h-6 object-contain" />
          ) : (
            <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.5} />
          )}
        </div>
        <div className="text-[10px] font-bold text-foreground/40 mt-1.5 whitespace-nowrap uppercase tracking-widest">{name}</div>
      </motion.div>
    </motion.div>
  )
}

export default function TechStack() {
  return (
    <section id="tech" className="py-20 relative overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 65% 55% at 30% 55%, hsl(var(--primary) / 0.05) 0%, transparent 80%)' }} />

      <div className="container mx-auto px-6 max-w-[1100px] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground tracking-tight leading-none">
            Powered by the <span className="gradient-text">Edge</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base font-medium opacity-70">
            A high-performance stack built for global scale. Lightning fast and remarkably secure.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-0">

          {/* ────── Orbital System ────────────────────── */}
          <div
            className="relative hidden md:block flex-shrink-0"
            style={{ width: ORBIT_SIZE, height: ORBIT_SIZE }}
          >
            {/* Guide rings */}
            <div className="absolute rounded-full border border-dashed border-border/50 pointer-events-none"
              style={{ width: INNER_R * 2, height: INNER_R * 2, left: ORBIT_SIZE / 2 - INNER_R, top: ORBIT_SIZE / 2 - INNER_R }} />
            <div className="absolute rounded-full border border-dashed border-border/50 pointer-events-none"
              style={{ width: OUTER_R * 2, height: OUTER_R * 2, left: ORBIT_SIZE / 2 - OUTER_R, top: ORBIT_SIZE / 2 - OUTER_R }} />

            {/* Center NFC Hub */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="absolute z-20 w-24 h-24 rounded-full bg-card flex items-center justify-center shadow-lg border border-border/50"
              style={{ left: ORBIT_SIZE / 2 - 48, top: ORBIT_SIZE / 2 - 48 }}
            >
              <div className="w-16 h-16 rounded-full bg-[#0071e3] flex items-center justify-center">
                <NfcIcon size={36} className="brightness-[100]" />
              </div>
            </motion.div>

            {/* Inner Ring: 4 items (SLOW, 50s) */}
            {inner.map((t, i) => (
              <OrbitItem key={i} icon={t.icon} name={t.name} color={t.color}
                radius={INNER_R} startAngle={t.startAngle} duration={50} />
            ))}

            {/* Outer Ring: 6 items (FAST, 20s) */}
            {outer.map((t: any, i) => (
              <OrbitItem key={i} icon={t.icon} name={t.name} color={t.color}
                radius={OUTER_R} startAngle={t.startAngle} duration={20} image={t.image} />
            ))}
          </div>

          {/* ────── Integration Panel (Compact Chip Design) ────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex-1 max-w-md lg:pl-12"
          >
            <div className="inline-flex items-center gap-2 bg-[#0071e3]/5 border border-[#0071e3]/10 rounded-full px-3 py-1 mb-6">
              <Zap className="w-3.5 h-3.5 text-[#0071e3]" />
              <span className="text-[9px] font-black text-[#0071e3] uppercase tracking-[0.15em]">Sync Systems</span>
            </div>

            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-foreground tracking-tight leading-tight">
              Engineered to sync.
            </h3>
            <p className="text-muted-foreground text-base font-medium leading-relaxed mb-10 opacity-70">
              Direct, real-time integration into the platforms you love. Sync data and trigger workflows instantly.
            </p>

            {/* Compact Chip Grid */}
            <div className="grid grid-cols-2 gap-2.5 pb-8 border-b border-border/50 mb-8">
              {brandLogos.map((brand, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-2.5 bg-card hover:bg-accent px-3.5 py-2.5 rounded-lg border border-border/50 shadow-sm transition-all duration-300 cursor-pointer"
                >
                  <div className="w-4.5 h-4.5 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={brand.local || `https://cdn.simpleicons.org/${brand.slug}/${brand.color.replace('#', '')}`}
                      alt={brand.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[13px] font-semibold text-foreground tracking-tight">{brand.name}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              whileHover={{ x: 5 }}
              className="flex items-center gap-2 text-[#0071e3] font-bold text-xs uppercase tracking-widest cursor-pointer"
            >
              <span>Explore all Integrations</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
