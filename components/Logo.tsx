'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChefHat } from 'lucide-react'
import { useState, useEffect } from 'react'

interface LogoProps {
  className?: string
  showText?: boolean
  isAdmin?: boolean
}

export default function Logo({ className = '', showText = true, isAdmin = false }: LogoProps) {
  const [imageError, setImageError] = useState(true) // Start with true to show fallback until image loads
  const [imageLoaded, setImageLoaded] = useState(false)
  const [logoSrc, setLogoSrc] = useState('/logo.png')

  useEffect(() => {
    // Check if logo exists by trying to load it (try PNG first, then SVG)
    const img = new window.Image()
    img.onload = () => {
      setLogoSrc('/logo.png')
      setImageLoaded(true)
      setImageError(false)
    }
    img.onerror = () => {
      // Try SVG as fallback
      const svgImg = new window.Image()
      svgImg.onload = () => {
        setLogoSrc('/logo.svg')
        setImageLoaded(true)
        setImageError(false)
      }
      svgImg.onerror = () => {
        setImageError(true)
        setImageLoaded(false)
      }
      svgImg.src = '/logo.svg'
    }
    img.src = '/logo.png'
  }, [])

  return (
    <Link 
      href={isAdmin ? "/admin" : "/"} 
      className={`flex items-center space-x-2 group ${className}`}
    >
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
        {imageLoaded && !imageError ? (
          <Image
            src={logoSrc}
            alt="MEATBIRDZ Logo"
            fill
            className="object-contain"
            priority
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`w-full h-full rounded-lg flex items-center justify-center ${isAdmin ? 'bg-primary-700 group-hover:bg-primary-600' : 'bg-primary-600 group-hover:bg-primary-700'} transition-colors`}>
            <ChefHat className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
      {showText && (
        <span className={`text-xl sm:text-2xl font-bold ${isAdmin ? 'text-white' : 'bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent'}`}>
          {isAdmin ? 'Admin Portal' : 'MeatBirdz'}
        </span>
      )}
    </Link>
  )
}

