"use client"

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Upload, Loader2, Music, Image as ImageIcon } from 'lucide-react'
import { useToast } from './ui/use-toast'

interface UploadStatus {
    status: 'idle' | 'uploading' | 'completed' | 'error'
    progress: number
    musicUrl?: string
    coverUrl?: string
    metadataUri?: string
    folderCid?: string
    gatewayUrl?: string
    tokenURIGateway?: string
    error?: string
}

export function UploadMusicForm() {
    const [musicFile, setMusicFile] = useState<File | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [musicName, setMusicName] = useState('')
    const [artist, setArtist] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState<UploadStatus>({
        status: 'idle',
        progress: 0,
    })
    const { toast } = useToast()

    const handleUpload = async () => {
        if (!musicFile) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng chọn file nhạc',
                variant: 'destructive',
            })
            return
        }

        if (!coverFile) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng chọn ảnh cover',
                variant: 'destructive',
            })
            return
        }

        if (!musicName.trim()) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng nhập tên bài nhạc',
                variant: 'destructive',
            })
            return
        }

        try {
            setStatus({ status: 'uploading', progress: 10 })

            // Create FormData
            const formData = new FormData()
            formData.append('track', musicFile)
            formData.append('cover', coverFile)
            formData.append('name', musicName.trim())  // Custom music name
            formData.append('prompt', description.trim() || musicName.trim())  // Description for NFT
            formData.append('username', artist.trim() || 'Unknown Artist')  // Artist name

            setStatus({ status: 'uploading', progress: 30 })

            // Upload to IPFS backend
            const IPFS_API_URL = process.env.IPFS_API_URL || 'http://localhost:3001'
            const response = await fetch(`${IPFS_API_URL}/upload`, {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to upload to IPFS')
            }

            setStatus({ status: 'uploading', progress: 80 })

            const data = await response.json()

            // Debug: log the response to see what fields we're getting
            console.log('Backend response:', data)

            // Helper function to convert ipfs:// to local proxy URL
            // This bypasses CORS issues by proxying through our Next.js API
            const ipfsToGateway = (ipfsUrl: string) => {
                if (!ipfsUrl) return ''
                if (ipfsUrl.startsWith('ipfs://')) {
                    // Extract CID and path from ipfs://CID/path
                    const ipfsPath = ipfsUrl.replace('ipfs://', '')
                    const [cid, ...pathParts] = ipfsPath.split('/')
                    const path = pathParts.join('/')

                    // Use our local proxy API
                    return `/api/ipfs-proxy?cid=${cid}${path ? `&path=${encodeURIComponent(path)}` : ''}`
                }
                return ipfsUrl
            }

            setStatus({
                status: 'completed',
                progress: 100,
                musicUrl: ipfsToGateway(data.trackUrl),
                coverUrl: ipfsToGateway(data.coverUrl),
                metadataUri: data.tokenURI,
                folderCid: data.folderCid,
                gatewayUrl: data.gatewayUrl,
                tokenURIGateway: data.tokenURIGateway,
            })

            // Save to localStorage for mint page
            localStorage.setItem('pendingMint', JSON.stringify({
                musicUrl: ipfsToGateway(data.trackUrl),
                coverUrl: ipfsToGateway(data.coverUrl),
                metadataUri: data.tokenURI,
                name: musicName.trim(),
                artist: artist.trim() || 'Unknown Artist',
            }))

            toast({
                title: 'Thành công!',
                description: 'File đã được upload lên IPFS',
            })
        } catch (error: any) {
            console.error('Error uploading to IPFS:', error)
            setStatus({
                status: 'error',
                progress: 0,
                error: error.message || 'Có lỗi xảy ra khi upload',
            })
            toast({
                title: 'Lỗi',
                description: error.message || 'Có lỗi xảy ra khi upload',
                variant: 'destructive',
            })
        }
    }

    const handleReset = () => {
        setMusicFile(null)
        setCoverFile(null)
        setMusicName('')
        setArtist('')
        setDescription('')
        setStatus({
            status: 'idle',
            progress: 0,
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload File Nhạc</CardTitle>
                <CardDescription>
                    Upload file nhạc và ảnh cover có sẵn lên IPFS để tạo NFT
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Music File Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        File nhạc (.wav, .mp3, .ogg)
                    </label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="file"
                            accept=".wav,.mp3,.ogg,audio/wav,audio/mpeg,audio/ogg"
                            onChange={(e) => setMusicFile(e.target.files?.[0] || null)}
                            disabled={status.status === 'uploading'}
                        />
                        {musicFile && (
                            <span className="text-sm text-green-600">✓ {musicFile.name}</span>
                        )}
                    </div>
                </div>

                {/* Cover Image Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Ảnh cover (.png, .jpg)
                    </label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="file"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                            disabled={status.status === 'uploading'}
                        />
                        {coverFile && (
                            <span className="text-sm text-green-600">✓ {coverFile.name}</span>
                        )}
                    </div>
                </div>

                {/* Metadata Fields */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Tên bài nhạc <span className="text-red-500">*</span>
                    </label>
                    <Input
                        placeholder="Ví dụ: Sunset Dreams"
                        value={musicName}
                        onChange={(e) => setMusicName(e.target.value)}
                        disabled={status.status === 'uploading'}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Nghệ sĩ (tùy chọn)</label>
                    <Input
                        placeholder="Ví dụ: John Doe"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        disabled={status.status === 'uploading'}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Mô tả (tùy chọn)</label>
                    <Textarea
                        placeholder="Mô tả về bài nhạc..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        disabled={status.status === 'uploading'}
                    />
                </div>

                {/* Progress */}
                {status.status !== 'idle' && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span>
                                {status.status === 'uploading' && 'Đang upload lên IPFS...'}
                                {status.status === 'completed' && 'Hoàn thành!'}
                                {status.status === 'error' && 'Có lỗi xảy ra'}
                            </span>
                            <span>{status.progress}%</span>
                        </div>
                        <Progress value={status.progress} />
                    </div>
                )}

                {/* Results */}
                {status.status === 'completed' && (
                    <>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            {status.coverUrl && (
                                <img
                                    src={status.coverUrl}
                                    alt="Cover"
                                    className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                                    onError={(e) => {
                                        console.error('Image failed to load:', status.coverUrl)
                                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%23ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">No Image</text></svg>'
                                    }}
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                {status.musicUrl ? (
                                    <>
                                        {/* <p className="text-xs text-gray-500 mb-1 truncate">
                                            {status.musicUrl}
                                        </p> */}
                                        <audio
                                            controls
                                            className="w-full"
                                            onError={(e) => {
                                                console.error('Audio failed to load:', status.musicUrl)
                                                console.error('Audio error:', e.currentTarget.error)
                                            }}
                                        >
                                            <source src={status.musicUrl} type="audio/mpeg" />
                                            <source src={status.musicUrl} type="audio/wav" />
                                            <source src={status.musicUrl} type="audio/ogg" />
                                            Trình duyệt của bạn không hỗ trợ audio.
                                        </audio>
                                    </>
                                ) : (
                                    <p className="text-sm text-red-500">Music URL not available</p>
                                )}
                            </div>
                        </div>

                        {/* IPFS Information */}
                        {status.metadataUri && (
                            <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="font-semibold text-blue-900 text-sm">📦 IPFS Information</h4>

                                {status.folderCid && (
                                    <div className="text-xs">
                                        <span className="text-gray-600">Folder CID:</span>
                                        <p className="font-mono text-blue-700 break-all">{status.folderCid}</p>
                                    </div>
                                )}

                                <div className="text-xs">
                                    <span className="text-gray-600">Token URI:</span>
                                    <p className="font-mono text-blue-700 break-all">{status.metadataUri}</p>
                                </div>

                                {status.tokenURIGateway && (
                                    <div className="text-xs">
                                        <a
                                            href={status.tokenURIGateway}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline"
                                        >
                                            🔗 Xem metadata trên IPFS Gateway
                                        </a>
                                    </div>
                                )}

                                {status.gatewayUrl && (
                                    <div className="text-xs">
                                        <a
                                            href={status.gatewayUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline"
                                        >
                                            📁 Xem folder trên IPFS Gateway
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {status.status !== 'completed' && (
                        <Button
                            onClick={handleUpload}
                            disabled={status.status === 'uploading'}
                            className="flex-1"
                        >
                            {status.status === 'uploading' ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang upload...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload lên IPFS
                                </>
                            )}
                        </Button>
                    )}
                    {status.status === 'completed' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                className="flex-1"
                            >
                                Upload file khác
                            </Button>
                            <Button
                                onClick={() => window.location.href = '/mint'}
                            >
                                Mint NFT
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
