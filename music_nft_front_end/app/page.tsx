'use client'

import Link from 'next/link'
import { Music, Wallet, Image as ImageIcon, Upload, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WalletConnect } from '@/components/WalletConnect'
import { GenerateMusicForm } from '@/components/GenerateMusicForm'
import { UploadMusicForm } from '@/components/UploadMusicForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-purple-600">
            <Music className="w-8 h-8" />
            <span>Music NFT</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/mint">
              <Button variant="ghost">Mint</Button>
            </Link>
            <Link href="/my-nfts">
              <Button variant="ghost">My NFTs</Button>
            </Link>
            <WalletConnect />
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Tạo Nhạc AI & Mint NFT
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Nhập prompt, để AI tạo nhạc cho bạn, sau đó mint thành NFT trên blockchain
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Tạo Nhạc AI
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload File Có Sẵn
              </TabsTrigger>
            </TabsList>
            <TabsContent value="generate">
              <GenerateMusicForm />
            </TabsContent>
            <TabsContent value="upload">
              <UploadMusicForm />
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Music className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Tạo Nhạc AI</h3>
            <p className="text-gray-600">
              Nhập mô tả và để AI tạo nhạc độc đáo cho bạn
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <ImageIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lưu IPFS</h3>
            <p className="text-gray-600">
              Nhạc và metadata được lưu an toàn trên IPFS
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Mint NFT</h3>
            <p className="text-gray-600">
              Sở hữu nhạc của bạn dưới dạng NFT trên blockchain
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

