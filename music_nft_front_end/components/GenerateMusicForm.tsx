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

      // Hiển thị nhạc và ảnh NGAY SAU KHI GENERATE XONG
      setAudioUrl(aiResponse.data.musicUrl)
      setStatus({ 
        status: 'uploading', 
        progress: 50,
        musicUrl: aiResponse.data.musicUrl,
        coverUrl: aiResponse.data.coverUrl,
      })

      // Upload lên IPFS và tạo metadata
      const ipfsResponse = await axios.post('/api/upload-ipfs', {
        musicUrl: aiResponse.data.musicUrl,
        coverUrl: aiResponse.data.coverUrl,
        prompt: prompt.trim(),
      })

      setStatus({
        status: 'completed',
        progress: 100,
        musicUrl: aiResponse.data.musicUrl,
        coverUrl: aiResponse.data.coverUrl,
        metadataUri: ipfsResponse.data.metadataUri,
        folderCid: ipfsResponse.data.folderCid,
        gatewayUrl: ipfsResponse.data.gatewayUrl,
        tokenURIGateway: ipfsResponse.data.tokenURIGateway,
      })

      // Giữ audioUrl từ local server để phát nhạc nhanh hơn
      // setAudioUrl(ipfsResponse.data.musicUrl)

      // Lưu vào localStorage để dùng ở trang mint
      // Lưu cả URL local (nhanh) và IPFS (cho NFT metadata)
      localStorage.setItem('pendingMint', JSON.stringify({
        // Local URLs - dùng để hiển thị nhanh
        musicUrlLocal: aiResponse.data.musicUrl,
        coverUrlLocal: aiResponse.data.coverUrl,
        // IPFS URLs - dùng cho NFT metadata
        musicUrlIpfs: ipfsResponse.data.musicUrl,
        coverUrlIpfs: ipfsResponse.data.coverUrl,
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
    <Card className="glass-card border-white/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-white">Tạo Nhạc AI</CardTitle>
        <CardDescription className="text-white/70 text-base">
          Nhập mô tả nhạc bạn muốn tạo, ví dụ: "Nhạc jazz nhẹ nhàng, có piano và saxophone"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Textarea
          placeholder="Nhập prompt mô tả nhạc bạn muốn tạo..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          disabled={status.status === 'generating' || status.status === 'uploading'}
          className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/50 resize-none text-base"
        />

        {status.status !== 'idle' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/90 font-medium">
                {status.status === 'generating' && '🎵 Đang tạo nhạc...'}
                {status.status === 'uploading' && '📤 Đang upload lên IPFS...'}
                {status.status === 'completed' && '✅ Hoàn thành!'}
                {status.status === 'error' && '❌ Có lỗi xảy ra'}
              </span>
              <span className="text-white font-bold">{status.progress}%</span>
            </div>
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${status.progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {(status.status === 'uploading' || status.status === 'completed') && audioUrl && (
          <>
            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
              {status.coverUrl && (
                <img
                  src={status.coverUrl}
                  alt="Cover"
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0 shadow-lg"
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
              <div className="space-y-3 p-5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-white/30 backdrop-blur-sm">
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  IPFS Information
                </h4>

                {status.folderCid && (
                  <div className="text-sm">
                    <span className="text-white/70 font-medium">Folder CID:</span>
                    <p className="font-mono text-white bg-black/20 p-2 rounded mt-1 break-all text-xs">{status.folderCid}</p>
                  </div>
                )}

                <div className="text-sm">
                  <span className="text-white/70 font-medium">Token URI:</span>
                  <p className="font-mono text-white bg-black/20 p-2 rounded mt-1 break-all text-xs">{status.metadataUri}</p>
                </div>

                {status.tokenURIGateway && (
                  <div className="text-sm">
                    <a
                      href={status.tokenURIGateway}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 hover:text-cyan-100 underline font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      🔗 Xem metadata trên IPFS Gateway
                    </a>
                  </div>
                )}

                {status.gatewayUrl && (
                  <div className="text-sm">
                    <a
                      href={status.gatewayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 hover:text-cyan-100 underline font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      📁 Xem folder trên IPFS Gateway
                    </a>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleGenerate}
            disabled={status.status === 'generating' || status.status === 'uploading'}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 text-base shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status.status === 'generating' || status.status === 'uploading' ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Tạo nhạc
              </>
            )}
          </Button>
          {status.status === 'completed' && (
            <Button
              variant="outline"
              onClick={() => window.location.href = '/mint'}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 font-semibold py-6 px-8 text-base backdrop-blur-sm transition-all duration-300"
            >
              Mint NFT
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

