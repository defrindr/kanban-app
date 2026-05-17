import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fileUrl = searchParams.get('url')

  if (!fileUrl) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    )
  }

  try {
    // Only allow proxying files from our API server
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    if (!fileUrl.startsWith('/uploads')) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      )
    }

    const fullUrl = `${apiUrl}${fileUrl}`
    const response = await fetch(fullUrl)

    if (!response.ok) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('File proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    )
  }
}
