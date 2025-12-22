import { ethers } from 'ethers'

// Import ABI từ contract đã deploy (Dev 1)
import MusicNFTData from '../../musicnft_contract/frontend/MusicNFT.json'

// Contract ABI và Address từ deployed contract
const CONTRACT_ABI = MusicNFTData.abi
const CONTRACT_ADDRESS = MusicNFTData.contractAddress ||
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  '0x8E65aEe95f6B0249eAD4A4847E5e398551C97D52'

export async function mintNFT(account: string, metadataUri: string): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask không được cài đặt')
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

  try {
    // Lấy mint price từ contract
    const mintPrice = await contract.mintPrice()

    // Gọi mintMusic với đầy đủ parameters
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

