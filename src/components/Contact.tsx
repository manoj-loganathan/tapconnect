"use client"
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ArrowRight, ArrowLeft, CheckCircle2, User, Building2, Mail, Phone, MessageSquare } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { NfcIcon } from './NfcIcon'

const materials = [
  { id: 'pvc', name: 'PVC' },
  { id: 'metallic', name: 'Metal' },
  { id: 'wood', name: 'Wood' }
]

const colors = [
  { id: 'black', hex: '#1d1d1f', label: 'Black' },
  { id: 'gray', hex: '#8e8e93', label: 'Gray' },
  { id: 'sky', hex: '#0071e3', label: 'Blue' },
  { id: 'leaf', hex: '#34c759', label: 'Green' },
  { id: 'coral', hex: '#ff3b30', label: 'Red' },
  { id: 'gold', hex: '#ffcc00', label: 'Yellow' },
]

const questions = [
  { id: 'name', label: "What's your full name?", icon: User, placeholder: "Jane Smith" },
  { id: 'org', label: "Which organization do you represent?", icon: Building2, placeholder: "Your Company" },
  { id: 'email', label: "What's your work email?", icon: Mail, placeholder: "work@email.com" },
  { id: 'phone', label: "And a phone number to reach you?", icon: Phone, placeholder: "+91-000-000-0000" },
  { id: 'message', label: "Tell us about your futuristic vision...", icon: MessageSquare, placeholder: "Design requirements, quantities, etc." },
]

export default function Contact() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [material, setMaterial] = useState('pvc')
  const [color, setColor] = useState(colors[0])
  const [isCompleted, setIsCompleted] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)


  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      setIsCompleted(true)
    }
  }

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleNext()
    }
  }

  const currentQuestion = questions[step]

  return (
    <section id="contact" className="py-24 relative overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.05) 0%, transparent 80%)' }} />

      <div className="container mx-auto px-6 max-w-[1240px] relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-16 px-4">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground tracking-tight leading-none">
            Reach out, we’re ready to <span className="gradient-text">collaborate</span>
          </h2>
          <p className="text-muted-foreground/80 text-sm font-medium leading-relaxed">
            Experience the future of collaboration with our AI-guided consultant.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-16 lg:gap-32">
          
          {/* ── Left Column: Conversational AI Form ──────────── */}
          <div className="flex-1 flex flex-col justify-center min-h-[400px]">
            <AnimatePresence mode="wait">
              {!isCompleted ? (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "circOut" }}
                  className="w-full space-y-8"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[#0071e3] font-black text-[10px] uppercase tracking-[0.3em]">
                       <span className="w-8 h-px bg-[#0071e3]/20" />
                       Question {step + 1} of {questions.length}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight flex items-start gap-4">
                       <currentQuestion.icon className="w-8 h-8 text-[#0071e3]/40 mt-1 shrink-0" />
                       {currentQuestion.label}
                    </h3>
                  </div>

                  <div className="relative group max-w-xl">
                    {step === questions.length - 1 ? (
                      <textarea
                        ref={inputRef as any}
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                        onKeyDown={handleKeyDown}
                        placeholder={currentQuestion.placeholder}
                        rows={3}
                        className="w-full bg-transparent border-b-2 border-border/50 py-4 outline-none text-xl font-semibold transition-all placeholder:text-muted-foreground/30 resize-none h-24"
                      />
                    ) : (
                      <input
                        ref={inputRef as any}
                        type="text"
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                        onKeyDown={handleKeyDown}
                        placeholder={currentQuestion.placeholder}
                        className="w-full bg-transparent border-b-2 border-border/50 py-4 outline-none text-xl font-semibold transition-all placeholder:text-muted-foreground/30 h-16"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {step > 0 && (
                      <button
                        onClick={handlePrev}
                        className="px-6 py-4 bg-muted hover:bg-accent text-muted-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:shadow-xl hover:shadow-primary/10 active:scale-95 flex items-center gap-2 group"
                    >
                      {step === questions.length - 1 ? 'Finalize' : 'Continue'}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 max-w-md mx-auto"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8">
                     <CheckCircle2 className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-3xl font-black text-foreground tracking-tight">Transmission Complete</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Thank you {answers.name?.split(' ')[0]}. Our futuristic design team will review your inquiry and reach out within 24 hours.
                  </p>
                  <button 
                    onClick={() => { setStep(0); setIsCompleted(false); setAnswers({}); }}
                    className="text-[#0071e3] font-bold text-xs uppercase tracking-widest hover:underline"
                  >
                    Send another inquiry
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right Column: Interactive Card Lab (Minimalist) ──────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex-shrink-0 flex flex-col items-center justify-center lg:w-[400px]"
          >
            {/* The Configurator Canvas (Smaller & Cleaner) */}
            <div className="relative w-full max-w-[220px] aspect-[1/1.5] perspective-1000 mb-10">
              <motion.div
                animate={{ 
                  backgroundColor: color.hex,
                }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="w-full h-full rounded-[2rem] relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.12)] flex items-center justify-center border border-white/20"
              >
                {/* Visual Material Effects */}
                {material === 'metallic' && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/30 mix-blend-overlay pointer-events-none" />
                )}
                {material === 'metallic' && (
                   <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent,white,transparent)] opacity-15 blur-2xl animate-spin-slow-metal" />
                )}
                {material === 'wood' && (
                   <div className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none grayscale" 
                     style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)' }} />
                )}

                <div className="relative z-10 flex flex-col items-center">
                  <NfcIcon size={56} className="text-white brightness-[100] drop-shadow-lg" />
                </div>

                <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
              </motion.div>
            </div>

            {/* Material Tabs (Minimal: No Icons) */}
            <div className="w-full max-w-[280px] p-1 bg-muted rounded-xl mb-8 flex border border-border/50">
              {materials.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMaterial(m.id)}
                  className={`flex-1 py-2 rounded-lg transition-all text-[9px] font-black uppercase tracking-widest ${
                    material === m.id 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground/50 hover:text-muted-foreground'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {/* Color Swatches (Smaller & Refined) */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {colors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 relative ${
                    color.id === c.id ? 'border-[#0071e3] scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                   {color.id === c.id && (
                     <motion.div layoutId="color-ring-small" className="absolute -inset-1.5 border border-[#0071e3]/30 rounded-full" />
                   )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin-slow-metal {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow-metal {
          animation: spin-slow-metal 12s linear infinite;
        }
      `}</style>
    </section>
  )
}
