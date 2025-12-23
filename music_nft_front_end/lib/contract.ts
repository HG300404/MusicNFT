import { ethers } from 'ethers'

// Import ABI từ contract đã deploy (Dev 1)
import MusicNFTData from '../../musicnft_contract/frontend/MusicNFT.json'

// Contract ABI và Address từ deployed contract
const CONTRACT_ABI = MusicNFTData.abi
const CONTRACT_ADDRESS = MusicNFTData.contractAddress

export async function mintNFT(account: string, metadataUri: string): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask không được cài đặt')
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  
  // Debug: Check network
  const network = await provider.getNetwork()
  console.log('=== NETWORK DEBUG ===')
  console.log('Network name:', network.name)
  console.log('Chain ID:', network.chainId.toString())
  console.log('Expected Chain ID for Sepolia: 11155111')
  
  // Auto-switch to Sepolia if on wrong network
  if (network.chainId !== BigInt(11155111)) {
    console.log('🔄 Wrong network detected. Requesting switch to Sepolia...')
    try {
      // Request to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID in hex
      })
      console.log('✅ Switched to Sepolia successfully')
      // Reload page after switch
      window.location.reload()
      return '' // Return empty to prevent further execution
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'SepoliaETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }],
          })
          window.location.reload()
          return ''
        } catch (addError) {
          throw new Error('Failed to add Sepolia network to MetaMask')
        }
      }
      throw new Error(`Failed to switch to Sepolia: ${switchError.message}`)
    }
  }
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

  try {
    // Debug: Log parameters before calling contract
    console.log('=== MINT NFT DEBUG ===')
    console.log('Contract Address:', CONTRACT_ADDRESS)
    console.log('Account:', account)
    console.log('MetadataUri:', metadataUri)
    console.log('MetadataUri type:', typeof metadataUri)
    console.log('MetadataUri length:', metadataUri?.length)
    
    // Lấy mint price từ contract
    console.log('Calling contract.mintPrice()...')
    const mintPrice = await contract.mintPrice()
    console.log('Mint Price:', mintPrice.toString())

    // Gọi mintMusic với đầy đủ parameters
    console.log('Calling contract.mintMusic with params:', {
      to: account,
      metadataURI: metadataUri,
      royaltyReceiver: account,
      royaltyFee: 500,
      value: mintPrice.toString()
    })
    
    const tx = await contract.mintMusic(
      account,           // to
      metadataUri,       // metadataURI
      account,           // royaltyReceiver
      500,               // royaltyFee (5%)
      { value: mintPrice } // Payment
    )

    await tx.wait()
    return tx.hash
  } catch (error: any) {
    console.error('Error minting NFT:', error)
    throw new Error(error.message || 'Có lỗi xảy ra khi mint NFT')
  }
}

export async function fetchUserNFTs(account: string): Promise<string[]> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask không được cài đặt')
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  
  // Check and switch to Sepolia if needed
  const network = await provider.getNetwork()
  if (network.chainId !== BigInt(11155111)) {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }],
    })
    // Wait a bit for network to switch
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

  try {
    const balance = await contract.balanceOf(account)
    const tokenIds: string[] = []

    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(account, i)
      tokenIds.push(tokenId.toString())
    }

    return tokenIds
  } catch (error: any) {
    console.error('Error fetching user NFTs:', error)
    throw new Error(error.message || 'Có lỗi xảy ra khi tải NFTs')
  }
}

export async function fetchTokenURI(tokenId: string): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask không được cài đặt')
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  
  // Check and switch to Sepolia if needed
  const network = await provider.getNetwork()
  if (network.chainId !== BigInt(11155111)) {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }],
    })
    // Wait a bit for network to switch
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

  try {
    const uri = await contract.tokenURI(tokenId)
    return uri
  } catch (error: any) {
    console.error('Error fetching token URI:', error)
    throw new Error(error.message || 'Có lỗi xảy ra khi tải token URI')
  }
}

declare global {
  interface Window {
    ethereum?: any
  }
}

