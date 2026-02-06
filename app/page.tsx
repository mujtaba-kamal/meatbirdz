'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, ShoppingCart, Clock, MapPin, ChefHat, Star, Shield, Zap } from 'lucide-react'

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      router.push('/admin')
    }
  }, [session, router])

  useEffect(() => {
    // Handle hash navigation when coming from other pages
    const hash = window.location.hash.replace('#', '')
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-16 sm:py-20 lg:py-24 px-4 overflow-hidden scroll-mt-16">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-full">
              <ChefHat className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
            </div>
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
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              We're passionate about serving delicious, high-quality fast food made fresh daily. 
              Our commitment to excellence has made us a favorite among food lovers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-8 sm:mt-12">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Our Story</h3>
              <p className="text-gray-600 leading-relaxed">
                Founded with a vision to bring quality fast food to everyone, MeatBirdz has been serving 
                delicious burgers, wraps, fries, and drinks since day one. We use only the freshest ingredients 
                and prepare everything with care.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To provide exceptional food experiences through quality ingredients, fast service, and 
                outstanding customer care. We believe everyone deserves great food, delivered fresh and hot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-12 sm:py-16 lg:py-20 px-4 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">Gallery</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">See what makes our food special</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl shadow-lg overflow-hidden aspect-square flex items-center justify-center"
              >
                <ChefHat className="w-24 h-24 text-primary-600 opacity-50" />
              </div>
            ))}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { name: 'Birmingham City Centre', address: '123 High Street, Birmingham B1 1AA', phone: '0121 123 4567' },
              { name: 'Birmingham Edgbaston', address: '456 Hagley Road, Birmingham B15 2TT', phone: '0121 234 5678' },
              { name: 'Birmingham Digbeth', address: '789 Digbeth High Street, Birmingham B5 6DY', phone: '0121 345 6789' },
            ].map((location, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg p-6">
                <MapPin className="w-8 h-8 text-primary-600 mb-4" />
                <h3 className="text-xl font-bold mb-2 text-gray-900">{location.name}</h3>
                <p className="text-gray-600 mb-2">{location.address}</p>
                <p className="text-gray-600">{location.phone}</p>
              </div>
            ))}
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
    </div>
  )
}

