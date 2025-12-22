"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Music, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WalletConnect } from '@/components/WalletConnect'
import { useWallet } from '@/components/WalletProvider'
import { useToast } from '@/components/ui/use-toast'
import { mintNFT } from '@/lib/contract'

interface PendingMint {
  musicUrl: string
  coverUrl: string
  metadataUri: string
  prompt: string
}

export default function MintPage() {
  const [pendingMint, setPendingMint] = useState<PendingMint | null>(null)
  const [isMinting, setIsMinting] = useState(false)
  const { account, isConnected } = useWallet()
  const { toast } = useToast()

  useEffect(() => {
    const stored = localStorage.getItem('pendingMint')
    if (stored) {
      setPendingMint(JSON.parse(stored))
    }
  }, [])

  const handleMint = async () => {
    if (!isConnected || !account) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng kết nối ví MetaMask trước',
        variant: 'destructive',
      })
      return
    }

    if (!pendingMint) {
      toast({
        title: 'Lỗi',
        description: 'Không có nhạc để mint',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsMinting(true)
      const txHash = await mintNFT(account, pendingMint.metadataUri)
      
      toast({
        title: 'Thành công!',
        description: `NFT đã được mint! TX: ${txHash.slice(0, 10)}...`,
      })

      // Xóa pending mint sau khi thành công
      localStorage.removeItem('pendingMint')
      setPendingMint(null)
    } catch (error: any) {
      console.error('Error minting NFT:', error)
      toast({
        title: 'Lỗi',
        description: error.message || 'Có lỗi xảy ra khi mint NFT',
        variant: 'destructive',
      })
    } finally {
      setIsMinting(false)
    }
  }

  if (!pendingMint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-purple-600">
              <Music className="w-8 h-8" />
              <span>Music NFT</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost">Trang chủ</Button>
              </Link>
              <Link href="/my-nfts">
                <Button variant="ghost">My NFTs</Button>
              </Link>
              <WalletConnect />
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Không có nhạc để mint</CardTitle>
              <CardDescription>
                Vui lòng tạo nhạc trước khi mint NFT
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại trang chủ
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-purple-600">
            <Music className="w-8 h-8" />
            <span>Music NFT</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost">Trang chủ</Button>
            </Link>
            <Link href="/my-nfts">
              <Button variant="ghost">My NFTs</Button>
            </Link>
            <WalletConnect />
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Mint NFT</CardTitle>
              <CardDescription>
                Xác nhận thông tin và mint nhạc của bạn thành NFT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {pendingMint.coverUrl && (
                <img
                  src={pendingMint.coverUrl}
                  alt="Cover"
                  className="w-full rounded-lg"
                />
              )}

              <div>
                <h3 className="font-semibold mb-2">Prompt:</h3>
                <p className="text-gray-600">{pendingMint.prompt}</p>
              </div>

              {pendingMint.musicUrl && (
                <div>
                  <h3 className="font-semibold mb-2">Nhạc:</h3>
                  <audio controls className="w-full">
                    <source src={pendingMint.musicUrl} type="audio/mpeg" />
                    Trình duyệt của bạn không hỗ trợ audio.
                  </audio>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Metadata URI:</h3>
                <p className="text-sm text-gray-500 break-all">{pendingMint.metadataUri}</p>
              </div>

              <Button
                onClick={handleMint}
                disabled={!isConnected || isMinting}
                className="w-full"
                size="lg"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang mint...
                  </>
                ) : (
                  'Mint NFT'
                )}
              </Button>

              {!isConnected && (
                <p className="text-sm text-center text-gray-500">
                  Vui lòng kết nối ví MetaMask để mint NFT
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

