import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })
  
  const url = new URL(request.url)
  
  return NextResponse.json({
    url: request.url,
    hostname: url.hostname,
    host_header: headers['host'],
    x_forwarded_host: headers['x-forwarded-host'],
    x_forwarded_for: headers['x-forwarded-for'],
    all_headers: headers,
  })
}
