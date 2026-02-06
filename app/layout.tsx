import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MeatBirdz - Fast Food Online Ordering',
  description: 'Order delicious burgers, wraps, fries, and drinks online',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
            {children}
          </main>
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  )
}

