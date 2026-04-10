import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function exportToCsv(filename: string, rows: object[]) {
    if (!rows || rows.length === 0) return
    const keys = Object.keys(rows[0])
    let csvContent = "data:text/csv;charset=utf-8," 
        + keys.join(",") + "\n"
        + rows.map(row => keys.map(k => (row as any)[k]).join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
