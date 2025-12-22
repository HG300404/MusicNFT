/**
 * IPFS utility functions for uploading and managing files
 */

export interface IPFSUploadResponse {
    success: boolean
    tokenId: string
    folderName: string
    folderCid: string
    folderUrl: string
    gatewayUrl: string
    metadataUrl: string
    tokenURI: string
    tokenURIGateway: string
    trackUrl: string
    coverUrl: string
    metadata: {
        name: string
        description: string
        image: string
        animation_url: string
        external_url?: string
        attributes: Array<{
            trait_type: string
            value: string
        }>
    }
    files: {
        track: string
        cover: string
        metadata: string
    }
}

/**
 * Download file from URL and return as Blob
 */
export async function downloadFile(url: string): Promise<Blob> {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to download file from ${url}: ${response.statusText}`)
    }
    return await response.blob()
}

/**
 * Get file extension from URL or filename
 */
export function getFileExtension(url: string): string {
    const pathname = new URL(url).pathname
    const parts = pathname.split('.')
    return parts.length > 1 ? parts[parts.length - 1] : ''
}

/**
 * Create FormData for IPFS upload
 */
export function createFormData(
    track: Blob,
    cover: Blob,
    prompt: string,
    username: string,
    trackFilename: string = 'track.mp3',
    coverFilename: string = 'cover.jpg'
): FormData {
    const formData = new FormData()
    formData.append('track', track, trackFilename)
    formData.append('cover', cover, coverFilename)
    formData.append('prompt', prompt)
    formData.append('username', username)
    return formData
}

/**
 * Upload files to IPFS backend
 */
export async function uploadToIPFS(
    musicUrl: string,
    coverUrl: string,
    prompt: string,
    username: string = 'AI Composer'
): Promise<IPFSUploadResponse> {
    const ipfsApiUrl = process.env.IPFS_API_URL || 'http://localhost:3000'

    // Download files from URLs
    const [trackBlob, coverBlob] = await Promise.all([
        downloadFile(musicUrl),
        downloadFile(coverUrl)
    ])

    // Get file extensions
    const trackExt = getFileExtension(musicUrl) || 'mp3'
    const coverExt = getFileExtension(coverUrl) || 'jpg'

    // Create FormData
    const formData = createFormData(
        trackBlob,
        coverBlob,
        prompt,
        username,
        `track.${trackExt}`,
        `cover.${coverExt}`
    )

    // Upload to IPFS backend
    const response = await fetch(`${ipfsApiUrl}/upload`, {
        method: 'POST',
        body: formData,
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to upload to IPFS')
    }

    return await response.json()
}

/**
 * Convert IPFS URL to gateway URL
 */
export function getIPFSGatewayUrl(ipfsUrl: string, gateway: string = 'https://w3s.link'): string {
    if (ipfsUrl.startsWith('ipfs://')) {
        return ipfsUrl.replace('ipfs://', `${gateway}/ipfs/`)
    }
    return ipfsUrl
}

/**
 * Extract CID from IPFS URL
 */
export function extractCID(ipfsUrl: string): string {
    if (ipfsUrl.startsWith('ipfs://')) {
        const parts = ipfsUrl.replace('ipfs://', '').split('/')
        return parts[0]
    }
    return ipfsUrl
}
