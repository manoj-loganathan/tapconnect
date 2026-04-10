import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  const url = request.nextUrl.clone()

  // request.nextUrl.hostname is fully reliable on Vercel's edge runtime
  const host = request.nextUrl.hostname

  // Root/www domains → serve landing page without rewrite
  if (
    host === 'envitra.in' ||
    host === 'www.envitra.in' ||
    host === 'localhost' ||
    host.endsWith('.vercel.app')
  ) {
    return NextResponse.next()
  }

  // Extract org slug from subdomain
  // appaswamy.envitra.in → slug = "appaswamy"
  let slug: string | null = null

  if (host.endsWith('.envitra.in')) {
    slug = host.replace('.envitra.in', '')
    // Handle www.appaswamy.envitra.in just in case
    if (slug.startsWith('www.')) {
      slug = slug.replace('www.', '')
    }
  }

  if (!slug) {
    return NextResponse.next()
  }

  const pathname = url.pathname

  // Pass API routes through without rewriting
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // appaswamy.envitra.in  →  /sites/appaswamy/admin/dashboard
  if (pathname === '/') {
    url.pathname = `/sites/${slug}/admin/dashboard`
    return NextResponse.rewrite(url)
  }

  // appaswamy.envitra.in/admin/employees  →  /sites/appaswamy/admin/employees
  if (pathname.startsWith('/admin')) {
    url.pathname = `/sites/${slug}${pathname}`
    return NextResponse.rewrite(url)
  }

  // appaswamy.envitra.in/65a7aaf7-...  →  /sites/appaswamy/65a7aaf7-...
  url.pathname = `/sites/${slug}${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/:path*'],
}
