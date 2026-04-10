import { redirect } from 'next/navigation'

// appaswamy.envitra.in/ → rewrite handles redirecting to /sites/appaswamy
// Thus we bounce root workspace entries dynamically into their admin dashboards.
export default async function OrgRoot({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  redirect(`/sites/${slug}/admin/dashboard`)
}
