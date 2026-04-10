"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

type Employee = {
    id: string
    name: string
    designation: string | null
}

interface LinkProvisionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    orgId: string
    existingLink?: {
        id: string
        platform: string
        label: string | null
        url: string
        is_active: boolean
        assigned_to: string[] | null
    }
    onSuccess: () => void
}

export function LinkProvisionDialog({ open, onOpenChange, orgId, existingLink, onSuccess }: LinkProvisionDialogProps) {
    const [platform, setPlatform] = React.useState('website')
    const [label, setLabel] = React.useState('')
    const [url, setUrl] = React.useState('')

    const [employees, setEmployees] = React.useState<Employee[]>([])
    const [selectedEmployees, setSelectedEmployees] = React.useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = React.useState('')

    const [isLoading, setIsLoading] = React.useState(false)
    const [isFetchingEmployees, setIsFetchingEmployees] = React.useState(false)

    // Fetch employees and initialize selection based on context
    React.useEffect(() => {
        if (!open) return

        setSearchQuery('')

        // Pre-populate form fields for edit
        if (existingLink) {
            setPlatform(existingLink.platform || 'website')
            setLabel(existingLink.label || '')
            setUrl(existingLink.url || '')
        } else {
            setPlatform('website')
            setLabel('')
            setUrl('')
        }

        async function init() {
            setIsFetchingEmployees(true)
            const { data } = await supabase
                .from('employees')
                .select('id, name, designation')
                .eq('org_id', orgId)
                .order('name')

            const list: Employee[] = data || []
            setEmployees(list)

            if (existingLink) {
                // Edit mode: use exactly what's in assigned_to
                // null or empty array → no selection
                // array with IDs → select only those
                const assigned = existingLink.assigned_to
                if (assigned && assigned.length > 0) {
                    setSelectedEmployees(new Set(assigned))
                } else {
                    setSelectedEmployees(new Set())
                }
            } else {
                // Create mode: select ALL employees by default
                setSelectedEmployees(new Set(list.map(e => e.id)))
            }

            setIsFetchingEmployees(false)
        }

        init()
    }, [open, orgId, existingLink])

    const handleSave = async () => {
        if (!url.trim()) return
        setIsLoading(true)

        try {
            const assignedArray = Array.from(selectedEmployees)

            if (existingLink) {
                // UPDATE — only change the editable fields, never touch org_id
                const { error } = await supabase
                    .from('card_links')
                    .update({
                        platform,
                        label: label.trim() || null,
                        url: url.trim(),
                        assigned_to: assignedArray.length > 0 ? assignedArray : null,
                    })
                    .eq('id', existingLink.id)

                if (error) {
                    console.error('Update failed:', error)
                    throw error
                }
            } else {
                // INSERT — always store actual employee IDs (never null)
                const { count } = await supabase
                    .from('card_links')
                    .select('*', { count: 'exact', head: true })
                    .eq('org_id', orgId)

                const { error } = await supabase
                    .from('card_links')
                    .insert({
                        org_id: orgId,
                        platform,
                        label: label.trim() || null,
                        url: url.trim(),
                        is_active: true,
                        display_order: count ?? 0,
                        assigned_to: assignedArray.length > 0 ? assignedArray : null,
                    })

                if (error) {
                    console.error('Insert failed:', error)
                    throw error
                }
            }

            onSuccess()
            onOpenChange(false)
        } catch (err) {
            console.error('Save error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const toggleEmployee = (id: string) => {
        setSelectedEmployees(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        if (selectedEmployees.size === employees.length) {
            setSelectedEmployees(new Set())
        } else {
            setSelectedEmployees(new Set(employees.map(e => e.id)))
        }
    }

    const allSelected = employees.length > 0 && selectedEmployees.size === employees.length

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[760px] !w-[760px] p-0 overflow-hidden bg-background">
                <div className="flex h-[560px]">
                    {/* ── Left: Form ── */}
                    <div className="w-[340px] shrink-0 flex flex-col border-r border-border/50 bg-card overflow-hidden">
                        <div className="px-6 pt-5 pb-3 pr-12 border-b border-border/30">
                            <DialogHeader>
                                <DialogTitle className="text-base font-semibold">
                                    {existingLink ? 'Edit Link' : 'Provision Action Link'}
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-xs">
                                    Bind an endpoint to your NFC fleet.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Platform / Type
                                </label>
                                <Select value={platform} onValueChange={setPlatform}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select platform" />
                                    </SelectTrigger>
                                    <SelectContent side="bottom" sideOffset={4}>
                                        <SelectItem value="website" className="py-2.5">Website</SelectItem>
                                        <SelectItem value="whatsapp" className="py-2.5">WhatsApp</SelectItem>
                                        <SelectItem value="linkedin" className="py-2.5">LinkedIn</SelectItem>
                                        <SelectItem value="instagram" className="py-2.5">Instagram</SelectItem>
                                        <SelectItem value="twitter" className="py-2.5">X / Twitter</SelectItem>
                                        <SelectItem value="calendly" className="py-2.5">Calendly</SelectItem>
                                        <SelectItem value="vcard" className="py-2.5">Dynamic vCard</SelectItem>
                                        <SelectItem value="form" className="py-2.5">Lead Form</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Label <span className="normal-case font-normal">(Optional)</span>
                                </label>
                                <Input
                                    placeholder="e.g. Schedule a Demo"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Target URL <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    placeholder="https://..."
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    className={!url.trim() && isLoading ? 'border-destructive' : ''}
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-border/50 bg-muted/10 flex items-center gap-2">
                            <Button
                                onClick={handleSave}
                                disabled={isLoading || !url.trim()}
                                className="flex-1"
                            >
                                {isLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                                {existingLink ? 'Save Changes' : 'Add Link'}
                            </Button>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>

                    {/* ── Right: Assignment ── */}
                    <div className="flex-1 flex flex-col bg-muted/20 relative min-w-0">
                        {/* Header */}
                        <div className="px-4 pt-5 pb-3 border-b border-border/50">
                            <div className="flex items-center justify-between pr-2 mb-3">
                                <h3 className="font-semibold text-sm">Assign to Directory</h3>
                                {isFetchingEmployees ? (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Loading
                                    </span>
                                ) : (
                                    <div className="flex flex-col items-end leading-none">
                                        <span className="text-xs font-semibold text-blue-500 dark:text-blue-400">
                                            {selectedEmployees.size}
                                            <span className="text-muted-foreground font-medium text-[10px]"> / {employees.length}</span>
                                        </span>
                                        <span className="text-[10px] uppercase font-bold text-blue-500/70 mt-0.5">Selected</span>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search employees..."
                                    className="pl-8 h-8 text-xs bg-background"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Select All */}
                        <div className="flex px-4 py-2.5 bg-muted/40 border-b border-border/50 items-center justify-between">
                            <span className="text-xs text-muted-foreground font-medium">Select All</span>
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={toggleAll}
                            />
                        </div>

                        {/* Employee List */}
                        <div className="flex-1 overflow-y-auto">
                            {isFetchingEmployees ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading employees...
                                </div>
                            ) : filteredEmployees.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                    No employees found.
                                </div>
                            ) : (
                                <div className="p-3 space-y-1">
                                    {filteredEmployees.map(emp => (
                                        <div
                                            key={emp.id}
                                            className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-background/80 transition-colors cursor-pointer"
                                            onClick={() => toggleEmployee(emp.id)}
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium truncate">{emp.name}</span>
                                                {emp.designation && (
                                                    <span className="text-xs text-muted-foreground truncate">{emp.designation}</span>
                                                )}
                                            </div>
                                            <Checkbox
                                                checked={selectedEmployees.has(emp.id)}
                                                onCheckedChange={() => toggleEmployee(emp.id)}
                                                onClick={e => e.stopPropagation()}
                                                className="shrink-0 ml-3"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
