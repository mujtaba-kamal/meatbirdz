'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, ShoppingCart, MapPin, Star, Shield, Zap, Instagram } from 'lucide-react'

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()
  const [logoError, setLogoError] = useState(true) // Start with true to show fallback
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [logoSrc, setLogoSrc] = useState('/logo.png')
  const [currentSlide, setCurrentSlide] = useState(0)

  // Hero carousel images - Cloudinary images
  const heroImages = [
    {
      url: 'https://res.cloudinary.com/dzuo7rbfa/image/upload/v1770882972/Gemini_Generated_Image_3gu4av3gu4av3gu4_lv8p1v.png',
      alt: 'MeatBirdz Food',
    },
    {
      url: 'https://res.cloudinary.com/dzuo7rbfa/image/upload/v1771952599/WhatsApp_Image_2026-02-09_at_11.51.58_2_axgxcv.jpg',
      alt: 'Delicious Food Selection',
    },
    {
      url: 'https://res.cloudinary.com/dzuo7rbfa/image/upload/v1771952609/WhatsApp_Image_2026-02-09_at_11.51.59_6_evr1bk.jpg',
      alt: 'Fresh Food Menu',
    },
  ]

  useEffect(() => {
    // Check if logo exists by trying to load it (try PNG first, then SVG)
    const img = new window.Image()
    img.onload = () => {
      setLogoSrc('/logo.png')
      setLogoLoaded(true)
      setLogoError(false)
    }
    img.onerror = () => {
      // Try SVG as fallback
      const svgImg = new window.Image()
      svgImg.onload = () => {
        setLogoSrc('/logo.svg')
        setLogoLoaded(true)
        setLogoError(false)
      }
      svgImg.onerror = () => {
        setLogoError(true)
        setLogoLoaded(false)
      }
      svgImg.src = '/logo.svg'
    }
    img.src = '/logo.png'
  }, [])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      router.push('/admin')
    }
  }, [session, router])

  useEffect(() => {
    // Handle hash navigation when coming from other pages
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : ''
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }, [])

  // Auto-swipe carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [heroImages.length])

  return (
    <div className="min-h-screen">
      {/* Hero Section with Auto-Swiping Images */}
      <section id="home" className="relative text-white py-16 sm:py-20 lg:py-24 px-4 overflow-hidden scroll-mt-16 h-[600px] sm:h-[700px] lg:h-[800px]">
        {/* Background Images Carousel */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover"
                priority={index === 0}
                quality={90}
                unoptimized={false}
                onError={(e) => {
                  console.error('Image failed to load:', image.url)
                  // Fallback to a placeholder if image fails
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&h=1080&fit=crop&q=80'
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60"></div>
        
        {/* Content */}
        <div className="relative max-w-6xl mx-auto text-center h-full flex flex-col justify-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            {logoLoaded && !logoError ? (
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
                <Image
                  src={logoSrc}
                  alt="MEATBIRDZ Logo - SMASH FRIED FIRE"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : null}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold mb-4 sm:mb-6 drop-shadow-lg px-2">
            Welcome to MeatBirdz
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 lg:mb-10 text-primary-100 max-w-2xl mx-auto px-2">
            Delicious fast food delivered fresh to your door. Order now and taste the difference!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
            <Link
              href="/menu"
              className="inline-flex items-center justify-center bg-white text-primary-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-xl"
            >
              <Menu className="w-5 h-5 mr-2" />
              View Menu
            </Link>
            {!session && (
              <Link
                href="/register"
                className="inline-flex items-center justify-center bg-primary-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-primary-400 transition-all transform hover:scale-105 shadow-xl border-2 border-white/20"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 sm:py-16 lg:py-20 px-4 bg-gray-50 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">About MeatBirdz</h2>
          </div>
          
          {/* About Us */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">About Us</h3>
            <div className="text-gray-600 leading-relaxed space-y-4">
              <p>
                MeatBirdz was created with a clear standard — premium food, freshly prepared, and served properly.
              </p>
              <p>
                We focus on quality Angus smash burgers, crispy fried chicken, grilled selections, our unique HexWraps and loaded sides, all crafted using carefully selected ingredients and cooked to order. Nothing is pre-made. Nothing sits waiting. Every dish begins when you place your order.
              </p>
              <p>
                Our model is built around convenience without compromising quality.
                Order online or call us directly, park up, and your food will be brought straight to your car with our kerbside collection service. No queues. No unnecessary delays.
              </p>
              <p>
                Prefer delivery? We&apos;ll bring it to your door, fresh and ready.
              </p>
              <p>
                We operate from 5:30pm to midnight Sunday–Thursday, and until 1am on Fridays and Saturdays — providing a reliable evening option for families and anyone who values food done right.
              </p>
              <p className="font-semibold text-gray-800">
                Quality without shortcuts. Service without hassle.
              </p>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Our Story</h3>
              <div className="text-gray-600 leading-relaxed space-y-4">
                <p>
                  MeatBirdz was created to challenge the standard.
                </p>
                <p>
                  The takeaway industry has become predictable — the same menus, the same suppliers, the same ready-made ingredients repeated everywhere. We knew there was room to do better.
                </p>
                <p>
                  Before launching, we spent over a year developing and testing everything in-house. From seasoning blends and coatings to sauce recipes and flavour combinations, every detail was trialled, refined and rebuilt until it met our standard. Nothing was rushed. Nothing was copied.
                </p>
                <p>
                  We don&apos;t rely on generic off-the-shelf ingredients or frozen shortcuts. Our flavours are developed internally and built to deliver something you won&apos;t find replicated elsewhere — bold, balanced and consistent.
                </p>
                <p>
                  Our model is simple: premium food, made fresh when you order. Every burger is smashed to order. Every piece of chicken is prepared fresh. No holding trays. No pre-cooked batches.
                </p>
                <p>
                  We built MeatBirdz to prove that convenience doesn&apos;t have to mean compromise.
                </p>
                <p className="font-semibold text-gray-800">
                  Different by design. Raised by standards.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Our Mission</h3>
              <div className="text-gray-600 leading-relaxed space-y-4">
                <p>
                  To redefine convenient by proving that premium food and efficient service can exist together.
                </p>
                <p>
                  Every order is prepared fresh, handled with care, and delivered with the same standard we would expect ourselves.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section id="locations" className="py-12 sm:py-16 lg:py-20 px-4 bg-gray-50 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">Our Locations</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">Find us near you</p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <MapPin className="w-8 h-8 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-900">MeatBirdz Collection Point</h3>
              <p className="text-gray-600 mb-2">198 heybarnes road B10 9JF</p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Opening Hours:</p>
                <p className="text-sm text-gray-600">Sun - Thu: 17:30 - 00:00</p>
                <p className="text-sm text-gray-600">Fri & Sat: 17:30 - 01:00</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Why Choose Us
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2">
              Experience the best in fast food delivery with quality ingredients and exceptional service
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Menu className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Fresh Menu</h3>
              <p className="text-gray-600">
                Wide variety of burgers, wraps, fries, and drinks made with quality ingredients
              </p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Fast Delivery</h3>
              <p className="text-gray-600">
                Quick and reliable delivery to your location, hot and fresh
              </p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Secure Payment</h3>
              <p className="text-gray-600">
                Safe and secure payment processing with multiple options
              </p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Quality Service</h3>
              <p className="text-gray-600">
                Exceptional customer service and satisfaction guaranteed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 py-12 sm:py-16 lg:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Ready to Order?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-primary-100 mb-6 sm:mb-8 lg:mb-10 max-w-2xl mx-auto px-2">
            Browse our delicious menu and place your order now. Fast, fresh, and delivered to your door!
          </p>
          <Link
            href="/menu"
            className="inline-flex items-center bg-white text-primary-600 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-xl font-bold text-base sm:text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-2xl"
          >
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
            Order Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 sm:py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">MeatBirdz</h3>
              <p className="text-sm text-gray-400">
                Premium food, freshly prepared, and served properly.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#home" className="text-sm hover:text-primary-400 transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-sm hover:text-primary-400 transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#locations" className="text-sm hover:text-primary-400 transition-colors">
                    Locations
                  </a>
                </li>
                <li>
                  <Link href="/menu" className="text-sm hover:text-primary-400 transition-colors">
                    Menu
                  </Link>
                </li>
                <li>
                  <Link href="/order-online" className="text-sm hover:text-primary-400 transition-colors">
                    Order Online
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <a
                  href="https://www.instagram.com/meatbirdz?igsh=MWlpazZoOW54MWg0&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 bg-gray-800 rounded-full hover:bg-primary-600 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://www.tiktok.com/@meatbirdz?_r=1&_t=ZN-94NToQ0nLtu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 bg-gray-800 rounded-full hover:bg-primary-600 transition-colors"
                  aria-label="TikTok"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-6 mt-6 text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} MeatBirdz. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

