'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const restaurants = [
  {
    id: 1,
    name: 'MeatBirdz Collection Point',
    address: '198 heybarnes road B10 9JF',
    phone: '0121 123 4567',
    hours: 'Sun - Thu: 17:30 - 00:00 | Fri & Sat: 17:30 - 01:00',
  },
]

export default function CollectionPage() {
  const router = useRouter()
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null)

  const handleSelect = (restaurantId: number) => {
    setSelectedRestaurant(restaurantId)
    const restaurant = restaurants.find((r) => r.id === restaurantId)
    if (restaurant) {
      // Store selected restaurant in localStorage
      localStorage.setItem('orderType', 'collection')
      localStorage.setItem('selectedLocation', JSON.stringify(restaurant))
      toast.success(`Selected ${restaurant.name}`)
      router.push('/menu')
    }
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 bg-gradient-to-br from-gray-50 via-white to-primary-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Select Restaurant
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600">
            Choose a location for collection
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              onClick={() => handleSelect(restaurant.id)}
              className={`bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 cursor-pointer transition-all transform hover:scale-105 border-2 ${
                selectedRestaurant === restaurant.id
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-transparent hover:border-primary-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-2 flex-wrap">
                    <MapPin className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" />
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      {restaurant.name}
                    </h3>
                    {selectedRestaurant === restaurant.id && (
                      <Check className="w-5 h-5 text-primary-600 ml-2 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-2 break-words">{restaurant.address}</p>
                  <p className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-2">Phone: {restaurant.phone}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{restaurant.hours}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to options
          </button>
        </div>
      </div>
    </div>
  )
}
