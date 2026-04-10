import { Fingerprint } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Header() {
  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'Features', href: '#features' },
    { name: 'how it works?', href: '#how-it-works' },
    { name: 'pricing', href: '#pricing' },
    { name: 'reach us', href: '#contact' },
  ]

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Fingerprint className="w-8 h-8 text-[#0071e3]" />
          <span className="text-xl font-bold tracking-tight text-foreground">TapConnect</span>
        </Link>
        
        {/* Centered Nav */}
        <nav className="hidden md:flex gap-8 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className="hover:text-[#0071e3] transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>
        
        {/* Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="#" className="hidden md:block text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            Login
          </Link>
          <button className="apple-btn px-5 py-1.5 text-[13px] shadow-sm">
            Open Account
          </button>
        </div>
      </div>
    </header>
  )
}
