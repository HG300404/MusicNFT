import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// API endpoint từ musicgen-api
const MUSIC_API_URL = process.env.MUSIC_API_URL || 'http://localhost:8000'
const IMAGE_API_URL = process.env.IMAGE_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt là bắt buộc' },
        { status: 400 }
      )
    }

    // Gọi API để tạo nhạc
    const musicResponse = await axios.post(
      `${MUSIC_API_URL}/generate-music`,
      { prompt },
      {
        timeout: 300000, // 5 phút timeout
      }
    )

    const musicUrl = musicResponse.data.fileUrl || musicResponse.data.file

    // Tạo cover image từ prompt (tùy chọn)
    let coverUrl = null
    try {
      const imageResponse = await axios.post(
        `${IMAGE_API_URL}/generate-image`,
        { prompt: `Album cover art for: ${prompt}` },
        {
          timeout: 120000, // 2 phút timeout
        }
      )
      // Sử dụng fileUrl từ response hoặc tạo URL từ filename
      coverUrl = imageResponse.data.fileUrl || `${IMAGE_API_URL}/files/${imageResponse.data.filename}`
    } catch (imageError) {
      console.warn('Failed to generate cover image:', imageError)
      // Không bắt buộc phải có cover image
    }

    return NextResponse.json({
      musicUrl,
      coverUrl,
      filename: musicResponse.data.filename,
      seconds: musicResponse.data.seconds,
    })
  } catch (error: any) {
    console.error('Error generating music:', error)
    return NextResponse.json(
      { 
        error: error.response?.data?.detail || error.response?.data?.error || 'Có lỗi xảy ra khi tạo nhạc' 
      },
      { status: error.response?.status || 500 }
    )
  }
}

