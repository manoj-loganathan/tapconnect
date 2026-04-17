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
import { Search, ArrowUpDown, ChevronDown, FileDown, Trash } from "lucide-react"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"

function AnimatedSearchBox({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [focused, setFocused] = React.useState(false)
  const placeholders = ["Search by name...", "Search by email...", "Search by company..."]
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

export type LeadData = {
  id: string
  org_id: string | null
  visitor_name: string | null
  visitor_email: string | null
  visitor_company: string | null
  visitor_phone: string | null
  status: string | null
  captured_at: string | null
  followup_date: string | null
  employees: { name: string } | null
}

const _leadDataCache: Record<string, LeadData[]> = {}

export function LeadsDataTable({ slug }: { slug: string }) {
  const [data, setData] = React.useState<LeadData[]>(_leadDataCache[slug] || [])
  const [orgId, setOrgId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(!_leadDataCache[slug])

  const [sorting, setSorting] = React.useState<SortingState>([{ id: "captured_at", desc: true }])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("all")

  const fetchOrgAndData = React.useCallback(async () => {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()
    
    if (orgData) {
      setOrgId(orgData.id)
      
      const { data: leadsData } = await supabase
        .from('leads')
        .select(`*, employees (name)`)
        .eq('org_id', orgData.id)
        .order('captured_at', { ascending: false })
      
      if (leadsData) {
         _leadDataCache[slug] = leadsData as any
         setData(leadsData as any)
      }
    }
    setLoading(false)
  }, [slug])

  React.useEffect(() => { fetchOrgAndData() }, [fetchOrgAndData])

  React.useEffect(() => {
    if (!orgId) return
    const channel = supabase
      .channel(`leads:${orgId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'tapconnect', table: 'leads', filter: `org_id=eq.${orgId}` },
        () => { fetchOrgAndData() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [orgId, fetchOrgAndData])

  const handleDelete = async (ids: string[]) => {
      await supabase.from('leads').delete().in('id', ids)
      setRowSelection({})
      fetchOrgAndData()
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
      setData((prev) => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
      const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', id)
      if (error) fetchOrgAndData()
  }

  const exportExcel = () => {
    const exportData = table.getFilteredRowModel().rows.map(row => {
        const d = row.original
        return {
            "Name": d.visitor_name || "-",
            "Email": d.visitor_email || d.visitor_phone || "-",
            "Company": d.visitor_company || "-",
            "Captured By": d.employees?.name || "-",
            "Captured Date": d.captured_at ? format(new Date(d.captured_at), "MMM d, yyyy") : "-",
            "Follow-up Date": d.followup_date ? format(new Date(d.followup_date), "MMM d, yyyy") : "-",
            "Status": d.status?.toUpperCase() || "-"
        }
    })
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Leads")
    XLSX.writeFile(wb, "leads_export.xlsx")
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text("Leads Directory", 14, 15)

    const tableColumn = ["Name", "Email", "Company", "Captured", "Follow-up", "Status"]
    const tableRows = table.getFilteredRowModel().rows.map(row => {
        const d = row.original
        return [
            d.visitor_name || "-",
            d.visitor_email || d.visitor_phone || "-",
            d.visitor_company || "-",
            `${d.employees?.name || "-"} (${d.captured_at ? format(new Date(d.captured_at), "MMM d") : "-"})`,
            d.followup_date ? format(new Date(d.followup_date), "MMM d, yyyy") : "-",
            d.status?.toUpperCase() || "-"
        ]
    })

    // @ts-ignore
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    })
    doc.save("leads_export.pdf")
  }

  const columns: ColumnDef<LeadData>[] = [
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
          className="ml-2"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="ml-2"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "visitor_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Lead
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
         const name = row.getValue("visitor_name") as string || "—"
         const email = row.original.visitor_email
         return (
             <div className="flex flex-col sm:pl-4 justify-center h-full">
                 <span className="font-medium text-foreground">{name}</span>
                 {email && <span className="text-xs text-muted-foreground">{email}</span>}
             </div>
         )
      },
    },
    {
      accessorKey: "visitor_phone",
      header: "Phone",
      cell: ({ row }) => {
          const phone = row.getValue("visitor_phone") as string
          if (phone) return <div className="text-muted-foreground font-medium">{phone}</div>
          return <div className="text-muted-foreground italic">—</div>
      },
    },
    {
      accessorKey: "visitor_company",
      header: "Company",
      cell: ({ row }) => <div>{row.getValue("visitor_company") || "—"}</div>,
    },
    {
      accessorKey: "captured_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Captured
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
          const dateStr = row.getValue("captured_at") as string
          const empName = row.original.employees?.name || "Unknown"
          return (
              <div className="flex flex-col sm:pl-4 justify-center h-full">
                  <span className="font-medium text-foreground">{empName}</span>
                  {dateStr && <span className="text-xs text-muted-foreground">{format(new Date(dateStr), "MMM d, yyyy")}</span>}
              </div>
          )
      },
    },
    {
      accessorKey: "followup_date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Follow-up
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
          const dateStr = row.getValue("followup_date") as string
          if (!dateStr) return <span className="text-muted-foreground sm:pl-4 italic">—</span>
          return (
             <div className="sm:pl-4 flex items-center h-full">
               <span className="font-semibold text-foreground bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-xs truncate max-w-full">
                  {format(new Date(dateStr), "MMM d, yyyy")}
               </span>
             </div>
          )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
          const status = (row.getValue("status") as string)?.toLowerCase() || "new"
          const leadId = row.original.id
          
          let badge = <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 shadow-none border-amber-500/20 uppercase text-[10px] tracking-wider px-2 py-0.5 font-bold cursor-pointer cursor-pointer">New <ChevronDown className="ml-1 w-3 h-3 inline-block" /></Badge>
          if (status === 'converted') badge = <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-emerald-500/20 uppercase text-[10px] tracking-wider px-2 py-0.5 font-bold cursor-pointer">Converted <ChevronDown className="ml-1 w-3 h-3 inline-block" /></Badge>
          else if (status === 'lost') badge = <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 shadow-none border-rose-500/20 uppercase text-[10px] tracking-wider px-2 py-0.5 font-bold cursor-pointer">Lost <ChevronDown className="ml-1 w-3 h-3 inline-block" /></Badge>
          else if (status === 'followed_up') badge = <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 shadow-none border-blue-500/20 uppercase text-[10px] tracking-wider px-2 py-0.5 font-bold cursor-pointer">Followed Up <ChevronDown className="ml-1 w-3 h-3 inline-block" /></Badge>
          
          return (
             <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">{badge}</DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                   <DropdownMenuItem onClick={() => handleUpdateStatus(leadId, 'new')}>New</DropdownMenuItem>
                   <DropdownMenuItem onClick={() => handleUpdateStatus(leadId, 'followed_up')}>Followed Up</DropdownMenuItem>
                   <DropdownMenuItem onClick={() => handleUpdateStatus(leadId, 'converted')}>Converted</DropdownMenuItem>
                   <DropdownMenuItem onClick={() => handleUpdateStatus(leadId, 'lost')}>Lost</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          )
      },
    },
  ]

  // Stats calculation
  const totalLeads = data.length
  const newLeads = data.filter(d => (d.status || 'new').toLowerCase() === 'new').length
  const convertedLeads = data.filter(d => (d.status || '').toLowerCase() === 'converted').length
  const lostLeads = data.filter(d => (d.status || '').toLowerCase() === 'lost').length

  const handleTabChange = (value: string) => {
      setActiveTab(value)
      if (value === 'all') {
          setColumnFilters(prev => prev.filter(f => f.id !== 'status'))
      } else {
          setColumnFilters([{ id: 'status', value: value }])
      }
  }

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
    globalFilterFn: (row, columnId, filterValue) => {
        const search = filterValue.toLowerCase()
        const name = (row.original.visitor_name || '').toLowerCase()
        const email = (row.original.visitor_email || '').toLowerCase()
        const phone = (row.original.visitor_phone || '').toLowerCase()
        const company = (row.original.visitor_company || '').toLowerCase()
        
        return name.includes(search) || email.includes(search) || phone.includes(search) || company.includes(search)
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter
    },
    initialState: {
        pagination: { pageSize: 50 },
        sorting: [{ id: "captured_at", desc: true }]
    }
  })

  return (
    <div className="w-full space-y-6">
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full pt-4">
        <TabsList variant="line" className="w-full justify-start border-b border-border/40 pb-0 mb-6 gap-6">
            <TabsTrigger value="all" className="pb-3 text-sm flex items-center gap-2">
                All Leads <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-semibold">{totalLeads}</span>
            </TabsTrigger>
            <TabsTrigger value="new" className="pb-3 text-sm flex items-center gap-2">
                New <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full text-xs font-semibold">{newLeads}</span>
            </TabsTrigger>
            <TabsTrigger value="converted" className="pb-3 text-sm flex items-center gap-2">
                Converted <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-xs font-semibold">{convertedLeads}</span>
            </TabsTrigger>
            <TabsTrigger value="lost" className="pb-3 text-sm flex items-center gap-2">
                Lost <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full text-xs font-semibold">{lostLeads}</span>
            </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
          <AnimatedSearchBox 
             value={globalFilter}
             onChange={setGlobalFilter}
          />
          <div className="flex items-center gap-2">
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                  <Button variant="destructive" onClick={() => {
                      const selectedIds = table.getFilteredSelectedRowModel().rows.map(r => r.original.id)
                      handleDelete(selectedIds)
                  }}>
                      <Trash className="w-4 h-4 mr-2" />
                      Delete {table.getFilteredSelectedRowModel().rows.length} rows
                  </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="hidden sm:flex">
                    <FileDown className="mr-2 h-4 w-4" /> Export
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
                    className="cursor-pointer hover:bg-muted/50 transition-colors h-[72px]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
                    {loading ? "Loading leads..." : "No leads found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 text-sm text-muted-foreground mr-4 pl-2">
              Total Leads: {table.getFilteredRowModel().rows.length}
            </div>
          </div>
          <div className="space-x-2 pr-2">
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
      </div>
    </div>
  )
}
