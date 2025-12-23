import { NextRequest, NextResponse } from 'next/server'

// IPFS Backend API URL
const IPFS_API_URL = process.env.NEXT_PUBLIC_IPFS_API_URL || 'http://localhost:3000'

/**
 * Download file from URL and return as Blob
 */
async function downloadFile(url: string): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download file from ${url}: ${response.statusText}`)
  }
  return await response.blob()
}

/**
 * Get file extension from URL
 */
function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const parts = pathname.split('.')
    return parts.length > 1 ? parts[parts.length - 1] : ''
  } catch {
    return ''
  }
}

export async function POST(request: NextRequest) {
  try {
    const { musicUrl, coverUrl, prompt } = await request.json()

    if (!musicUrl || !prompt) {
      return NextResponse.json(
        { error: 'Thiếu thông tin cần thiết' },
        { status: 400 }
      )
    }

    // Download files from MusicGen API
    console.log('Downloading files from MusicGen API...')
    const [trackBlob, coverBlob] = await Promise.all([
      downloadFile(musicUrl),
      coverUrl ? downloadFile(coverUrl) : downloadFile(musicUrl.replace('.wav', '.png'))
    ])

    // Get file extensions
    const trackExt = getFileExtension(musicUrl) || 'mp3'
    const coverExt = coverUrl ? getFileExtension(coverUrl) : 'jpg'

    // Create FormData for IPFS upload
    const formData = new FormData()
    formData.append('track', trackBlob, `track.${trackExt}`)
    formData.append('cover', coverBlob, `cover.${coverExt}`)
    formData.append('prompt', prompt)
    formData.append('username', 'AI Composer')

    // Upload to IPFS backend
    console.log('Uploading to IPFS backend...')
    const ipfsResponse = await fetch(`${IPFS_API_URL}/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!ipfsResponse.ok) {
      const errorData = await ipfsResponse.json()
      throw new Error(errorData.message || 'Failed to upload to IPFS')
    }

    const ipfsData = await ipfsResponse.json()
    console.log('IPFS upload successful:', ipfsData.tokenURI)

    // Return IPFS URLs and metadata
    return NextResponse.json({
      success: true,
      musicUrl: ipfsData.trackUrl,
      coverUrl: ipfsData.coverUrl,
      metadataUri: ipfsData.metadataUri || ipfsData.tokenURI, // Read metadataUri first, fallback to tokenURI
      folderCid: ipfsData.folderCid,
      gatewayUrl: ipfsData.gatewayUrl,
      tokenURIGateway: ipfsData.tokenURIGateway,
      metadata: ipfsData.metadata,
    })
  } catch (error: any) {
    console.error('Error uploading to IPFS:', error)

    // Check if IPFS backend is not available
    if (error.message?.includes('fetch') || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        {
          error: 'IPFS backend không khả dụng. Vui lòng khởi động IPFS service tại http://localhost:3000',
          details: error.message
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Có lỗi xảy ra khi upload lên IPFS' },
      { status: 500 }
    )
  }
}

