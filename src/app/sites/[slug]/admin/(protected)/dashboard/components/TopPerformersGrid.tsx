"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { exportToCsv } from '@/lib/utils'

interface TopPerformersGridProps {
  data: any[]
}

export default function TopPerformersGrid({ data }: TopPerformersGridProps) {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)
  
  const itemsPerPage = 5

  // Filter
  const filteredData = data.filter(emp => 
    (emp.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (emp.designation || '').toLowerCase().includes(search.toLowerCase())
  )

  // Sort
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  // Paginate
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleExport = () => {
    exportToCsv('top-performers.csv', sortedData.map(d => ({
        Name: d.name,
        Designation: d.designation,
        Taps: d.taps
    })))
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="bg-white dark:bg-[#1c1e21] rounded-[2rem] border border-black/[0.03] dark:border-white/[0.05] flex flex-col overflow-hidden">
      <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.03] dark:border-white/[0.05]">
        <h3 className="text-xl font-black text-foreground tracking-tight uppercase">Top Performing Employees</h3>
        
        <div className="flex items-center gap-3">
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                <input 
                    type="text" 
                    placeholder="Search employees..." 
                    className="pl-9 pr-4 py-2 bg-[#f5f5f7] dark:bg-[#252528] border-transparent dark:border-white/10 rounded-xl text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-foreground transition-all"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setCurrentPage(1)
                    }}
                />
            </div>
            
            <button 
                onClick={handleExport}
                className="flex items-center justify-center p-2.5 bg-[#f5f5f7] dark:bg-[#252528] rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-secondary hover:text-foreground"
                title="Export to CSV"
            >
                <Download className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b border-black/[0.03] dark:border-white/[0.05] bg-black/[0.01] dark:bg-white/[0.01]">
                    <th className="p-4 pl-6 md:pl-8 text-[10px] font-black uppercase tracking-widest text-secondary cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('name')}>
                        Employee {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-secondary cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('designation')}>
                        Department {sortConfig?.key === 'designation' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-4 pr-6 md:pr-8 text-right text-[10px] font-black uppercase tracking-widest text-secondary cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('taps')}>
                        Taps {sortConfig?.key === 'taps' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                </tr>
            </thead>
            <tbody>
                {paginatedData.length === 0 ? (
                    <tr>
                        <td colSpan={3} className="p-8 text-center text-secondary text-sm font-medium">No employees found.</td>
                    </tr>
                ) : (
                    paginatedData.map((emp, i) => (
                        <motion.tr 
                            key={emp.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="border-b border-black/[0.03] dark:border-white/[0.02] last:border-0 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
                        >
                            <td className="p-4 pl-6 md:pl-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground flex items-center justify-center font-black text-sm">
                                        {getInitials(emp.name)}
                                    </div>
                                    <div className="font-bold text-foreground">{emp.name}</div>
                                </div>
                            </td>
                            <td className="p-4 text-secondary font-medium text-sm">
                                {emp.designation || 'Unassigned'}
                            </td>
                            <td className="p-4 pr-6 md:pr-8 text-right">
                                <div className="flex items-center justify-end gap-3">
                                    <span className="font-black text-foreground">{emp.taps} taps</span>
                                    {i < 3 && currentPage === 1 && !search && sortConfig?.key === 'taps' && sortConfig?.direction === 'desc' && (
                                        <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 text-[10px] font-black uppercase tracking-widest rounded-md">Top</span>
                                    )}
                                </div>
                            </td>
                        </motion.tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 md:p-6 border-t border-black/[0.03] dark:border-white/[0.05] flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
            <span className="text-xs font-bold text-secondary">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length}
            </span>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-white dark:bg-[#252528] border border-black/[0.05] dark:border-white/[0.05] text-foreground hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                        // Simple logic to show a few pages around current
                        let pageNum = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                            pageNum = currentPage - 2 + i;
                        }
                        if (pageNum > totalPages) return null;
                        
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                                    currentPage === pageNum 
                                    ? 'bg-primary text-white' 
                                    : 'text-secondary hover:bg-black/5 dark:hover:bg-white/10'
                                }`}
                            >
                                {pageNum}
                            </button>
                        )
                    })}
                </div>
                <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg bg-white dark:bg-[#252528] border border-black/[0.05] dark:border-white/[0.05] text-foreground hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
      )}
    </div>
  )
}
