"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus, Trash, FileDown, Search, Lock, Unlock, Zap, CreditCard, Cpu, Filter, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"

function AnimatedSearchBox({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [focused, setFocused] = React.useState(false)
  const placeholders = ["Search by Card Code...", "Search by Holder...", "Search by Chip..."]
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
     if (focused || value) return
     const interval = setInterval(() => {
         setIndex((prev) => (prev + 1) % placeholders.length)
     }, 3000)
     return () => clearInterval(interval)
  }, [focused, value, placeholders.length])

  return (
     <div className="relative flex items-center w-full sm:w-[300px] bg-background border rounded-md focus-within:ring-1 focus-within:ring-ring overflow-hidden">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground z-10" />
        
        <div className="relative w-full h-9 flex items-center">
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="absolute inset-0 w-full h-full pl-9 pr-3 bg-transparent text-sm outline-none z-20"
            />
            
            {(!focused && !value) && (
                <div className="absolute inset-0 w-full h-full pl-9 pr-3 flex flex-col justify-center pointer-events-none z-0 overflow-hidden">
                    <AnimatePresence mode="popLayout">
                        <motion.span
                           key={index}
                           initial={{ y: 20, opacity: 0 }}
                           animate={{ y: 0, opacity: 1 }}
                           exit={{ y: -20, opacity: 0 }}
                           transition={{ duration: 0.4, ease: "easeOut" }}
                           className="text-muted-foreground text-sm absolute"
                        >
                            {placeholders[index]}
                        </motion.span>
                    </AnimatePresence>
                </div>
            )}
        </div>
     </div>
  )
}

export type NfcCardData = {
  id: string
  org_id: string
  employee_id: string
  uid: string
  card_code: string
  chip_type: string
  status: string
  is_locked: boolean
  programmed_at: string | null
  deactivated_at: string | null
  deactivation_reason: string | null
  card_url: string | null
  employees: {
    id: string
    name: string
    email: string
    photo_url: string | null
    taps: { id: string }[] | null
  } | null
  card_taps: { id: string }[] | null
}

const _cardDataCache: Record<string, NfcCardData[]> = {}
let _cardColumnFiltersCache: ColumnFiltersState = []

