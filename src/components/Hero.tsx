"use client"
import { motion } from 'framer-motion'
import { Users, ThumbsUp, Sparkles, ArrowRight, Share2, Smartphone } from 'lucide-react'
import { NfcIcon } from './NfcIcon'

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-[calc(100vh-4rem)] mt-16 flex flex-col justify-center overflow-hidden bg-background">
      <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-8 items-center h-full">
        
        {/* Left Column Content */}
        <div className="text-left pt-12 lg:pt-0 max-w-xl">
          <h1 className="text-6xl md:text-[5rem] font-bold mb-6 tracking-tight text-foreground flex flex-col leading-[1.1]">
            <span>Tap. Connect.</span>
            <span className="flex items-center gap-2">
              Instantly.<Sparkles className="w-12 h-12 text-primary -mt-2" strokeWidth={2} />
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 font-medium leading-relaxed max-w-lg">
            Share your digital identity in a single tap — no apps, no friction, just seamless networking.
          </p>
          
          <div className="mb-16">
            <button className="apple-btn px-8 py-4 font-semibold text-lg flex items-center gap-3 shadow-md hover:shadow-lg hover:scale-105 transition-all">
              Open Account <ArrowRight className="w-5 h-5 pointer-events-none" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-primary bg-primary/5 border border-primary/10">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground tracking-tight leading-none mb-1">4000+ Active users</div>
                <div className="text-xs text-muted-foreground font-medium">From across the world.</div>
              </div>
            </div>

            <div className="w-px h-12 bg-border hidden sm:block"></div>
            <div className="w-full h-px bg-border sm:hidden"></div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-primary bg-primary/5 border border-primary/10">
                <ThumbsUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground tracking-tight leading-none mb-1">5M+ Taps</div>
                <div className="text-xs text-muted-foreground font-medium">Completed in our lifetime.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Visuals */}
        <div className="relative h-[500px] flex items-center justify-center lg:mt-0 mt-12 w-full lg:w-[110%]">
          
          {/* Tile Pattern Doodle Art (Circle, Triangle, Square) */}
          <div className="absolute top-[-20%] bottom-[-20%] right-[-30%] left-0 pointer-events-none z-0 overflow-hidden text-[#0071e3]/[0.04] mask-gradient-to-l">
            <svg className="absolute w-full h-full max-w-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="shape-pattern" x="0" y="0" width="300" height="200" patternUnits="userSpaceOnUse">
                  {/* Row 1 */}
                  <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="8" />
                  <polygon points="150,20 180,75 120,75" fill="none" stroke="currentColor" strokeWidth="8" strokeLinejoin="round" />
                  <rect x="224" y="24" width="52" height="52" rx="10" fill="none" stroke="currentColor" strokeWidth="8" strokeLinejoin="round" />
                  
                  {/* Row 2 (offset) */}
                  <polygon points="50,120 80,175 20,175" fill="none" stroke="currentColor" strokeWidth="8" strokeLinejoin="round" />
                  <rect x="124" y="124" width="52" height="52" rx="10" fill="none" stroke="currentColor" strokeWidth="8" strokeLinejoin="round" />
                  <circle cx="250" cy="150" r="26" fill="none" stroke="currentColor" strokeWidth="8" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#shape-pattern)" />
            </svg>
          </div>

          <div className="relative w-[400px] h-[300px] z-10">
            {/* Card 1 (Bottom, Blue Theme) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: -8, x: -20, y: 40 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
              className="absolute z-10 w-[360px] h-[220px] rounded-[2rem] bg-gradient-to-br from-[#0071e3] to-[#004b99] shadow-xl flex items-center justify-center right-1/2 transform translate-x-1/2 border border-white/10"
            >
              <NfcIcon size={48} className="text-white/60" />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/10 rounded-[2rem] pointer-events-none" />
            </motion.div>

            {/* Card 2 (Top, Metallic Black) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: 10, x: 30, y: -20 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.3, delay: 0.1 }}
              className="absolute z-20 w-[360px] h-[220px] rounded-[2rem] bg-[#1d1d1f] bg-gradient-to-br from-[#2c2c2e] via-[#1c1c1e] to-[#000000] shadow-xl flex items-center justify-center right-1/2 transform translate-x-1/2 border border-white/20"
            >
              <NfcIcon size={48} className="text-white/40" />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-transparent rounded-[2rem] pointer-events-none" />
            </motion.div>
          </div>
          
        </div>
      </div>
    </section>
  )
}
