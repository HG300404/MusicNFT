import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const cid = searchParams.get('cid')
        const path = searchParams.get('path') || ''

        if (!cid) {
            return NextResponse.json({ error: 'CID is required' }, { status: 400 })
        }

        // Try multiple gateways for redundancy
        const gateways = [
            'https://ipfs.io/ipfs/',
            'https://dweb.link/ipfs/',
            'https://cloudflare-ipfs.com/ipfs/',
        ]

        let lastError: Error | null = null

        for (const gateway of gateways) {
            try {
                const ipfsUrl = `${gateway}${cid}${path ? '/' + path : ''}`
                console.log(`Trying gateway: ${ipfsUrl}`)

                const response = await fetch(ipfsUrl, {
                    headers: {
                        'Accept': '*/*',
                    },
                })

                if (!response.ok) {
                    throw new Error(`Gateway returned ${response.status}`)
                }

                // Get the content type from IPFS response
                const contentType = response.headers.get('content-type') || 'application/octet-stream'
                const buffer = await response.arrayBuffer()

                // Return the proxied content with proper headers
                return new NextResponse(buffer, {
                    headers: {
                        'Content-Type': contentType,
                        'Cache-Control': 'public, max-age=31536000, immutable',
                        'Access-Control-Allow-Origin': '*',
                    },
                })
            } catch (error) {
                console.error(`Gateway ${gateway} failed:`, error)
                lastError = error as Error
                continue
            }
        }

        // All gateways failed
        throw lastError || new Error('All IPFS gateways failed')

    } catch (error) {
        console.error('IPFS proxy error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch from IPFS' },
            { status: 500 }
        )
    }
}
