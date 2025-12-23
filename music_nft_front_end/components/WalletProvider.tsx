"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ethers } from 'ethers'

interface WalletContextType {
  account: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  isConnected: boolean
  provider: ethers.BrowserProvider | null
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const checkConnection = async () => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.listAccounts()
          if (accounts.length > 0) {
            setAccount(accounts[0].address)
            setProvider(provider)
          }
        } catch (error) {
          console.error('Error checking connection:', error)
        }
      }
      checkConnection()

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          // Recreate provider when account changes
          const newProvider = new ethers.BrowserProvider(window.ethereum)
          setProvider(newProvider)
        } else {
          setAccount(null)
          setProvider(null)
        }
      })

      // Listen for network/chain changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        console.log('🔄 Network changed to chain ID:', chainId)
        // Reload the page when network changes to ensure clean state
        window.location.reload()
      })
    }
  }, [])

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        await provider.send('eth_requestAccounts', [])
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        setAccount(address)
        setProvider(provider)
      } catch (error) {
        console.error('Error connecting wallet:', error)
        throw error
      }
    } else {
      alert('Vui lòng cài đặt MetaMask!')
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setProvider(null)
  }

  return (
    <WalletContext.Provider
      value={{
        account,
        connectWallet,
        disconnectWallet,
        isConnected: !!account,
        provider,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

declare global {
  interface Window {
    ethereum?: any
  }
}

