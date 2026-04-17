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
import { ArrowUpDown, Download, Trash2, Search, FileText } from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// ─── Animated Search Box (same as employee datatable) ────────────────────────
function AnimatedSearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = React.useState(false)
  const placeholders = ["Search by Invoice #...", "Search by Plan...", "Search by Date..."]
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
        {!focused && !value && (
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

// ─── Fallback data (shown when no real invoices exist) ────────────────────────
const FALLBACK_INVOICES = [
  { id: "1", invoice_number: "INV-2026-SETUP", period_end: "2026-03-10", plan: "basic", payment_method: "Mastercard •••• 4242", status: "paid" },
  { id: "2", invoice_number: "INV-2026-0012", period_end: "2026-03-31", plan: "basic", payment_method: "Visa •••• 1234", status: "paid" },
  { id: "3", invoice_number: "INV-2026-0010", period_end: "2026-02-28", plan: "basic", payment_method: "Mastercard •••• 4242", status: "pending" },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export function BillingDataTable({ 
  data, 
  onDelete, 
  onStatusChange 
}: { 
  data: any[], 
  onDelete?: (id: string) => void,
  onStatusChange?: (id: string, currentStatus: string) => void
}) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const safeData = data && data.length > 0 ? data : FALLBACK_INVOICES

  // Define columns inside component to access onDelete and onStatusChange
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "invoice_number",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Invoice
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{row.getValue("invoice_number")}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "period_end",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Billing Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const dateVal = row.getValue("period_end") as string
        return <div className="text-muted-foreground">{dateVal ? format(new Date(dateVal), "MMM d, yyyy") : "—"}</div>
      },
    },
    {
      accessorKey: "plan",
      header: "Plan",
      cell: ({ row }) => {
        const plan = (row.getValue("plan") as string) || "basic"
        return (
          <div className="flex items-center gap-2 border border-border/60 bg-background w-fit px-2.5 py-1 rounded-[6px] shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-xs font-semibold tracking-tight capitalize">{plan}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "payment_method",
      header: "Payment Method",
      cell: ({ row }) => <div>{(row.getValue("payment_method") as string) || "—"}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const id = row.original.id
        
        const badge = (() => {
          if (status === "paid") return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 cursor-pointer">Paid</Badge>
          if (status === "pending") return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20 cursor-pointer">Pending</Badge>
          if (status === "overdue") return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20 cursor-pointer">Overdue</Badge>
          return <Badge variant="outline" className="cursor-pointer">{status || "—"}</Badge>
        })()

        return (
          <div onClick={(e) => {
            e.stopPropagation();
            onStatusChange?.(id, status);
          }}>
            {badge}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Download Invoice"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete Invoice"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(row.original.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: safeData,
    columns: columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="w-full">
      {/* ── Toolbar ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <AnimatedSearchBox
            value={(table.getColumn("invoice_number")?.getFilterValue() as string) ?? ""}
            onChange={(v) => table.getColumn("invoice_number")?.setFilterValue(v)}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* no global actions */}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No invoices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination footer ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Total Invoices: {table.getFilteredRowModel().rows.length}
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
