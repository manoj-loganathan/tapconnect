"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from 'react'
import { supabase } from '@/lib/supabase'

export function AdminBreadcrumb() {
  const pathname = usePathname()
  const [dynamicLabels, setDynamicLabels] = React.useState<Record<string, string>>({})
  
  const segments = pathname.split('/').filter(Boolean)
  const adminIndex = segments.indexOf('admin')
  const relevantSegments = adminIndex !== -1 ? segments.slice(adminIndex + 1) : []

  React.useEffect(() => {
    async function resolveUUIDs() {
        const newLabels: Record<string, string> = {}
        let changed = false

        for (let i = 0; i < relevantSegments.length; i++) {
            const segment = relevantSegments[i]
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
                if (dynamicLabels[segment]) continue

                const prevSegment = i > 0 ? relevantSegments[i-1] : ''
                
                if (prevSegment === 'cards') {
                    const { data } = await supabase.from('nfc_cards').select('card_code').eq('id', segment).single()
                    if (data?.card_code) {
                        newLabels[segment] = data.card_code
                        changed = true
                    }
                } else if (prevSegment === 'employees') {
                    const { data } = await supabase.from('employees').select('name').eq('id', segment).single()
                    if (data?.name) {
                        newLabels[segment] = data.name
                        changed = true
                    }
                }
            }
        }

        if (changed) {
            setDynamicLabels(prev => ({ ...prev, ...newLabels }))
        }
    }
    resolveUUIDs()
  }, [relevantSegments])

  if (relevantSegments.length === 0) return null

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        {relevantSegments.map((segment, index) => {
          const isLast = index === relevantSegments.length - 1
          let formatted = segment.charAt(0).toUpperCase() + segment.slice(1)
          
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
              formatted = dynamicLabels[segment] || "Profile"
          }
          
          if (segment === 'cards') formatted = "NFC Cards"
          
          return (
            <React.Fragment key={segment}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{formatted}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                     <Link href={`/sites/${segments[1]}/admin/${relevantSegments.slice(0, index + 1).join('/')}`} className="hover:text-foreground">
                       {formatted}
                     </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