export function NfcCardsDataTable({ slug }: { slug: string }) {
  const [data, setData] = React.useState<NfcCardData[]>(_cardDataCache[slug] || [])
  const [orgId, setOrgId] = React.useState<string | null>(null)
  const [orgColors, setOrgColors] = React.useState({ brand_color: '#0071e3', accent_color: '#0071e3' })
  const [loading, setLoading] = React.useState(!_cardDataCache[slug])
  const router = useRouter()

  const [deactivateCardId, setDeactivateCardId] = React.useState<string | null>(null)
  const [deactivateReason, setDeactivateReason] = React.useState('')
  const [isUpdating, setIsUpdating] = React.useState(false)

  const [sorting, setSorting] = React.useState<SortingState>([{ id: "taps", desc: true }])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(_cardColumnFiltersCache)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  React.useEffect(() => {
     _cardColumnFiltersCache = columnFilters
  }, [columnFilters])

  const fetchOrgAndData = React.useCallback(async () => {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, brand_color, accent_color')
      .eq('slug', slug)
      .single()
    
    if (orgData) {
      setOrgId(orgData.id)
      setOrgColors({ 
         brand_color: orgData.brand_color || '#0071e3', 
         accent_color: orgData.accent_color || '#0071e3' 
      })
      
      const { data: cardData } = await supabase
        .from('nfc_cards')
        .select(`*, employees (id, name, email, photo_url, taps (id)), card_taps:taps (id)`)
        .eq('org_id', orgData.id)
        .order('created_at', { ascending: false })
      
      if (cardData) {
         _cardDataCache[slug] = cardData as any
         setData(cardData as any)
      }
    }
    setLoading(false)
  }, [slug])

  React.useEffect(() => { fetchOrgAndData() }, [fetchOrgAndData])

  // Realtime — re-fetch on any card change (joins make patch-in-place harder)
  React.useEffect(() => {
    if (!orgId) return
    const cardChannel = supabase
      .channel(`nfc_cards:${orgId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'tapconnect', table: 'nfc_cards', filter: `org_id=eq.${orgId}` },
        () => { fetchOrgAndData() }
      )
      .subscribe()

    const tapsChannel = supabase
      .channel(`nfc_taps:${orgId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'tapconnect', table: 'taps', filter: `org_id=eq.${orgId}` },
        () => { fetchOrgAndData() }
      )
      .subscribe()

    return () => { 
      supabase.removeChannel(cardChannel)
      supabase.removeChannel(tapsChannel)
    }
  }, [orgId, fetchOrgAndData])

  const handleToggleLock = async (id: string, currentLockStatus: boolean) => {
    // Optimistic update
    setData(prev => prev.map(c => c.id === id ? { ...c, is_locked: !currentLockStatus } : c))
    await supabase.from('nfc_cards').update({ is_locked: !currentLockStatus }).eq('id', id)
  }

  const handleActivate = async (id: string) => {
    const now = new Date().toISOString()
    setData(prev => prev.map(c => c.id === id ? { ...c, status: 'active', activated_at: now, deactivated_at: null, deactivation_reason: null } : c))
    await supabase.from('nfc_cards').update({ status: 'active', activated_at: now, deactivated_at: null, deactivation_reason: null }).eq('id', id)
  }

  const handleDeactivate = async () => {
    if (!deactivateCardId || !deactivateReason.trim()) return
    setIsUpdating(true)
    const now = new Date().toISOString()
    setData(prev => prev.map(c => c.id === deactivateCardId ? { ...c, status: 'deactivated', deactivated_at: now, deactivation_reason: deactivateReason.trim() } : c))
    await supabase.from('nfc_cards').update({ status: 'deactivated', deactivated_at: now, deactivation_reason: deactivateReason.trim() }).eq('id', deactivateCardId)
    setDeactivateCardId(null)
    setDeactivateReason('')
    setIsUpdating(false)
  }

  const exportExcel = () => {
    const targetData = table.getFilteredSelectedRowModel().rows.length > 0 
       ? table.getFilteredSelectedRowModel().rows.map(row => row.original) 
       : table.getFilteredRowModel().rows.map(row => row.original);

    const exportData = targetData.map(card => ({
        "Holder": card.employees?.name || "Unassigned",
        "Chip Type": card.chip_type || "N/A",
        "Status": card.status || "N/A",
        "Locked": card.is_locked ? "Yes" : "No",
        "Programmed At": card.programmed_at ? format(new Date(card.programmed_at), 'PPP') : "Not Programmed",
        "Activated At": card.activated_at ? format(new Date(card.activated_at), 'PPP') : "Not Activated",
        "Total Taps": card.employees?.taps?.length || 0
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "NFC Cards")
    XLSX.writeFile(wb, "nfc_cards_export.xlsx")
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text("NFC Cards Directory", 14, 15)

    const targetData = table.getFilteredSelectedRowModel().rows.length > 0 
       ? table.getFilteredSelectedRowModel().rows.map(row => row.original) 
       : table.getFilteredRowModel().rows.map(row => row.original);

    const tableColumn = ["Holder", "Chip Type", "Status", "Locked", "Taps"]
    const tableRows = targetData.map(card => [
        card.employees?.name || "Unassigned",
        card.chip_type || "N/A",
        card.status || "N/A",
        card.is_locked ? "Yes" : "No",
        (card.employees?.taps?.length || 0).toString()
    ])

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    })
    doc.save("nfc_cards_export.pdf")
  }

  const columns: ColumnDef<NfcCardData>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "holder_name",
      accessorFn: (row) => row.employees?.name,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Card Holder
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const emp = row.original.employees
        if (!emp) return <div className="text-muted-foreground italic text-sm">Unassigned Stock</div>
        return (
          <div className="flex items-center gap-3 py-2">
             <div 
                className="w-11 h-[30px] rounded-[6px] relative overflow-hidden flex items-center justify-center shrink-0 transition-transform hover:scale-105"
                style={{ 
                   background: `linear-gradient(135deg, ${orgColors.brand_color}, ${orgColors.accent_color})`,
                   boxShadow: `0 6px 12px -2px ${orgColors.brand_color}50, 0 3px 7px -3px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2)`
                }}
             >
                <div className="w-2 h-1.5 rounded-[1.5px] bg-white/30 absolute left-1.5 flex gap-[1px] p-[1px]">
                   <div className="w-px h-full bg-white/50"></div>
                   <div className="w-px h-full bg-white/50"></div>
                </div>
                <div className="absolute right-1.5 flex items-center gap-[1.5px] opacity-40">
                   <div className="h-[4px] w-[1.5px] bg-white rounded-full"></div>
                   <div className="h-[6px] w-[1.5px] bg-white rounded-full"></div>
                   <div className="h-[8px] w-[1.5px] bg-white rounded-full"></div>
                </div>
             </div>
             <div className="flex flex-col">
                 <span className="font-semibold text-[14px] truncate max-w-[150px]">{emp.name}</span>
                 {emp.email && <span className="text-[12px] text-muted-foreground truncate max-w-[150px]">{emp.email}</span>}
             </div>
          </div>
        )
      },
    },
    {
      accessorKey: "chip_type",
      header: "Chip Type",
      cell: ({ row }) => {
          const type = row.getValue("chip_type") as string
          return (
             <Badge variant="outline" className="text-xs bg-muted/40">
                <Cpu className="w-3 h-3 mr-1.5 opacity-50" />
                {type || "Unknown"}
             </Badge>
          )
      },
    },
    {
      accessorKey: "card_url",
      header: "Card URL",
      cell: ({ row }) => {
          const url = row.getValue("card_url") as string
          if (!url) return <span className="text-muted-foreground text-xs italic">Unlinked</span>
          return (
             <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline hover:text-primary/80 truncate max-w-[140px] inline-block font-medium">
                {url.replace(/^https?:\/\//, '')}
             </a>
          )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
          const status = row.getValue("status") as string
          const cardId = row.original.id

          if (!status) return <Badge variant="outline">Unknown</Badge>
          if (status === 'active') return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); setDeactivateCardId(cardId) }}>Active</Badge>
          if (status === 'locked') return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20 cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); handleActivate(cardId) }}>Locked</Badge>
          if (status === 'blank') return <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors" onClick={(e) => { e.stopPropagation(); handleActivate(cardId) }}>Blank Stock</Badge>
          if (status === 'deactivated') {
              const reason = row.original.deactivation_reason
              const time = row.original.deactivated_at ? format(new Date(row.original.deactivated_at), "MMM d, yyyy h:mm a") : ""
              return (
                  <TooltipProvider>
                     <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                            <Badge variant="destructive" className="cursor-pointer hover:opacity-80 transition-alpha" onClick={(e) => { e.stopPropagation(); handleActivate(cardId) }}>Deactivated</Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[280px] min-w-[150px] p-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.15)] bg-slate-900 text-slate-50 border-slate-800 flex flex-col rounded-2xl rounded-br-sm">
                            <p className="text-[13px] font-medium leading-relaxed break-words">{reason || "No explicit reason was provided."}</p>
                            <p className="text-[10px] opacity-60 self-end mt-1.5">{time || "Unknown"}</p>
                        </TooltipContent>
                     </Tooltip>
                  </TooltipProvider>
              )
          }
          
          return <Badge variant="outline" className="capitalize cursor-pointer" onClick={(e) => { e.stopPropagation(); handleActivate(cardId) }}>{status}</Badge>
      },
    },
    {
      accessorKey: "is_locked",
      header: "Security",
      cell: ({ row }) => {
          const locked = row.getValue("is_locked") as boolean
          const cardId = row.original.id
          
          return locked ? (
             <div onClick={(e) => { e.stopPropagation(); handleToggleLock(cardId, locked) }} className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 cursor-pointer hover:bg-amber-500/20 transition-colors" title="Click to Unlock">
                <Lock className="w-4 h-4 text-amber-500" />
             </div>
          ) : (
             <div onClick={(e) => { e.stopPropagation(); handleToggleLock(cardId, locked) }} className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 cursor-pointer hover:bg-emerald-500/20 transition-colors" title="Click to Lock">
                <Unlock className="w-4 h-4 text-emerald-500 opacity-80" />
             </div>
          )
      },
    },
    {
      accessorKey: "programmed_at",
      header: "Programmed",
      cell: ({ row }) => {
          const dateStr = row.getValue("programmed_at") as string
          if (!dateStr) return <span className="text-xs text-muted-foreground italic">Pending</span>
          return <span className="text-xs text-muted-foreground">{format(new Date(dateStr), "MMM d, yyyy")}</span>
      },
    },
    {
      id: "taps",
      accessorFn: (row) => row.employees?.taps?.length || 0,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Taps
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
         <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-sm">{row.getValue("taps")}</span>
         </div>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
        pagination: { pageSize: 50 },
        sorting: [{ id: "taps", desc: true }]
    }
  })

  // Global search implementation mimicking EmployeeDataTable
  // Instead of tying to a specific column, we will filter by holder name or card code
  React.useEffect(() => {
    // We override global filter for this specific setup
  }, [])

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
        <div className="flex items-center gap-2">
            {/* Searching by holder_name instead of card_code (which was removed) */}
            <AnimatedSearchBox 
               value={(table.getColumn("holder_name")?.getFilterValue() as string) ?? ""}
               onChange={(v) => table.getColumn("holder_name")?.setFilterValue(v)}
            />
            {/* Status Filter */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="hidden sm:flex border-dashed">
                        <Filter className="mr-2 h-4 w-4" /> Status
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem
                        checked={!table.getColumn("status")?.getFilterValue()}
                        onCheckedChange={() => table.getColumn("status")?.setFilterValue(undefined)}
                    >
                        All
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={table.getColumn("status")?.getFilterValue() === "active"}
                        onCheckedChange={() => table.getColumn("status")?.setFilterValue("active")}
                    >
                        Active
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={table.getColumn("status")?.getFilterValue() === "deactivated"}
                        onCheckedChange={() => table.getColumn("status")?.setFilterValue("deactivated")}
                    >
                        Deactivated
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden sm:flex transition-all">
                      <FileDown className="mr-2 h-4 w-4" /> Export
                      {table.getFilteredSelectedRowModel().rows.length > 0 && (
                          <span className="ml-2 flex items-center justify-center bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 min-w-[20px] h-[20px] rounded-sm text-[11px] font-bold animate-in fade-in zoom-in duration-200">
                             {table.getFilteredSelectedRowModel().rows.length}
                          </span>
                      )}
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportExcel}>Export as Excel</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPDF}>Export as PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto hidden sm:flex">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                    return (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                        }
                    >
                        {column.id.replace('_', ' ')}
                    </DropdownMenuCheckboxItem>
                    )
                })}
            </DropdownMenuContent>
            </DropdownMenu>

        </div>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/sites/${slug}/admin/cards/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} onClick={(e) => {
                       // Prevent navigation if clicking select, status, security, or links
                       const id = cell.column.id
                       if (["select", "status", "is_locked", "card_url", "actions"].includes(id)) {
                          e.stopPropagation()
                       }
                    }}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {loading ? "Loading NFC Fleet..." : "No NFC Cards found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 text-sm text-muted-foreground mr-4">
            Total Cards: {table.getFilteredRowModel().rows.length}
          </div>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
      
      {/* Deactivation Modal component */}
      <Dialog open={!!deactivateCardId} onOpenChange={(open) => !open && setDeactivateCardId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke NFC Card</DialogTitle>
            <DialogDescription>
              Please clearly state the reason for deactivating this card. This will restrict its physical capabilities immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
             <Input 
                placeholder="E.g., Lost card, Employee leaving, Damaged..." 
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                disabled={isUpdating}
             />
          </div>
          <DialogFooter className="mt-4">
             <Button variant="outline" onClick={() => setDeactivateCardId(null)} disabled={isUpdating}>Cancel</Button>
             <Button variant="destructive" onClick={handleDeactivate} disabled={!deactivateReason.trim() || isUpdating}>Confirm Revocation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  )
}
