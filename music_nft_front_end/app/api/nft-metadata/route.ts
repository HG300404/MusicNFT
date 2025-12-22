import { NextRequest, NextResponse } from 'next/server'
import { fetchTokenURI } from '@/lib/contract'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tokenId = searchParams.get('tokenId')

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID là bắt buộc' },
        { status: 400 }
      )
    }

    const metadataUri = await fetchTokenURI(tokenId)

    return NextResponse.json({
      metadataUri,
    })
  } catch (error: any) {
    console.error('Error fetching NFT metadata:', error)
    return NextResponse.json(
      { error: error.message || 'Có lỗi xảy ra khi tải metadata' },
      { status: 500 }
    )
  }
}

