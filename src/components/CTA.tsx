"use client"
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function CTA() {
  return (
    <section id="cta" className="py-24 relative overflow-hidden bg-background">
      <div className="container mx-auto px-6 relative z-10 max-w-[1200px]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-card border border-border/50 rounded-[3rem] p-12 md:p-20 text-center max-w-5xl mx-auto overflow-hidden relative shadow-sm"
        >
          {/* Subtle background glow */}
          <div className="absolute inset-x-0 -top-40 h-80 bg-[#0071e3]/5 blur-[120px] pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 bg-[#0071e3]/5 border border-[#0071e3]/10 rounded-full px-4 py-1.5 mb-8 relative z-10">
            <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" />
            <span className="text-[10px] font-black text-[#0071e3] uppercase tracking-[0.2em]">The Future is Here</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black mb-8 relative z-10 text-foreground tracking-tight leading-[1.05]">
            Stop handing out paper. <br />
            <span className="gradient-text">Start making waves.</span>
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto relative z-10 font-medium leading-relaxed opacity-70">
            Join 10,000+ visionaries who have already ditched the physical card for a smarter, instantaneous, and digital-first professional identity.
          </p>

          <button className="relative z-10 px-10 py-5 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-black rounded-full hover:scale-105 hover:shadow-2xl hover:shadow-[#0071e3]/20 transition-all flex items-center justify-center gap-3 mx-auto text-lg lowercase tracking-tight active:scale-95">
            get your elite card <ArrowRight className="w-5 h-5" />
          </button>

          <div className="mt-8 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] relative z-10">
             No App Required • Universal Tap • Eco-Friendly
          </div>
        </motion.div>
      </div>
    </section>
  )
}
