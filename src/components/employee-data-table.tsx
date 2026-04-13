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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus, Trash2, FileDown, Eye, Edit, Search, Loader2 } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"


function AnimatedSearchBox({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [focused, setFocused] = React.useState(false)
  const placeholders = ["Search by Emp Code...", "Search by Name...", "Search by Department..."]
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
  const [selectedEmployeeForDelete, setSelectedEmployeeForDelete] = React.useState<EmployeeData | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [loading, setLoading] = React.useState(!_empDataCache[slug])

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(_empColumnFiltersCache)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const router = useRouter()

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [departments, setDepartments] = React.useState<{id: string, name: string}[]>([])
  const [formData, setFormData] = React.useState({
    name: "",
    employee_code: "",
    email: "",
    phone: "",
    designation: "",
    dept_id: "",
    photo_url: ""
  })

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
          { event: '*', schema: 'tapconnect', table: 'employees' },
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

  // Fetch departments when dialog opens
  React.useEffect(() => {
     if (isAddDialogOpen && orgId) {
         const fetchDepts = async () => {
             const { data } = await supabase
                .from('departments')
                .select('id, name')
                .eq('org_id', orgId)
                .order('name')
             if (data) setDepartments(data)
         }
         fetchDepts()
     }
  }, [isAddDialogOpen, orgId])

  const handleCreateEmployee = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!orgId || !formData.name || !formData.employee_code) return
      
      setIsSubmitting(true)
      try {
          // 1. Insert Employee
          const { data: emp, error: empError } = await supabase
            .from('employees')
            .insert({
                org_id: orgId,
                dept_id: formData.dept_id || null,
                name: formData.name,
                employee_code: formData.employee_code,
                email: formData.email || null,
                phone: formData.phone || null,
                designation: formData.designation || null,
                photo_url: formData.photo_url || null,
                is_active: true
            })
            .select()
            .single()

          if (empError) throw empError

          // 2. Create NFC Card record (Status: requested)
          // uid and card_code are now allowed to be NULL per updated schema
          const { error: cardError } = await supabase
            .from('nfc_cards')
            .insert({
                org_id: orgId,
                employee_id: emp.id,
                status: 'requested',
                chip_type: 'NFC216'
            })
          
          if (cardError) throw cardError

          setIsAddDialogOpen(false)
          setFormData({
            name: "",
            employee_code: "",
            email: "",
            phone: "",
            designation: "",
            dept_id: "",
            photo_url: ""
          })
          fetchOrgAndData()
      } catch (err) {
          console.error('Error creating employee:', err)
          alert('Failed to create employee. Please try again.')
      } finally {
          setIsSubmitting(false)
      }
  }

  const handleDelete = async () => {
      if (!selectedEmployeeForDelete) return
      
      setIsDeleting(true)
      const empId = selectedEmployeeForDelete.id

      try {
          // 1. Delete all related details as per the confirmation message
          // This avoids foreign key constraint violations
          await supabase.from('taps').delete().eq('employee_id', empId)
          await supabase.from('leads').delete().eq('employee_id', empId)
          await supabase.from('nfc_cards').delete().eq('employee_id', empId)
          
          // 2. Finally delete the employee record
          const { error } = await supabase.from('employees').delete().eq('id', empId)
          
          if (!error) {
              setData(prev => prev.filter(emp => emp.id !== empId))
              setSelectedEmployeeForDelete(null)
              setRowSelection({})
          } else {
              throw error
          }
      } catch (err) {
          console.error('Error deleting employee:', err)
          alert('Failed to delete employee and related details. Please try again.')
      } finally {
          setIsDeleting(false)
      }
  }

  const exportExcel = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const targetData = selectedRows.length > 0 ? selectedRows.map(r => r.original) : data

    const exportData = targetData.map(emp => ({
        "Name": emp.name,
        "Email": emp.email || "N/A",
        "Department": emp.departments?.name || "N/A",
        "Designation": emp.designation || "N/A",
        "Status": emp.nfc_cards?.[0]?.status || "No Card"
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Employees")
    XLSX.writeFile(wb, `employees_export_${new Date().getTime()}.xlsx`)
  }

  const exportPDF = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const targetData = selectedRows.length > 0 ? selectedRows.map(r => r.original) : data

    const doc = new jsPDF()
    doc.text("Employees Directory", 14, 15)

    const tableColumn = ["Name", "Email", "Department", "Designation", "Status"]
    const tableRows = targetData.map(emp => [
        emp.name,
        emp.email || "N/A",
        emp.departments?.name || "N/A",
        emp.designation || "N/A",
        emp.nfc_cards?.[0]?.status || "No Card"
    ])

    // @ts-ignore
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    })
    doc.save(`employees_export_${new Date().getTime()}.pdf`)
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
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
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
      id: "status",
      accessorFn: (row) => row.nfc_cards?.[0]?.status,
      header: "Card Status",
      cell: ({ row }) => {
          const status = row.getValue("status") as string
          if (!status) return <Badge variant="outline">No Card</Badge>
          if (status === 'active') return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Active</Badge>
          if (status === 'deactivated') return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">Deactivated</Badge>
          if (status === 'requested') return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">Requested</Badge>
          if (status === 'in progress') return <Badge className="bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-indigo-500/20">In Progress</Badge>
          if (status === 'blank') return <Badge variant="secondary">Blank</Badge>
          return <Badge variant="destructive">{status}</Badge>
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const emp = row.original
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedEmployeeForDelete(emp)
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <AnimatedSearchBox 
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(v) => table.getColumn("name")?.setFilterValue(v)}
            />
            
            <Select
                value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
                onValueChange={(v) => {
                    table.getColumn("status")?.setFilterValue(v === "all" ? undefined : v)
                }}
            >
                <SelectTrigger className="w-[160px] h-9 bg-background">
                    <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="deactivated">Deactivated</SelectItem>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="in progress">In Progress</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden sm:flex items-center gap-2.5 px-3 h-9 shadow-none border-border/80 bg-background hover:bg-muted/50 transition-all rounded-lg">
                    <FileDown className="h-4 w-4 text-muted-foreground/80" /> 
                    <span className="text-sm font-bold tracking-tight">Export</span>
                    {table.getFilteredSelectedRowModel().rows.length > 0 && (
                      <span className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-[11px] font-bold px-1.5 py-0.5 rounded-md ml-0.5">
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
                        {column.id}
                    </DropdownMenuCheckboxItem>
                    )
                })}
            </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" /> Add Employee
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight">Add New Employee</DialogTitle>
                        <DialogDescription className="text-muted-foreground/80">
                            Create a new employee profile. An NFC card request will be generated automatically.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateEmployee} className="space-y-6 pt-6">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/70 ml-0.5">Full Name *</Label>
                                <Input 
                                    id="name" 
                                    placeholder="John Doe" 
                                    className="h-10 w-full bg-muted/30 border-muted-foreground/10 focus:border-blue-500/50 focus:ring-blue-500/10 transition-all rounded-lg"
                                    required 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/70 ml-0.5">Employee Code *</Label>
                                <Input 
                                    id="code" 
                                    placeholder="EMP001" 
                                    className="h-10 w-full bg-muted/30 border-muted-foreground/10 focus:border-blue-500/50 focus:ring-blue-500/10 transition-all rounded-lg"
                                    required 
                                    value={formData.employee_code}
                                    onChange={e => setFormData({...formData, employee_code: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/70 ml-0.5">Email</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="john@example.com" 
                                    className="h-10 w-full bg-muted/30 border-muted-foreground/10 transition-all rounded-lg"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/70 ml-0.5">Phone</Label>
                                <Input 
                                    id="phone" 
                                    placeholder="+1 234 567 890" 
                                    className="h-10 w-full bg-muted/30 border-muted-foreground/10 transition-all rounded-lg"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="designation" className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/70 ml-0.5">Designation</Label>
                                <Input 
                                    id="designation" 
                                    placeholder="Software Engineer" 
                                    className="h-10 w-full bg-muted/30 border-muted-foreground/10 transition-all rounded-lg"
                                    value={formData.designation}
                                    onChange={e => setFormData({...formData, designation: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dept" className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/70 ml-0.5">Department</Label>
                                <Select 
                                    value={formData.dept_id} 
                                    onValueChange={v => setFormData({...formData, dept_id: v})}
                                >
                                    <SelectTrigger className="h-10 w-full bg-muted/30 border-muted-foreground/10 transition-all rounded-lg">
                                        <SelectValue placeholder="Select dept" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="photo" className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/70 ml-0.5">Photo URL</Label>
                            <Input 
                                id="photo" 
                                placeholder="https://..." 
                                className="h-10 w-full bg-muted/30 border-muted-foreground/10 transition-all rounded-lg"
                                value={formData.photo_url}
                                onChange={e => setFormData({...formData, photo_url: e.target.value})}
                            />
                        </div>

                        <DialogFooter className="border-t pt-6 gap-3 sm:gap-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsAddDialogOpen(false)}
                                className="h-11 px-6 font-semibold bg-muted/20 border-muted-foreground/10 hover:bg-muted/40 transition-all rounded-lg"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting || !formData.name || !formData.employee_code}
                                className="h-11 px-6 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all rounded-lg min-w-[160px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : "Create Employee"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
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
      <Dialog open={!!selectedEmployeeForDelete} onOpenChange={(open) => !open && setSelectedEmployeeForDelete(null)}>
                <DialogContent className="max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
                            <Trash2 className="w-5 h-5" />
                            Confirm Delete
                        </DialogTitle>
                        <DialogDescription className="py-2 text-foreground/80">
                            Deleting an employee will delete all the related details. 
                            Are you sure you want to permanently delete <span className="font-bold text-foreground">"{selectedEmployeeForDelete?.name}"</span>? 
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 mt-4">
                        <Button variant="outline" onClick={() => setSelectedEmployeeForDelete(null)} disabled={isDeleting} className="flex-1">
                            Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleDelete} 
                          disabled={isDeleting}
                          className="flex-1 min-w-[140px]"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : "Delete Permanently"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
    </div>
  )
}
