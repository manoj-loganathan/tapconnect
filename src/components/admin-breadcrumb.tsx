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

export function AdminBreadcrumb() {
  const pathname = usePathname()
  
  const segments = pathname.split('/').filter(Boolean)
  const adminIndex = segments.indexOf('admin')
  const relevantSegments = adminIndex !== -1 ? segments.slice(adminIndex + 1) : []

  if (relevantSegments.length === 0) return null

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        {relevantSegments.map((segment, index) => {
          const isLast = index === relevantSegments.length - 1
          let formatted = segment.charAt(0).toUpperCase() + segment.slice(1)
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
              formatted = "Profile"
          }
          
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
