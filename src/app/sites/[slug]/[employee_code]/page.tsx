import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProfileClient from './components/ProfileClient'

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
      .select('*, card_links(*)')
      .eq('org_id', org.id)
      .eq('id', employee_code)
      .single()
    employee = data
  }

  // Fallback: try by employee_code
  if (!employee) {
    const { data } = await supabase
      .from('employees')
      .select('*, card_links(*)')
      .eq('org_id', org.id)
      .eq('employee_code', employee_code)
      .single()
    employee = data
  }

  if (!employee || !employee.is_active) {
    return notFound()
  }

  // Sort links by display_order
  const sortedLinks = (employee.card_links || [])
    .filter((l: any) => l.is_active)
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start overflow-x-hidden">
      <ProfileClient
        employee={employee}
        org={org}
        links={sortedLinks}
      />
    </div>
  )
}
