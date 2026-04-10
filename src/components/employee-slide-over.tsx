"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Edit } from "lucide-react"

type EmployeeDetailsData = {
  id: string
  name: string
  designation: string
  photo_url: string
  employee_code: string
  nfc_cards: { card_code: string; status: string }[] | null
  departments: { name: string } | null
}

export function EmployeeSlideOver({
  employeeId,
  orgId,
  open,
  onOpenChange,
}: {
  employeeId: string
  orgId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [employee, setEmployee] = React.useState<EmployeeDetailsData | null>(null)
  const [tapCount, setTapCount] = React.useState<number>(0)
  const [leadCount, setLeadCount] = React.useState<number>(0)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      if (!employeeId || !open) return;
      setLoading(true)

      // 1. Fetch details
      const { data: empData } = await supabase
        .from('employees')
        .select(`
          id, name, designation, photo_url, employee_code,
          departments(name),
          nfc_cards(card_code, status)
        `)
        .eq('id', employeeId)
        .single()
      
      if (empData) setEmployee(empData as any)

      // 2. Fetch taps count
      const { count: tCount } = await supabase
        .from('taps')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', employeeId)
      
      setTapCount(tCount || 0)

      // 3. Fetch leads count
      const { count: lCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', employeeId)

      setLeadCount(lCount || 0)

      setLoading(false)
    }

    loadData()
  }, [employeeId, open])

  if (!open) return null;

  const card = employee?.nfc_cards?.[0]
  const cardUrl = card?.card_code ? `envitra.in/c/${card.card_code}` : 'No card'
  const cardStatus = card?.status || 'Blank'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
             EMPLOYEE DETAIL — {employee?.name?.toUpperCase()}
          </SheetTitle>
          <SheetDescription className="sr-only">Detailed view of the employee card and engagements.</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">Loading details...</div>
        ) : (
          <div className="flex flex-col gap-8">
            
            {/* Header Profile Section */}
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  {employee?.photo_url ? (
                     <img src={employee.photo_url} alt={employee.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                  ) : (
                     <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {employee?.name?.substring(0,2).toUpperCase()}
                     </div>
                  )}
                  <div className="flex flex-col">
                     <h2 className="text-base font-bold text-foreground leading-tight tracking-tight">{employee?.name}</h2>
                     <p className="text-sm text-muted-foreground mt-0.5">{employee?.designation || 'No Designation'} — {employee?.departments?.name || 'No Dept'}</p>
                  </div>
               </div>
               
               <Button variant="outline" size="sm" onClick={() => alert('Deactivate Card Triggered')}>
                  Deactivate card
               </Button>
            </div>

            <Separator className="my-[-12px]" />

            {/* Metrics List */}
            <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-2 items-center">
                    <span className="text-sm font-medium text-foreground">Card code</span>
                    <span className="text-sm font-mono text-right text-muted-foreground">{card?.card_code || '—'}</span>
                </div>
                <Separator />
                
                <div className="grid grid-cols-2 items-center">
                    <span className="text-sm font-medium text-foreground">Card URL</span>
                    <span className="text-sm text-right text-primary hover:underline cursor-pointer">{cardUrl}</span>
                </div>
                <Separator />
                
                <div className="grid grid-cols-2 items-center">
                    <span className="text-sm font-medium text-foreground">Card status</span>
                    <div className="flex justify-end">
                       {cardStatus === 'active' || cardStatus === 'locked' ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-emerald-500/20 rounded-md font-medium">
                             {cardStatus === 'locked' ? 'Active — locked' : 'Active'}
                          </Badge>
                       ) : (
                          <Badge variant="outline">{cardStatus}</Badge>
                       )}
                    </div>
                </div>
                <Separator />

                <div className="grid grid-cols-2 items-center">
                    <span className="text-sm font-medium text-foreground">Total taps</span>
                    <span className="text-sm text-right font-medium text-foreground">{tapCount} total</span>
                </div>
                <Separator />

                <div className="grid grid-cols-2 items-center">
                    <span className="text-sm font-medium text-foreground">Leads captured</span>
                    <span className="text-sm text-right font-medium text-foreground">{leadCount} leads</span>
                </div>
                <Separator />
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => alert('Proceeding to Edit Mode.')}>
                   <Edit className="w-4 h-4 mr-2" />
                   Edit Employee
                </Button>
            </div>

          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
