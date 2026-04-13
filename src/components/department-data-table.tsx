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
import { RealtimeChannel } from "@supabase/supabase-js"
import { ArrowUpDown, ChevronDown, Plus, Trash, Search, Loader2, AlertTriangle, Trash2 } from "lucide-react"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

function AnimatedSearchBox({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [focused, setFocused] = React.useState(false)
  const placeholders = ["Search by Department...", "Search by Description..."]
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

export type Department = {
  id: string
  name: string
  description: string
  created_at: string
  employees?: { count: number }[]
}

export function DepartmentDataTable({ slug }: { slug: string }) {
  const [data, setData] = React.useState<Department[]>([])
  const [orgId, setOrgId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [newDeptName, setNewDeptName] = React.useState("")
  const [newDeptDescription, setNewDeptDescription] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const [selectedDeptForDelete, setSelectedDeptForDelete] = React.useState<Department | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [targetDeptId, setTargetDeptId] = React.useState<string>("")

  React.useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let empChannel: RealtimeChannel | null = null;
    
    async function fetchOrgAndData() {
      // 1. Get Org ID
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()
      
      if (orgData) {
        setOrgId(orgData.id)
        
        const fetchDepartments = async () => {
          const { data: deptData } = await supabase
            .from('departments')
            .select('*, employees(count)')
            .eq('org_id', orgData.id)
            .order('name', { ascending: true })
            
          if (deptData) setData(deptData as any)
        }

        await fetchDepartments()
        
        // 3. Subscription with proper cleanup
        channel = supabase.channel(`dept_list_${orgData.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'tapconnect', table: 'departments' },
            (p) => { 
                console.log('[Real-time] Dept change detected:', p.eventType)
                fetchDepartments() 
            }
          )
          .subscribe()

        // 4. Also listen for employee changes to update counts
        empChannel = supabase.channel(`dept_emp_counts_${orgData.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'tapconnect', table: 'employees' },
            () => { 
                console.log('[Real-time] Employee change detected (updating counts)')
                fetchDepartments() 
            }
          )
          .subscribe()
      }
      setLoading(false)
    }

    fetchOrgAndData()

    return () => {
      if (channel) supabase.removeChannel(channel)
      if (empChannel) supabase.removeChannel(empChannel)
    }
  }, [slug])

  const handleDelete = async () => {
    if (!selectedDeptForDelete || !orgId) return
    
    const totalEmployees = selectedDeptForDelete.employees?.[0]?.count || 0
    
    setIsDeleting(true)

    // Step 1: Migration if needed
    if (totalEmployees > 0) {
        if (!targetDeptId) {
            console.error('Target department required for reassignment')
            setIsDeleting(true) // Keep loading to show error or just reset
            setIsDeleting(false)
            return
        }
        
        console.log(`[Migration] Reassigning ${totalEmployees} employees to ${targetDeptId}`)
        const { error: moveError } = await supabase
            .from('employees')
            .update({ dept_id: targetDeptId })
            .eq('dept_id', selectedDeptForDelete.id)
            
        if (moveError) {
            console.error('Error reassigning employees:', moveError)
            setIsDeleting(false)
            return
        }
    }

    // Step 2: Delete department
    const { error } = await supabase.from('departments').delete().eq('id', selectedDeptForDelete.id)
    
    if (!error) {
      setData((prev) => prev.filter(d => d.id !== selectedDeptForDelete.id))
      setSelectedDeptForDelete(null)
      setTargetDeptId("")
    } else {
      console.error('Error deleting department:', error)
    }
    setIsDeleting(false)
  }

  const handleAddDepartment = async () => {
    if (!newDeptName.trim() || !orgId) return
    setIsSubmitting(true)
    
    const { error } = await supabase
      .from('departments')
      .insert({
        org_id: orgId,
        name: newDeptName.trim(),
        description: newDeptDescription.trim()
      })

    if (!error) {
      setNewDeptName("")
      setNewDeptDescription("")
      setIsAddDialogOpen(false)
    } else {
      console.error('Error adding department:', error)
    }
    
    setIsSubmitting(false)
  }

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="pl-2 h-8 font-bold text-xs uppercase tracking-wider"
          >
            Department Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-bold text-sm py-4 pl-2">{row.getValue("name")}</div>,
    },
    {
      id: "employees",
      header: () => <div className="text-xs font-bold uppercase tracking-wider">Employees</div>,
      cell: ({ row }) => {
        const count = row.original.employees?.[0]?.count || 0
        return (
          <div className="py-4">
            <Badge variant={count > 0 ? "secondary" : "outline"} className={cn(
              "font-bold text-[11px]",
              count > 0 ? "bg-primary/5 text-primary border-primary/20" : "text-muted-foreground/50"
            )}>
              {count} {count === 1 ? 'Member' : 'Members'}
            </Badge>
          </div>
        )
      }
    },
    {
      accessorKey: "description",
      header: () => <div className="text-xs font-bold uppercase tracking-wider">Description</div>,
      cell: ({ row }) => <div className="max-w-[400px] truncate text-muted-foreground text-sm py-4">{row.getValue("description") || "—"}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-6 text-xs font-bold uppercase tracking-wider">Action</div>,
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={() => setSelectedDeptForDelete(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
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
            <Dialog open={!!selectedDeptForDelete} onOpenChange={(open) => !open && setSelectedDeptForDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <AlertTriangle className="w-5 h-5" />
                            Confirm Delete
                        </DialogTitle>
                        <DialogDescription className="py-2">
                            {(() => {
                                if (!selectedDeptForDelete) return ""
                                const totalEmployees = selectedDeptForDelete.employees?.[0]?.count || 0
                                
                                if (totalEmployees > 0) {
                                    return (
                                        <div className="space-y-4 pt-2">
                                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                                <p className="text-destructive font-medium text-sm">
                                                    "{selectedDeptForDelete.name}" has {totalEmployees} active employee(s).
                                                </p>
                                                <p className="text-xs text-destructive/80 mt-1">
                                                    You must move them to another department before deleting.
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                                    Move employees to:
                                                </label>
                                                <Select value={targetDeptId} onValueChange={setTargetDeptId}>
                                                    <SelectTrigger className="h-11 focus:ring-primary/20">
                                                        <SelectValue placeholder="Select target department" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {data.filter(d => d.id !== selectedDeptForDelete.id).map(dept => (
                                                            <SelectItem key={dept.id} value={dept.id}>
                                                                {dept.name}
                                                            </SelectItem>
                                                        ))}
                                                        {data.filter(d => d.id !== selectedDeptForDelete.id).length === 0 && (
                                                            <div className="p-2 text-xs text-center text-muted-foreground">
                                                                No other departments available. Create one first.
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )
                                }
                                
                                return `Are you sure you want to delete "${selectedDeptForDelete.name}"? This cannot be undone.`
                            })()}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-6 mt-4">
                        <Button variant="outline" onClick={() => setSelectedDeptForDelete(null)} disabled={isDeleting} className="px-6">
                            Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleDelete} 
                          disabled={isDeleting || ((selectedDeptForDelete?.employees?.[0]?.count || 0) > 0 && !targetDeptId)} 
                          className="px-8 min-w-[120px]"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : "Delete Permanently"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
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
                })
                }
            </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 px-4">
                        <Plus className="w-4 h-4 mr-2" /> Add Department
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Add New Department</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Create a new organizational unit to group your employees.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        <div className="grid gap-2">
                            <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                Department Name
                            </label>
                            <Input
                                id="name"
                                placeholder="e.g. Sales, Engineering, Marketing"
                                value={newDeptName}
                                onChange={(e) => setNewDeptName(e.target.value)}
                                className="h-10 focus-visible:ring-primary/20"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                Description <span className="text-[10px] font-normal lowercase">(optional)</span>
                            </label>
                            <Input
                                id="description"
                                placeholder="Short brief about department functions..."
                                value={newDeptDescription}
                                onChange={(e) => setNewDeptDescription(e.target.value)}
                                className="h-10 focus-visible:ring-primary/20"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsAddDialogOpen(false)}
                          disabled={isSubmitting}
                          className="font-bold h-11"
                        >
                            Cancel
                        </Button>
                        <Button 
                          onClick={handleAddDepartment} 
                          disabled={isSubmitting || !newDeptName.trim()}
                          className="font-bold h-11 px-8 min-w-[140px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Department"
                            )}
                        </Button>
                    </DialogFooter>
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
                  {loading ? "Loading departments..." : "No departments found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 text-sm text-muted-foreground mr-4">
            Total Departments: {table.getFilteredRowModel().rows.length}
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
