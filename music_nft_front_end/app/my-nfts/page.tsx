"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Music, ArrowLeft, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WalletConnect } from '@/components/WalletConnect'
import { useWallet } from '@/components/WalletProvider'
import { fetchUserNFTs } from '@/lib/contract'
import axios from 'axios'

interface NFT {
  tokenId: string
  metadataUri: string
  metadata?: {
    name: string
    description: string
    image: string
    animation_url: string
    attributes?: Array<{ trait_type: string; value: string }>
  }
}

export default function MyNFTsPage() {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const { account, isConnected } = useWallet()

  useEffect(() => {
    if (isConnected && account) {
      loadNFTs()
    } else {
      setLoading(false)
    }
  }, [isConnected, account])

  const loadNFTs = async () => {
    if (!account) return

    try {
      setLoading(true)
      const tokenIds = await fetchUserNFTs(account)
      
      const nftPromises = tokenIds.map(async (tokenId) => {
        try {
          const metadataUri = await fetchMetadataUri(tokenId)
          const metadata = await fetchMetadata(metadataUri)
          return { tokenId, metadataUri, metadata }
        } catch (error) {
          console.error(`Error loading NFT ${tokenId}:`, error)
          return { tokenId, metadataUri: '', metadata: undefined }
        }
      })

      const nftData = await Promise.all(nftPromises)
      setNfts(nftData.filter(nft => nft.metadata))
    } catch (error) {
      console.error('Error loading NFTs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetadataUri = async (tokenId: string): Promise<string> => {
    const response = await axios.get(`/api/nft-metadata?tokenId=${tokenId}`)
    return response.data.metadataUri
  }

  const fetchMetadata = async (uri: string): Promise<any> => {
    // Convert IPFS URI to HTTP URL
    const httpUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
    const response = await axios.get(httpUrl)
    return response.data
  }

  const togglePlay = (tokenId: string) => {
    setPlayingId(playingId === tokenId ? null : tokenId)
  }

  if (!isConnected) {
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
              <Link href="/mint">
                <Button variant="ghost">Mint</Button>
              </Link>
              <WalletConnect />
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Kết nối ví để xem NFTs</CardTitle>
              <CardDescription>
                Vui lòng kết nối ví MetaMask để xem bộ sưu tập NFT của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WalletConnect />
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
            <Link href="/mint">
              <Button variant="ghost">Mint</Button>
            </Link>
            <WalletConnect />
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My NFTs</h1>
          <p className="text-gray-600">Bộ sưu tập nhạc NFT của bạn</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Đang tải...</p>
          </div>
        ) : nfts.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Chưa có NFT</CardTitle>
              <CardDescription>
                Bạn chưa có NFT nào. Hãy tạo và mint nhạc đầu tiên của bạn!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tạo nhạc ngay
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nfts.map((nft) => (
              <Card key={nft.tokenId} className="overflow-hidden">
                {nft.metadata?.image && (
                  <img
                    src={nft.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                    alt={nft.metadata.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <CardHeader>
                  <CardTitle>{nft.metadata?.name || `NFT #${nft.tokenId}`}</CardTitle>
                  <CardDescription>
                    {nft.metadata?.description || 'Music NFT'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {nft.metadata?.animation_url && (
                    <div>
                      <Button
                        onClick={() => togglePlay(nft.tokenId)}
                        className="w-full"
                        variant="outline"
                      >
                        {playingId === nft.tokenId ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Dừng
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Phát nhạc
                          </>
                        )}
                      </Button>
                      {playingId === nft.tokenId && (
                        <audio
                          controls
                          autoPlay
                          className="w-full mt-2"
                          src={nft.metadata.animation_url.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                        >
                          Trình duyệt của bạn không hỗ trợ audio.
                        </audio>
                      )}
                    </div>
                  )}
                  {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Thuộc tính:</h4>
                      <div className="space-y-1">
                        {nft.metadata.attributes.map((attr, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">{attr.trait_type}:</span>{' '}
                            <span className="text-gray-600">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Token ID: {nft.tokenId}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

