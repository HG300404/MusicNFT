"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Music, ArrowLeft, Play, Pause, Sparkles, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WalletConnect } from '@/components/WalletConnect'
import { useWallet } from '@/components/WalletProvider'
import { fetchUserNFTs, fetchTokenURI } from '@/lib/contract'
import axios from 'axios'

interface NFT {
  tokenId: string
  metadataUri: string
  metadata?: {
    name: string
    description: string
    image: string
    animation_url: string
    music?: string // Add this
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
          // Call fetchTokenURI directly instead of through API
          const metadataUri = await fetchTokenURI(tokenId)
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

  const fetchMetadata = async (uri: string): Promise<any> => {
    // Convert IPFS URI to HTTP URL using w3s.link gateway
    const httpUrl = uri.replace('ipfs://', 'https://w3s.link/ipfs/')
    const response = await axios.get(httpUrl)
    return response.data
  }

  const getIpfsUrl = (uri: string, parentUri?: string) => {
    if (!uri) return ''
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', 'https://w3s.link/ipfs/')
    }
    // Handle relative path if parentUri is provided (e.g. "cover.png" inside a folder)
    if (parentUri && parentUri.startsWith('ipfs://')) {
      const parts = parentUri.split('/')
      // If it ends with .json, remove the file part to get the folder CID
      if (parts[parts.length - 1].endsWith('.json')) {
        parts.pop()
      }
      const baseUrl = parts.join('/').replace('ipfs://', 'https://w3s.link/ipfs/')
      return `${baseUrl}/${uri}`
    }
    return uri
  }

  const togglePlay = (tokenId: string) => {
    setPlayingId(playingId === tokenId ? null : tokenId)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen animated-gradient relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <nav className="glass-nav sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110">
                <Music className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">Music NFT</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" className="smooth-transition hover:bg-purple-100">Trang chủ</Button>
              </Link>
              <Link href="/mint">
                <Button variant="ghost" className="smooth-transition hover:bg-purple-100">Mint</Button>
              </Link>
              <WalletConnect />
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-2xl mx-auto">
            <Card className="glass-card border-white/30 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-white">Kết nối ví để xem NFTs</CardTitle>
                <CardDescription className="text-white/70 text-base">
                  Vui lòng kết nối ví MetaMask để xem bộ sưu tập NFT của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WalletConnect />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen animated-gradient relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>

      <nav className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110">
              <Music className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Music NFT</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" className="smooth-transition hover:bg-purple-100">Trang chủ</Button>
            </Link>
            <Link href="/mint">
              <Button variant="ghost" className="smooth-transition hover:bg-purple-100">Mint</Button>
            </Link>
            <WalletConnect />
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16 relative z-10">
        {/* Header */}
        <div className="mb-12 bg-black/10 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <h1 className="text-5xl font-bold text-white" style={{textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.5)'}}>
              My NFTs
            </h1>
          </div>
          <p className="text-xl text-white" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
            Bộ sưu tập nhạc NFT của bạn
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-black/10 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white mb-4"></div>
            <p className="text-white text-xl" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>Đang tải...</p>
          </div>
        ) : nfts.length === 0 ? (
          <Card className="glass-card border-white/30 shadow-2xl max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-white">Chưa có NFT</CardTitle>
              <CardDescription className="text-white/70 text-base">
                Bạn chưa có NFT nào. Hãy tạo và mint nhạc đầu tiên của bạn!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 text-base shadow-lg hover:shadow-purple-500/50 transition-all duration-300">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Tạo nhạc ngay
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nfts.map((nft) => (
              <Card key={nft.tokenId} className="glass-card border-white/30 shadow-2xl overflow-hidden smooth-transition hover:scale-105">
                {nft.metadata?.image && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getIpfsUrl(nft.metadata.image, nft.metadataUri)}
                      alt={nft.metadata.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
                    {nft.metadata?.name || `NFT #${nft.tokenId}`}
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    {nft.metadata?.description || 'Music NFT'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {nft.metadata?.animation_url && (
                    <div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => togglePlay(nft.tokenId)}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
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
                        <a 
                          href={`https://testnet.rarible.com/token/sepolia/0xFCE622EbED82e7283AE366cE6dF39F2aA2526535:${nft.tokenId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center px-4 rounded-md bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
                          title="Xem trên Rarible"
                        >
                          <ExternalLink className="w-4 h-4 text-white" />
                        </a>
                      </div>
                      {playingId === nft.tokenId && (
                        <audio
                          controls
                          autoPlay
                          className="w-full mt-3"
                          src={getIpfsUrl(nft.metadata?.animation_url || nft.metadata?.music || '', nft.metadataUri)}
                        >
                          Trình duyệt của bạn không hỗ trợ audio.
                        </audio>
                      )}
                    </div>
                  )}
                  {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                    <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                      <h4 className="text-sm font-bold text-white mb-2" style={{textShadow: '0 1px 5px rgba(0,0,0,0.5)'}}>
                        Thuộc tính:
                      </h4>
                      <div className="space-y-1">
                        {nft.metadata.attributes.map((attr, idx) => (
                          <div key={idx} className="text-sm text-white/80">
                            <span className="font-medium text-white">{attr.trait_type}:</span>{' '}
                            <span>{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center bg-black/20 p-2 rounded">
                    <span className="text-xs text-white/60 font-mono">Token ID: {nft.tokenId}</span>
                    <a 
                      href={`https://sepolia.etherscan.io/token/0xFCE622EbED82e7283AE366cE6dF39F2aA2526535?a=${nft.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-purple-400 hover:text-purple-300 underline"
                    >
                      Etherscan
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-24 pb-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/60">
            Built with ❤️ using AI • Powered by MusicGen & Stable Diffusion
          </p>
        </div>
      </footer>
    </div>
  )
}

