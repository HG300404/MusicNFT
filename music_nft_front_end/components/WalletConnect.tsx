"use client"

import { useWallet } from './WalletProvider'
import { Button } from './ui/button'
import { Wallet } from 'lucide-react'

export function WalletConnect() {
  const { account, connectWallet, disconnectWallet, isConnected } = useWallet()

  const handleConnect = async () => {
    try {
      await connectWallet()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  if (isConnected && account) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {account.slice(0, 6)}...{account.slice(-4)}
        </span>
        <Button variant="outline" size="sm" onClick={disconnectWallet}>
          Ngắt kết nối
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={handleConnect} className="gap-2">
      <Wallet className="w-4 h-4" />
      Kết nối ví
    </Button>
  )
}

