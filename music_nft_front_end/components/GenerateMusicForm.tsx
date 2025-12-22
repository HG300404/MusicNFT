"use client"

import { useState } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Play, Loader2, ExternalLink } from 'lucide-react'
import { useToast } from './ui/use-toast'
import axios from 'axios'

interface GenerationStatus {
  status: 'idle' | 'generating' | 'uploading' | 'completed' | 'error'
  progress: number
  musicUrl?: string
  coverUrl?: string
  metadataUri?: string
  folderCid?: string
  gatewayUrl?: string
  tokenURIGateway?: string
  error?: string
}

export function GenerateMusicForm() {
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<GenerationStatus>({
    status: 'idle',
    progress: 0,
  })
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập prompt để tạo nhạc',
        variant: 'destructive',
      })
      return
    }

    try {
      setStatus({ status: 'generating', progress: 10 })

      // Gọi AI API để tạo nhạc
      const aiResponse = await axios.post('/api/generate-music', {
        prompt: prompt.trim(),
      })

      setStatus({ status: 'uploading', progress: 50 })

      // Upload lên IPFS và tạo metadata
      const ipfsResponse = await axios.post('/api/upload-ipfs', {
        musicUrl: aiResponse.data.musicUrl,
        coverUrl: aiResponse.data.coverUrl,
        prompt: prompt.trim(),
      })

      setStatus({
        status: 'completed',
        progress: 100,
        musicUrl: ipfsResponse.data.musicUrl,
        coverUrl: ipfsResponse.data.coverUrl,
        metadataUri: ipfsResponse.data.metadataUri,
        folderCid: ipfsResponse.data.folderCid,
        gatewayUrl: ipfsResponse.data.gatewayUrl,
        tokenURIGateway: ipfsResponse.data.tokenURIGateway,
      })

      setAudioUrl(ipfsResponse.data.musicUrl)

      // Lưu vào localStorage để dùng ở trang mint
      localStorage.setItem('pendingMint', JSON.stringify({
        musicUrl: ipfsResponse.data.musicUrl,
        coverUrl: ipfsResponse.data.coverUrl,
        metadataUri: ipfsResponse.data.metadataUri,
        prompt: prompt.trim(),
      }))

      toast({
        title: 'Thành công!',
        description: 'Nhạc đã được tạo và upload lên IPFS',
      })
    } catch (error: any) {
      console.error('Error generating music:', error)
      setStatus({
        status: 'error',
        progress: 0,
        error: error.response?.data?.error || 'Có lỗi xảy ra khi tạo nhạc',
      })
      toast({
        title: 'Lỗi',
        description: error.response?.data?.error || 'Có lỗi xảy ra khi tạo nhạc',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo Nhạc AI</CardTitle>
        <CardDescription>
          Nhập mô tả nhạc bạn muốn tạo, ví dụ: "Nhạc jazz nhẹ nhàng, có piano và saxophone"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Nhập prompt mô tả nhạc bạn muốn tạo..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          disabled={status.status === 'generating' || status.status === 'uploading'}
        />

        {status.status !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {status.status === 'generating' && 'Đang tạo nhạc...'}
                {status.status === 'uploading' && 'Đang upload lên IPFS...'}
                {status.status === 'completed' && 'Hoàn thành!'}
                {status.status === 'error' && 'Có lỗi xảy ra'}
              </span>
              <span>{status.progress}%</span>
            </div>
            <Progress value={status.progress} />
          </div>
        )}

        {status.status === 'completed' && audioUrl && (
          <>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {status.coverUrl && (
                <img
                  src={status.coverUrl}
                  alt="Cover"
                  className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/wav" />
                  Trình duyệt của bạn không hỗ trợ audio.
                </audio>
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

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={status.status === 'generating' || status.status === 'uploading'}
            className="flex-1"
          >
            {status.status === 'generating' || status.status === 'uploading' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Tạo nhạc
              </>
            )}
          </Button>
          {status.status === 'completed' && (
            <Button
              variant="outline"
              onClick={() => window.location.href = '/mint'}
            >
              Mint NFT
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

