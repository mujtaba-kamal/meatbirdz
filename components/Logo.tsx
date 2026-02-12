'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChefHat } from 'lucide-react'

interface LogoProps {
  className?: string
  showText?: boolean
  isAdmin?: boolean
}

export default function Logo({ className = '', showText = false, isAdmin = false }: LogoProps) {
  const logoImageUrl = 'https://res.cloudinary.com/dzuo7rbfa/image/upload/v1770882972/Gemini_Generated_Image_3gu4av3gu4av3gu4_lv8p1v.png'

  return (
    <Link 
      href={isAdmin ? "/admin" : "/"} 
      className={`flex items-center group ${className}`}
    >
      <div className="relative h-14 sm:h-16 md:h-20 flex-shrink-0" style={{ width: 'auto' }}>
        <Image
          src={logoImageUrl}
          alt="MEATBIRDZ Logo"
          width={200}
          height={80}
          className="object-contain h-full w-auto"
          priority
          unoptimized={false}
        />
      </div>
      {showText && (
        <span className={`text-xl sm:text-2xl font-bold ml-2 ${isAdmin ? 'text-white' : 'bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent'}`}>
          {isAdmin ? 'Admin Portal' : 'MeatBirdz'}
        </span>
      )}
    </Link>
  )
}

