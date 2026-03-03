'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { ShoppingCart, Home, User, LogOut, ChefHat, Menu, X } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useRouter } from 'next/navigation'
import Logo from './Logo'

export default function Navbar() {
  const { data: session, status } = useSession()
  const itemCount = useCartStore((state) => state.getItemCount())
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Close mobile menu when route changes
    setMobileMenuOpen(false)
  }, [router])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated' && session
  const isAdmin = isAuthenticated && session?.user?.role === 'ADMIN'

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false)
    // If we're on the home page, scroll to section
    if (window.location.pathname === '/') {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    // Otherwise, navigate to home page with hash
    router.push(`/#${sectionId}`)
  }

  return (
    <nav className={`shadow-lg sticky top-0 z-50 border-b relative ${isAdmin ? 'bg-primary-900 border-primary-800' : 'bg-white border-gray-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Logo isAdmin={isAdmin} showText={false} />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : isAdmin ? (
              // Admin only sees admin portal and logout
              <div className="flex items-center space-x-2 pl-2 border-l border-primary-700">
                <span className="text-sm text-primary-100 hidden sm:block">
                  {session.user.name || session.user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-primary-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-primary-800"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : isAuthenticated ? (
              // Regular users see navigation menu
              <>
                <a
                  href="#home"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection('home')
                  }}
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  Home
                </a>
                <a
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection('about')
                  }}
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  About
                </a>
                <a
                  href="#locations"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection('locations')
                  }}
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  Locations
                </a>
                <Link
                  href="/order-online"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Order Online
                </Link>
                <Link
                  href="/cart"
                  className="relative text-gray-700 hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
                  title="Cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {mounted && itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      {itemCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
                  title="Dashboard"
                >
                  <User className="w-5 h-5" />
                </Link>
                <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
                  {session.user.name || session.user.email ? (
                    <span className="text-sm text-gray-600 hidden xl:block">
                      {session.user.name || session.user.email}
                    </span>
                  ) : null}
                  <button
                    onClick={handleSignOut}
                    className="text-gray-700 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              // Not logged in
              <>
                <a
                  href="#home"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection('home')
                  }}
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  Home
                </a>
                <a
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection('about')
                  }}
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  About
                </a>
                <a
                  href="#locations"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection('locations')
                  }}
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  Locations
                </a>
                <Link
                  href="/order-online"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Order Online
                </Link>
                <Link
                  href="/cart"
                  className="relative text-gray-700 hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
                  title="Cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {mounted && itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      {itemCount}
                    </span>
                  )}
                </Link>
                <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-primary-600 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <Link
              href="/cart"
              className="relative text-gray-700 hover:text-primary-600 transition-colors p-2"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${isAdmin ? 'text-primary-100 hover:bg-primary-800' : 'text-gray-700 hover:bg-gray-100'}`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className={`lg:hidden border-t ${isAdmin ? 'border-primary-800' : 'border-gray-200'}`}>
            <div className={`px-2 pt-2 pb-3 space-y-1 ${isAdmin ? 'bg-primary-900' : 'bg-white'}`}>
              {isAdmin ? (
                <div className="px-3 py-2">
                  <p className={`text-sm mb-2 ${isAdmin ? 'text-primary-100' : 'text-gray-600'}`}>
                    {session?.user?.name || session?.user?.email}
                  </p>
                  <button
                    onClick={handleSignOut}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${isAdmin ? 'text-primary-100 hover:bg-primary-800' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Sign Out
                  </button>
                </div>
              ) : isAuthenticated ? (
                <>
                  <a
                    href="#home"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection('home')
                    }}
                    className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Home
                  </a>
                  <a
                    href="#about"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection('about')
                    }}
                    className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    About
                  </a>
                  <a
                    href="#locations"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection('locations')
                    }}
                    className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Locations
                  </a>
                  <Link
                    href="/order-online"
                    className="block px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Order Online
                  </Link>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <p className="px-3 py-2 text-sm text-gray-600">
                      {session.user.name || session.user.email}
                    </p>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <a
                    href="#home"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection('home')
                    }}
                    className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Home
                  </a>
                  <a
                    href="#about"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection('about')
                    }}
                    className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    About
                  </a>
                  <a
                    href="#locations"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection('locations')
                    }}
                    className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Locations
                  </a>
                  <Link
                    href="/order-online"
                    className="block px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Order Online
                  </Link>
                  <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                    <Link
                      href="/login"
                      className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="block px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

