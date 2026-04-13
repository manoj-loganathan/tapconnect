import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProfileClient from './components/ProfileClient'
import DeactivatedView from './components/DeactivatedView'
import { ShieldAlert, Mail } from 'lucide-react'

export default async function EmployeeProfile({
  params,
}: {
  params: { slug: string; employee_code: string }
}) {
  const { slug, employee_code } = await params

  // 1. Fetch Organisation by slug
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, logo_url, brand_color, accent_color, status')
    .eq('slug', slug)
    .single()

  if (!org || (org.status !== 'active' && org.status !== 'setup')) {
    return notFound()
  }

  // 2. Fetch Employee — try by UUID (id) first, then by employee_code
  // This handles URLs like /989ef0d3-c2e9-43f4-8f2b-c5a1d133f81
  let employee: any = null

  // Check if it looks like a UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employee_code)

  if (isUUID) {
    const { data } = await supabase
      .from('employees')
      .select('*, nfc_cards(id, status, is_locked)')
      .eq('org_id', org.id)
      .eq('id', employee_code)
      .single()
    employee = data
  }

  // Fallback: try by employee_code
  if (!employee) {
    const { data } = await supabase
      .from('employees')
      .select('*, nfc_cards(id, status, is_locked)')
      .eq('org_id', org.id)
      .eq('employee_code', employee_code)
      .single()
    employee = data
  }

  if (!employee) {
    return notFound()
  }

  // Check for deactivation
  // DeactivatedView only shows if employee is inactive OR all their cards are specifically 'deactivated'
  const allCardsDeactivated = employee.nfc_cards && employee.nfc_cards.length > 0 
    ? employee.nfc_cards.every((c: any) => c.status === 'deactivated')
    : false

  const isDeactivated = !employee.is_active || allCardsDeactivated

  if (isDeactivated) {
    return <DeactivatedView org={org} />
  }

  // Locked state: If all active cards are locked, or if no active cards exist to unlock it
  const isLocked = employee.nfc_cards && employee.nfc_cards.length > 0
    ? employee.nfc_cards.filter((c: any) => c.status === 'active').every((c: any) => c.is_locked)
    : true // If no cards exist, we treat it as locked/read-only by default for security, or should we? 
           // User says "locked state is for allowing user to edit", 
           // so if no card, they can't "tap to unlock". I'll stick to true.

  const activeCardId = employee.nfc_cards?.find((c: any) => c.status === 'active')?.id || null;

  // 3. Fetch card_links assigned to this employee
  // PostgREST doesn't join arrays automatically, so we fetch links for the org
  // and filter where assigned_to contains employee.id
  const { data: linksData } = await supabase
    .from('card_links')
    .select('*')
    .eq('org_id', org.id)

  const rawLinks = linksData || []
  
  // A link belongs to the employee if assigned_to contains their ID
  const employeeLinks = rawLinks.filter(link => {
    if (!link.assigned_to || link.assigned_to.length === 0) return false
    return link.assigned_to.includes(employee.id)
  })

  // Sort links by display_order
  const sortedLinks = employeeLinks
    .filter((l: any) => l.is_active)
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start overflow-x-hidden">
      <ProfileClient
        employee={employee}
        org={org}
        links={sortedLinks}
        isLocked={isLocked}
        activeCardId={activeCardId}
      />
    </div>
  )
}
