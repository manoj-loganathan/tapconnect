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
import { ArrowUpDown, ChevronDown, Plus, Trash, Search } from "lucide-react"

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
}

export function DepartmentDataTable({ slug }: { slug: string }) {
  const [data, setData] = React.useState<Department[]>([])
  const [orgId, setOrgId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  React.useEffect(() => {
    async function fetchOrgAndData() {
      // 1. Get Org ID
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()
      
      if (orgData) {
        setOrgId(orgData.id)
        
        // 2. Fetch Departments
        const { data: deptData } = await supabase
          .from('departments')
          .select('*')
          .eq('org_id', orgData.id)
          .order('name', { ascending: true })
          
        if (deptData) setData(deptData)
        
        // 3. Subscription
        const channel = supabase.channel('departments_changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'tapconnect', table: 'departments', filter: `org_id=eq.${orgData.id}` },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setData((prev) => [...prev, payload.new as Department])
              } else if (payload.eventType === 'UPDATE') {
                setData((prev) => prev.map(d => d.id === payload.new.id ? payload.new as Department : d))
              } else if (payload.eventType === 'DELETE') {
                setData((prev) => prev.filter(d => d.id !== payload.old.id))
              }
            }
          )
          .subscribe()
          
        setLoading(false)
        return () => {
          supabase.removeChannel(channel)
        }
      }
      setLoading(false)
    }
    fetchOrgAndData()
  }, [slug])

  const handleDelete = async (ids: string[]) => {
      await supabase.from('departments').delete().in('id', ids)
      setRowSelection({})
  }

  const columns: ColumnDef<Department>[] = [
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
            Department Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium p-4">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div className="max-w-[500px] truncate text-muted-foreground">{row.getValue("description")}</div>,
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
            <Button>
                <Plus className="w-4 h-4 mr-2" /> Add Department
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
