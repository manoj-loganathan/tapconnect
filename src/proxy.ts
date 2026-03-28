import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  const url = request.nextUrl.clone()

  // On Vercel, use x-forwarded-host which carries the actual subdomain
  // Fallback to host header for local dev
  const hostname =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''

  // Strip port number (for local dev: localhost:3000)
  const host = hostname.split(':')[0]

  // Root domains → serve landing page without any rewrite
  const mainDomains = ['envitra.in', 'www.envitra.in', 'localhost']
  if (mainDomains.includes(host) || host.endsWith('.vercel.app')) {
    return NextResponse.next()
  }

  // Extract the org slug from the subdomain
  // e.g. appaswamy.envitra.in → appaswamy
  let slug: string | null = null

  if (host.endsWith('.envitra.in')) {
    slug = host.replace('.envitra.in', '')
  }

  // Safety: skip Vercel internal subdomains
  if (!slug || slug === 'www') {
    return NextResponse.next()
  }

  const pathname = url.pathname

  // appaswamy.envitra.in/   →  /sites/appaswamy/admin/dashboard
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
  matcher: [
    // Run on all paths except Next.js internals & static files
    '/((?!_next/|_vercel/|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|mp4|webm)).*)',
  ],
}
