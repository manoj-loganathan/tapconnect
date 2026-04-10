"use client"
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const plans = [
  {
    name: "Basic",
    price: "Free",
    desc: "Perfect for individuals starting out.",
    features: ["1 Digital Profile", "Basic Analytics", "Standard NFC Card ($15)"],
    popular: false
  },
  {
    name: "Pro",
    price: "$9",
    period: "/mo",
    desc: "Advanced features for networking pros.",
    features: ["3 Digital Profiles", "Advanced Analytics", "Custom NFC Card included", "CRM Integration", "Lead Capture Mode"],
    popular: true
  },
  {
    name: "Teams",
    price: "Custom",
    desc: "For large teams and enterprises.",
    features: ["Unlimited Profiles", "Role-Based Access", "Custom Branding", "Dedicated Support", "API Access"],
    popular: false
  }
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-background">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground tracking-tight">Simple, Transparent <span className="gradient-text">Pricing</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Choose the perfect plan for you or your team. Upgrade anytime.</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.15 }}
              className={`relative w-full lg:w-1/3 bg-card rounded-[2.5rem] p-10 border transition-all ${
                plan.popular ? 'border-primary/30 shadow-xl transform lg:-translate-y-4 shadow-primary/10' : 'border-border/50 shadow-sm hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-[#3B82F6] text-white px-5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-bold mb-2 text-foreground tracking-tight">{plan.name}</h3>
              <p className="text-sm text-muted-foreground h-10 mb-8 leading-relaxed font-medium">{plan.desc}</p>
              
              <div className="mb-8 flex items-baseline">
                <span className="text-5xl font-extrabold text-foreground tracking-tight">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground ml-1 font-medium">{plan.period}</span>}
              </div>

              <button className={`w-full py-4 rounded-full font-semibold mb-10 transition-colors ${
                plan.popular ? 'apple-btn shadow-md' : 'bg-muted hover:bg-accent text-foreground border border-border/50'
              }`}>
                {plan.name === 'Teams' ? 'Contact Sales' : 'Open Account'}
              </button>

              <ul className="space-y-5 border-t border-border/50 pt-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                    <Check className="w-5 h-5 text-primary shrink-0" strokeWidth={3} /> {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
