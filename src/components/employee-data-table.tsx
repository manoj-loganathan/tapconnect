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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus, Trash, FileDown, Eye, Edit, Search } from "lucide-react"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

function AnimatedSearchBox({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [focused, setFocused] = React.useState(false)
  const placeholders = ["Search by Emp Code...", "Search by Name...", "Search by Department...", "Search by Card Code..."]
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

export type EmployeeData = {
  id: string
  name: string
  email: string
  photo_url: string
  employee_code: string
  designation: string
  dept_id: string
  departments: { name: string } | null
  nfc_cards: { card_code: string, status: string }[] | null
}

const _empDataCache: Record<string, EmployeeData[]> = {}
let _empColumnFiltersCache: ColumnFiltersState = []

export function EmployeeDataTable({ slug }: { slug: string }) {
  const [data, setData] = React.useState<EmployeeData[]>(_empDataCache[slug] || [])
  const [orgId, setOrgId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(!_empDataCache[slug])

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(_empColumnFiltersCache)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const router = useRouter()

  React.useEffect(() => {
     _empColumnFiltersCache = columnFilters
  }, [columnFilters])

  const fetchOrgAndData = React.useCallback(async () => {
    // 1. Get Org ID
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()
    
    if (orgData) {
      setOrgId(orgData.id)
      
      // 2. Fetch Employees with joined Departments & Cards
      const { data: empData, error } = await supabase
        .from('employees')
        .select(`
          *,
          departments (name),
          nfc_cards (card_code, status)
        `)
        .eq('org_id', orgData.id)
        .order('employee_code', { ascending: true })
      
      if (empData) {
         _empDataCache[slug] = empData as any
         setData(empData as any)
      }
      
      // 3. Subscription
      const channel = supabase.channel('employees_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'tapconnect', table: 'employees', filter: `org_id=eq.${orgData.id}` },
          () => {
             // Re-fetch complex joins on any change
             fetchOrgAndData()
          }
        )
        .subscribe()
        
      setLoading(false)
      return () => {
        supabase.removeChannel(channel)
      }
    }
    setLoading(false)
  }, [slug])

  React.useEffect(() => {
    fetchOrgAndData()
  }, [fetchOrgAndData])

  const handleDelete = async (ids: string[]) => {
      await supabase.from('employees').delete().in('id', ids)
      setRowSelection({})
      fetchOrgAndData()
  }

  const exportExcel = () => {
    const exportData = data.map(emp => ({
        "Emp Code": emp.employee_code || "N/A",
        "Name": emp.name,
        "Email": emp.email || "N/A",
        "Department": emp.departments?.name || "N/A",
        "Designation": emp.designation || "N/A",
        "Card Code": emp.nfc_cards?.[0]?.card_code || "N/A",
        "Status": emp.nfc_cards?.[0]?.status || "No Card"
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Employees")
    XLSX.writeFile(wb, "employees_export.xlsx")
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text("Employees Directory", 14, 15)

    const tableColumn = ["Emp Code", "Name", "Email", "Department", "Designation", "Card Code", "Status"]
    const tableRows = data.map(emp => [
        emp.employee_code || "N/A",
        emp.name,
        emp.email || "N/A",
        emp.departments?.name || "N/A",
        emp.designation || "N/A",
        emp.nfc_cards?.[0]?.card_code || "N/A",
        emp.nfc_cards?.[0]?.status || "No Card"
    ])

    // @ts-ignore
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    })
    doc.save("employees_export.pdf")
  }

  const columns: ColumnDef<EmployeeData>[] = [
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
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Employee
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const d = row.original
        return (
          <div className="flex items-center gap-3 py-2">
             {d.photo_url ? (
                 <img src={d.photo_url} alt={d.name} className="w-8 h-8 rounded-full object-cover" />
             ) : (
                 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                    {d.name.substring(0,2)}
                 </div>
             )}
             <div className="flex flex-col">
                 <span className="font-medium">{d.name}</span>
                 {d.email && <span className="text-xs text-muted-foreground">{d.email}</span>}
             </div>
          </div>
        )
      },
    },
    {
      id: "department",
      accessorFn: (row) => row.departments?.name,
      header: "Department",
      cell: ({ row }) => <div>{row.getValue("department") || "—"}</div>,
    },
    {
      accessorKey: "designation",
      header: "Designation",
      cell: ({ row }) => <div>{row.getValue("designation") || "—"}</div>,
    },
    {
      id: "card_code",
      accessorFn: (row) => row.nfc_cards?.[0]?.card_code,
      header: "Card Code",
      cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">{row.getValue("card_code") || "—"}</div>,
    },
    {
      id: "status",
      accessorFn: (row) => row.nfc_cards?.[0]?.status,
      header: "Card Status",
      cell: ({ row }) => {
          const status = row.getValue("status") as string
          if (!status) return <Badge variant="outline">No Card</Badge>
          if (status === 'active') return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Active</Badge>
          if (status === 'locked') return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">Locked</Badge>
          if (status === 'blank') return <Badge variant="secondary">Blank</Badge>
          return <Badge variant="destructive">{status}</Badge>
      },
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
        pagination: { pageSize: 50 }
    }
  })

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
        <AnimatedSearchBox 
           value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
           onChange={(v) => table.getColumn("name")?.setFilterValue(v)}
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
                        {column.id}
                    </DropdownMenuCheckboxItem>
                    )
                })}
            </DropdownMenuContent>
            </DropdownMenu>
            <Button>
                <Plus className="w-4 h-4 mr-2" /> Add Employee
            </Button>
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
                  onClick={(e) => {
                     // Prevent row click if the user clicked on a checkbox, button, or link
                     if ((e.target as Element).closest('button, a, input, [role="checkbox"]')) {
                         return;
                     }
                     router.push(`/sites/${slug}/admin/employees/${row.original.id}`)
                  }}
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
                  {loading ? "Loading employees..." : "No employees found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 text-sm text-muted-foreground mr-4">
            Total Employees: {table.getFilteredRowModel().rows.length}
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
      
    </div>
  )
}
