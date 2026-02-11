import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

export const dynamic = 'force-dynamic'

// Configure Cloudinary (use environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: 'Image upload service not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'meatbirdz', // Optional: organize images in a folder
          resource_type: 'auto',
          transformation: [
            { width: 800, height: 800, crop: 'limit' }, // Resize if needed
            { quality: 'auto' }, // Auto optimize quality
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            resolve(
              NextResponse.json(
                { error: 'Failed to upload image', details: error.message },
                { status: 500 }
              )
            )
            return
          }

          if (!result) {
            resolve(
              NextResponse.json(
                { error: 'Upload failed - no result returned' },
                { status: 500 }
              )
            )
            return
          }

          resolve(
            NextResponse.json({
              success: true,
              url: result.secure_url, // Use secure_url for HTTPS
              publicId: result.public_id,
            })
          )
        }
      )

      uploadStream.end(buffer)
    })
  } catch (error: any) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image', details: error.message },
      { status: 500 }
    )
  }
}

