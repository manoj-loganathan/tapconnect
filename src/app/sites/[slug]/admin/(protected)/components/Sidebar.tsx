"use client"
import { useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { ThemeToggle } from '@/components/ThemeToggle'
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  Link as LinkIcon, 
  Magnet, 
  LogOut, 
  LayoutDashboard,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Command
} from 'lucide-react'

export default function Sidebar({ org }: { org: any }) {
  const params = useParams()
  const pathname = usePathname()
  
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: `/admin/dashboard` },
    { icon: Users, label: 'Employees', href: `/admin/employees` },
    { icon: CreditCard, label: 'NFC Cards', href: `/admin/cards` },
    { icon: LinkIcon, label: 'Manage Links', href: `/admin/links` },
    { icon: Magnet, label: 'Leads', href: `/admin/leads` },
    { icon: BarChart3, label: 'Analytics', href: `/admin/analytics` },
  ]

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden lg:flex flex-col bg-[#fafafa] dark:bg-[#09090b] border-r border-black/[0.06] dark:border-white/[0.08] h-screen sticky top-0 overflow-y-auto z-50 overflow-x-hidden text-[#09090b] dark:text-[#fafafa]"
    >
      {/* 1. Header Logic */}
      <div className="p-4 flex items-center justify-between mt-2">
        {!isCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden ml-1 hover:opacity-80 transition-opacity cursor-pointer">
                <div className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-lg bg-[#09090b] dark:bg-[#fafafa] flex items-center justify-center text-[#fafafa] dark:text-[#09090b] shadow-sm shadow-black/10">
                    <Command className="w-4 h-4" />
                </div>
                <div className="flex flex-col whitespace-nowrap">
                    <span className="text-sm font-semibold leading-tight truncate">
                        {org.name || 'Organization'}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground leading-tight truncate opacity-80">
                        Enterprise
                    </span>
                </div>
            </div>
        )}
        
        {isCollapsed && (
            <div className="w-8 h-8 mx-auto rounded-lg bg-[#09090b] dark:bg-[#fafafa] flex items-center justify-center text-[#fafafa] dark:text-[#09090b] shadow-sm mb-2">
                <Command className="w-4 h-4" />
            </div>
        )}

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      <div className="px-4 mb-6 mt-2">
        {/* 2. AI Assistant Shortcut */}
        <button className={`w-full flex items-center gap-2 bg-white dark:bg-[#18181b] border border-black/[0.08] dark:border-white/[0.08] text-sm font-medium py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-sm ${isCollapsed ? 'justify-center px-0' : 'px-2.5'}`}>
            <Sparkles className="w-4 h-4 text-emerald-500" />
            {!isCollapsed && <span className="flex-1 text-left text-xs font-semibold">Ask Assistant</span>}
            {!isCollapsed && <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>I
            </kbd>}
        </button>
      </div>

      {/* 3. Navigation Links matching shadcn docs */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href)
          return (
            <Link key={item.label} href={item.href}>
              <div
                className={`flex items-center gap-3 py-2 rounded-md text-sm font-medium transition-colors group ${
                  isActive 
                    ? 'bg-black/5 dark:bg-white/10 text-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/5'
                } ${isCollapsed ? 'px-0 justify-center' : 'px-3'}`}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4" />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* 4. Bottom Utilities */}
      <div className="px-3 pt-4 pb-4 border-t border-black/5 dark:border-white/10 mt-auto flex flex-col gap-1">
         
         <div className={`flex items-center justify-between py-2 rounded-md transition-colors ${isCollapsed ? 'flex-col gap-3' : 'px-3'}`}>
            {!isCollapsed && <span className="text-sm font-medium text-muted-foreground">Theme</span>}
            <div className={`${isCollapsed ? 'scale-90' : 'scale-100'} origin-right`}>
               <ThemeToggle />
            </div>
         </div>

         <Link href={`/admin/settings`}>
            <div className={`flex items-center gap-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/5 ${isCollapsed ? 'justify-center px-0' : 'px-3'}`} title={isCollapsed ? "Settings" : undefined}>
                <Settings className="w-4 h-4" />
                {!isCollapsed && <span>Settings</span>}
            </div>
         </Link>
         
         <button 
           className={`w-full flex items-center gap-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 ${isCollapsed ? 'justify-center px-0' : 'px-3 text-left'}`}
           title={isCollapsed ? "Sign Out" : undefined}
         >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span>Sign Out</span>}
         </button>

         {/* Extracted Top Alert Status */}
         {!isCollapsed && (
             <div className="mt-4 px-3 py-2 rounded-md border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex items-center gap-3">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-semibold">System Active</span>
                    <span className="text-[10px] text-muted-foreground">All connections secured</span>
                </div>
             </div>
         )}
      </div>
    </motion.aside>
  )
}

