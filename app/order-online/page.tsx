'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Store, Truck } from 'lucide-react'

export default function OrderOnlinePage() {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState<'collection' | 'delivery' | null>(null)

  const handleSelect = (option: 'collection' | 'delivery') => {
    setSelectedOption(option)
    if (option === 'collection') {
      router.push('/order-online/collection')
    } else {
      router.push('/order-online/delivery')
    }
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 bg-gradient-to-br from-gray-50 via-white to-primary-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Order Online
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600">
            Choose how you&apos;d like to receive your order
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Collection Option */}
          <div
            onClick={() => handleSelect('collection')}
            className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-primary-500"
          >
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="bg-primary-100 p-4 sm:p-6 rounded-full">
                <Store className="w-12 h-12 sm:w-16 sm:h-16 text-primary-600" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-3 sm:mb-4 text-gray-900">
              Collection
            </h2>
            <p className="text-sm sm:text-base text-gray-600 text-center mb-4 sm:mb-6">
              Pick up your order from one of our restaurant locations. Fast and convenient!
            </p>
            <div className="text-center">
              <button className="bg-primary-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-primary-700 transition-colors">
                Select Collection
              </button>
            </div>
          </div>

          {/* Delivery Option */}
          <div
            onClick={() => handleSelect('delivery')}
            className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-primary-500"
          >
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="bg-primary-100 p-4 sm:p-6 rounded-full">
                <Truck className="w-12 h-12 sm:w-16 sm:h-16 text-primary-600" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-3 sm:mb-4 text-gray-900">
              Delivery
            </h2>
            <p className="text-sm sm:text-base text-gray-600 text-center mb-4 sm:mb-6">
              Get your order delivered straight to your door. Available in select areas.
            </p>
            <div className="text-center">
              <button className="bg-primary-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-primary-700 transition-colors">
                Select Delivery
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

