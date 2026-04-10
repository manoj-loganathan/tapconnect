import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AppSidebar } from '@/components/app-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Inter } from 'next/font/google'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AdminBreadcrumb } from '@/components/admin-breadcrumb'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Fetch Org Data
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!org) {
    return notFound()
  }

  return (
    <div className={`${inter.className} ${inter.variable} font-sans antialiased text-[0.95rem]`}>
      <SidebarProvider>
        <TooltipProvider>
          <AppSidebar org={org} />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1" />
                <div className="h-4 w-px bg-border/50 hidden md:block" />
                <AdminBreadcrumb />
              </div>
              <div className="flex items-center gap-1.5 align-middle">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative group">
                      <div className="absolute right-2 top-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </div>
                      <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80">
                    <div className="flex flex-col gap-2">
                      <h4 className="font-semibold text-sm leading-none tracking-tight">Notifications</h4>
                      <p className="text-sm text-muted-foreground">You have no new notifications.</p>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <div className="h-5 w-px bg-border mx-1" />
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 bg-background text-foreground overflow-y-auto">
              <div className="max-w-[1600px] mx-auto p-4 md:p-8">
                {children}
              </div>
            </main>
          </SidebarInset>
        </TooltipProvider>
      </SidebarProvider>
    </div>
  )
}
