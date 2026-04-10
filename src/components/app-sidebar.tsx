"use client"

import * as React from "react"
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  Link as LinkIcon, 
  Magnet, 
  LogOut, 
  LayoutDashboard,
  Settings,
  Sparkles,
  Command
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"

export function AppSidebar({ org, ...props }: React.ComponentProps<typeof Sidebar> & { org: any }) {
  const pathname = usePathname()
  const params = useParams()
  const slug = params?.slug as string

  // Dynamic router resolving for module locations
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: `/sites/${slug}/admin/dashboard` },
    { icon: Users, label: 'Employees', href: `/sites/${slug}/admin/employees` },
    { icon: CreditCard, label: 'NFC Cards', href: `/sites/${slug}/admin/cards` },
    { icon: LinkIcon, label: 'Manage Links', href: `/sites/${slug}/admin/links` },
    { icon: Magnet, label: 'Leads', href: `/sites/${slug}/admin/leads` },
    { icon: BarChart3, label: 'Analytics', href: `/sites/${slug}/admin/analytics` },
  ]

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-accent/50 transition-colors">
              <Link href={`/sites/${slug}/admin/dashboard`}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" strokeWidth={1.5} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-tight">{org?.name || 'Enterprise'}</span>
                  <span className="truncate text-xs text-muted-foreground font-medium">Admin Workspace</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Ask Assistant */}
        <SidebarMenu className="mt-2 group-data-[collapsible=icon]:hidden">
            <SidebarMenuItem>
                <svg width="0" height="0" className="absolute">
                  <defs>
                    <linearGradient id="ai-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>
                </svg>
                <SidebarMenuButton className="hover:bg-primary/5 hover:text-primary transition-colors h-9">
                    <Sparkles stroke="url(#ai-gradient)" strokeWidth={2} />
                    <span className="font-semibold text-xs tracking-tight">Ask Assistant</span>
                    <SidebarMenuBadge className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        <span className="text-xs">⌘</span>I
                    </SidebarMenuBadge>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1.5">
            {menuItems.map((item) => {
               const isActive = pathname === item.href || pathname?.startsWith(item.href)
               return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
               )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton asChild tooltip="Settings">
               <Link href={`/sites/${slug}/admin/settings`}>
                 <Settings />
                 <span>Settings</span>
               </Link>
             </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
             <SidebarMenuButton tooltip="Sign Out" className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground">
               <LogOut />
               <span>Sign Out</span>
             </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
 
        <div className="mt-4 mx-2 mb-2 p-2 flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-0">
            <div className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                <span className="font-semibold tracking-tight">Authenticated</span>
                <span className="truncate text-[10px] text-muted-foreground font-medium">Admin Session Secure</span>
            </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
