'use client'

import Link from 'next/link'
import { Music, Wallet, Image as ImageIcon, Upload, Sparkles, Zap, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WalletConnect } from '@/components/WalletConnect'
import { GenerateMusicForm } from '@/components/GenerateMusicForm'
import { UploadMusicForm } from '@/components/UploadMusicForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Home() {
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
            <Link href="/mint">
              <Button variant="ghost" className="smooth-transition hover:bg-purple-100">Mint</Button>
            </Link>
            <Link href="/my-nfts">
              <Button variant="ghost" className="smooth-transition hover:bg-purple-100">My NFTs</Button>
            </Link>
            <WalletConnect />
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6 bg-black/10 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
          <div className="inline-block mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">Powered by AI</span>
            </div>
          </div>
          
          <h1 className="text-7xl font-bold text-white mb-6 leading-tight" style={{textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.5)'}}>
            Tạo Nhạc AI & Mint NFT
          </h1>
          
          <p className="text-2xl text-white max-w-3xl mx-auto font-light leading-relaxed" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
            Nhập prompt, để AI tạo nhạc độc đáo cho bạn, sau đó mint thành NFT trên blockchain
          </p>

          <div className="flex items-center justify-center gap-8 mt-8">
            <div className="flex items-center gap-2 text-white bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="font-medium">Instant Generation</span>
            </div>
            <div className="flex items-center gap-2 text-white bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="font-medium">Blockchain Secured</span>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="max-w-4xl mx-auto mb-20 bg-black/10 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 glass-card h-14">
              <TabsTrigger 
                value="generate" 
                className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 rounded-lg transition-all duration-300"
              >
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Tạo Nhạc AI</span>
              </TabsTrigger>
              <TabsTrigger 
                value="upload" 
                className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 rounded-lg transition-all duration-300"
              >
                <Upload className="w-5 h-5" />
                <span className="font-semibold">Upload File Có Sẵn</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="generate" className="mt-0">
              <GenerateMusicForm />
            </TabsContent>
            <TabsContent value="upload" className="mt-0">
              <UploadMusicForm />
            </TabsContent>
          </Tabs>
        </div>

        {/* Feature Cards */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="glass-card rounded-2xl p-8 smooth-transition hover:scale-105 float-animation">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mb-6 glow-purple">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>Tạo Nhạc AI</h3>
            <p className="text-white leading-relaxed" style={{textShadow: '0 1px 5px rgba(0,0,0,0.5)'}}>
              Nhập mô tả và để AI tạo nhạc độc đáo cho bạn với công nghệ MusicGen tiên tiến
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 smooth-transition hover:scale-105 float-animation" style={{animationDelay: '0.2s'}}>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 glow-blue">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>Lưu IPFS</h3>
            <p className="text-white leading-relaxed" style={{textShadow: '0 1px 5px rgba(0,0,0,0.5)'}}>
              Nhạc và metadata được lưu an toàn, phi tập trung trên mạng lưới IPFS
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 smooth-transition hover:scale-105 float-animation" style={{animationDelay: '0.4s'}}>
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-6 glow-pink">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>Mint NFT</h3>
            <p className="text-white leading-relaxed" style={{textShadow: '0 1px 5px rgba(0,0,0,0.5)'}}>
              Sở hữu nhạc của bạn dưới dạng NFT trên blockchain Ethereum Sepolia
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 glass-card rounded-3xl p-12 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-bold text-white mb-2" style={{textShadow: '0 4px 20px rgba(139,92,246,0.8)'}}>10s</div>
              <div className="text-white text-lg" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>Generation Time</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white mb-2" style={{textShadow: '0 4px 20px rgba(59,130,246,0.8)'}}>100%</div>
              <div className="text-white text-lg" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>Unique Music</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white mb-2" style={{textShadow: '0 4px 20px rgba(236,72,153,0.8)'}}>∞</div>
              <div className="text-white text-lg" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>Possibilities</div>
            </div>
          </div>
        </div>
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


