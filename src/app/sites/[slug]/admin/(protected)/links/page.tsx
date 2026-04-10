"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Link as LinkIcon, Plus, GripVertical, Edit, Trash, ExternalLink, Globe, Contact, FileText, Loader2 } from 'lucide-react'
import { Reorder } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { LinkProvisionDialog } from "@/components/link-provision-dialog"

type CardLink = {
    id: string
    org_id: string
    platform: string
    label: string | null
    url: string
    is_active: boolean
    display_order: number
    assigned_to: string[] | null
    created_at: string
}

export default function ManageLinksPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = React.use(params)
    const slug = resolvedParams.slug

    const [links, setLinks] = React.useState<CardLink[]>([])
    const [orgId, setOrgId] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [deletingId, setDeletingId] = React.useState<string | null>(null)

    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [editingLink, setEditingLink] = React.useState<CardLink | undefined>()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const { data: orgData } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', slug)
            .single()

        if (orgData) {
            setOrgId(orgData.id)
            const { data } = await supabase
                .from('card_links')
                .select('*')
                .eq('org_id', orgData.id)
                .order('display_order', { ascending: true })
            if (data) setLinks(data)
        }
        setLoading(false)
    }, [slug])

    // Initial data load
    React.useEffect(() => { fetchData() }, [fetchData])

    // Supabase Realtime — patch local state on INSERT / UPDATE / DELETE
    React.useEffect(() => {
        if (!orgId) return

        const channel = supabase
            .channel(`card_links:${orgId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'tapconnect',
                    table: 'card_links',
                    filter: `org_id=eq.${orgId}`,
                },
                (payload) => {
                    const newLink = payload.new as CardLink
                    setLinks(prev => {
                        // avoid duplicate if optimistic insert already added it
                        if (prev.some(l => l.id === newLink.id)) return prev
                        return [...prev, newLink].sort((a, b) => a.display_order - b.display_order)
                    })
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'tapconnect',
                    table: 'card_links',
                    filter: `org_id=eq.${orgId}`,
                },
                (payload) => {
                    const updated = payload.new as CardLink
                    setLinks(prev =>
                        prev
                            .map(l => l.id === updated.id ? updated : l)
                            .sort((a, b) => a.display_order - b.display_order)
                    )
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'tapconnect',
                    table: 'card_links',
                    filter: `org_id=eq.${orgId}`,
                },
                (payload) => {
                    const deletedId = payload.old?.id
                    if (deletedId) {
                        setLinks(prev => prev.filter(l => l.id !== deletedId))
                    }
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [orgId])

    // Optimistic reorder + batch persist
    const handleReorder = async (newOrder: CardLink[]) => {
        setLinks(newOrder)
        try {
            await Promise.all(
                newOrder.map((link, index) =>
                    supabase
                        .from('card_links')
                        .update({ display_order: index })
                        .eq('id', link.id)
                )
            )
        } catch (err) {
            console.error('Failed to update display order:', err)
        }
    }

    // Toggle active / hidden
    const toggleStatus = async (id: string, currentStatus: boolean) => {
        const newStatus = !currentStatus
        setLinks(prev => prev.map(l => l.id === id ? { ...l, is_active: newStatus } : l))
        const { error } = await supabase
            .from('card_links')
            .update({ is_active: newStatus })
            .eq('id', id)
        if (error) {
            // Rollback on failure
            setLinks(prev => prev.map(l => l.id === id ? { ...l, is_active: currentStatus } : l))
        }
    }

    // Delete with optimistic removal
    const handleDelete = async (id: string) => {
        setDeletingId(id)
        setLinks(prev => prev.filter(l => l.id !== id))
        const { error } = await supabase.from('card_links').delete().eq('id', id)
        if (error) {
            console.error('Delete failed:', error)
            fetchData() // re-fetch on error to restore state
        }
        setDeletingId(null)
    }

    // Platform icons — inline SVG brand icons
    const getPlatformIcon = (platform: string) => {
        let p = (platform || '').toLowerCase().trim()
        if (p.includes('linkedin')) p = 'linkedin'
        else if (p.includes('whatsapp') || p.includes('wa.me')) p = 'whatsapp'
        else if (p.includes('insta')) p = 'instagram'
        else if (p.includes('twitter') || p === 'x') p = 'twitter'
        else if (p.includes('calendly')) p = 'calendly'

        const cls = "w-[18px] h-[18px] opacity-60"

        if (p === 'linkedin') return (
            <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        )
        if (p === 'whatsapp') return (
            <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
        )
        if (p === 'instagram') return (
            <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            </svg>
        )
        if (p === 'twitter') return (
            <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
            </svg>
        )
        if (p === 'calendly') return (
            <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5C3.9 4 3 4.9 3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zm0-13H5V6h14v1z" />
            </svg>
        )

        const fallbackCls = "w-[18px] h-[18px] text-muted-foreground opacity-70"
        switch (p) {
            case 'website': return <Globe className={fallbackCls} />
            case 'vcard': return <Contact className={fallbackCls} />
            case 'form': return <FileText className={fallbackCls} />
            default: return <LinkIcon className={fallbackCls} />
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <LinkIcon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manage Links</h1>
                        <p className="text-sm text-muted-foreground">Configure social, internal, and dynamic vCard assets.</p>
                    </div>
                </div>
                <Button onClick={() => { setEditingLink(undefined); setDialogOpen(true) }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Link
                </Button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Empty state */}
            {!loading && links.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[50vh] border border-dashed rounded-xl bg-muted/10">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <LinkIcon className="w-8 h-8 text-muted-foreground opacity-50" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Links Configured</h3>
                    <p className="text-muted-foreground text-sm max-w-[400px] text-center mb-6">
                        Create digital endpoints to bind to your NFC hardware.
                    </p>
                    <Button onClick={() => { setEditingLink(undefined); setDialogOpen(true) }}>
                        <Plus className="w-4 h-4 mr-2" /> Create First Link
                    </Button>
                </div>
            )}

            {/* Link list */}
            {!loading && links.length > 0 && (
                <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 flex items-center justify-between border-b bg-muted/20">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">Display Order</span>
                            <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                                {links.length} {links.length === 1 ? 'Link' : 'Links'}
                            </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground hidden sm:block">
                            Drag to reorder · Changes save instantly
                        </span>
                    </div>

                    <div className="p-4">
                        <Reorder.Group axis="y" values={links} onReorder={handleReorder} className="space-y-2">
                            {links.map(link => (
                                <Reorder.Item
                                    key={link.id}
                                    value={link}
                                    className="group flex items-center bg-background border rounded-lg px-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors min-h-[68px]"
                                >
                                    {/* Drag handle + Icon */}
                                    <div className="flex items-center gap-3 mr-4 shrink-0">
                                        <GripVertical className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                                        <div className="flex items-center justify-center w-8 h-8">
                                            {getPlatformIcon(link.platform)}
                                        </div>
                                    </div>

                                    {/* Label + URL */}
                                    <div className="flex flex-col min-w-0 flex-1 py-3">
                                        <span className="font-semibold text-sm truncate capitalize leading-none mb-1">
                                            {link.label || link.platform}
                                        </span>
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-muted-foreground truncate hover:text-primary transition-colors flex items-center leading-none"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {link.url}
                                            <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-40 shrink-0" />
                                        </a>
                                    </div>

                                    {/* Right controls */}
                                    <div className="flex items-center gap-3 shrink-0 ml-4" onClick={e => e.stopPropagation()}>
                                        {/* Active toggle */}
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[11px] font-semibold uppercase tracking-wider w-[46px] text-right tabular-nums ${link.is_active ? 'text-emerald-500' : 'text-muted-foreground/50'}`}>
                                                {link.is_active ? 'Active' : 'Hidden'}
                                            </span>
                                            <Switch
                                                checked={link.is_active}
                                                onCheckedChange={() => toggleStatus(link.id, link.is_active)}
                                                className="data-[state=checked]:bg-emerald-500"
                                            />
                                        </div>

                                        <div className="w-px h-5 bg-border" />

                                        {/* Edit */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-8 h-8 opacity-40 hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all"
                                            onClick={() => { setEditingLink(link); setDialogOpen(true) }}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>

                                        {/* Delete */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-8 h-8 opacity-40 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                                            onClick={() => handleDelete(link.id)}
                                            disabled={deletingId === link.id}
                                        >
                                            {deletingId === link.id
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Trash className="w-4 h-4" />
                                            }
                                        </Button>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>
                </div>
            )}

            {/* Provision / Edit dialog */}
            {orgId && (
                <LinkProvisionDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    orgId={orgId}
                    existingLink={editingLink}
                    onSuccess={() => setDialogOpen(false)}
                />
            )}
        </div>
    )
}
