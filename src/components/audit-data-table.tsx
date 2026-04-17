"use client"

import * as React from "react"
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table"
import { motion, AnimatePresence } from "framer-motion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { History, LayoutTemplate, Palette, PlusCircle, ShieldCheck, CreditCard, Ticket, ArrowUpDown, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Animated Search Box ──────────────────────────────────────────────────────
function AnimatedSearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = React.useState(false)
  const placeholders = ["Search by Action...", "Search by User...", "Search by Date..."]
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

const getTypeIconAndColor = (type: string) => {
    switch(type) {
        case 'system': return { icon: ShieldCheck, color: "text-amber-600 dark:text-amber-500", bg: "bg-amber-500/10" }
        case 'employee': return { icon: PlusCircle, color: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-500/10" }
        case 'appearance': return { icon: Palette, color: "text-purple-600 dark:text-purple-500", bg: "bg-purple-500/10" }
        case 'billing': return { icon: CreditCard, color: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-500/10" }
        case 'support': return { icon: Ticket, color: "text-indigo-600 dark:text-indigo-500", bg: "bg-indigo-500/10" }
        case 'card': return { icon: LayoutTemplate, color: "text-rose-600 dark:text-rose-500", bg: "bg-rose-500/10" }
        default: return { icon: History, color: "text-primary", bg: "bg-primary/10" }
    }
}

export const auditColumns: ColumnDef<any>[] = [
  {
    accessorKey: "type",
    header: "Event Category",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
          <Badge 
              variant="outline" 
              className={cn(
                  "text-[9px] font-black uppercase tracking-widest py-0.5",
                  type === 'system' ? 'bg-amber-500/5 text-amber-600 border-amber-500/20' : 
                  type === 'billing' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : 
                  'bg-primary/5 text-primary border-primary/20'
              )}
          >
              {type}
          </Badge>
      )
    },
  },
  {
    accessorKey: "action",
    header: "Description",
    cell: ({ row }) => {
      const type = row.original.type as string;
      const { icon: Icon, color, bg } = getTypeIconAndColor(type)
      
      return (
        <div className="flex items-center gap-3 py-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", bg)}>
            <Icon className={cn("w-4 h-4", color)} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-foreground/90">{row.getValue("action")}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "user",
    header: "Administrator",
    cell: ({ row }) => {
        return (
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-muted border flex items-center justify-center text-[10px] font-black">{((row.getValue("user") as string) || "A")[0]}</div>
                <span className="text-xs font-bold">{row.getValue("user")}</span>
            </div>
        )
    },
  },
  {
    accessorKey: "date",
    header: () => <div className="text-right">Timestamp</div>,
    cell: ({ row }) => <div className="text-right text-xs font-bold text-muted-foreground/60 italic hover:text-primary transition-colors cursor-default">{row.getValue("date")}</div>,
  },
]

interface AuditDataTableProps<TData, TValue> {
  data: TData[]
}

export function AuditDataTable<TData, TValue>({
  data,
}: AuditDataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns: auditColumns as any,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Ensure consistent page size out of the box
  React.useEffect(() => {
    table.setPageSize(5)
  }, [table])

  return (
    <div className="w-full">
      {/* ── Toolbar ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <AnimatedSearchBox
            value={(table.getColumn("action")?.getFilterValue() as string) ?? ""}
            onChange={(v) => table.getColumn("action")?.setFilterValue(v)}
          />
        </div>
      </div>

      {/* ── Table ── */}
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
                  <TableCell colSpan={auditColumns.length} className="h-24 text-center text-muted-foreground">
                    No logs found.
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
            Total Logs: {table.getFilteredRowModel().rows.length}
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
