'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const birminghamPostalCodes = [
  { code: 'B1', area: 'Birmingham City Centre' },
  { code: 'B2', area: 'Birmingham City Centre' },
  { code: 'B3', area: 'Birmingham Jewellery Quarter' },
  { code: 'B4', area: 'Birmingham City Centre' },
  { code: 'B5', area: 'Birmingham Digbeth' },
  { code: 'B15', area: 'Birmingham Edgbaston' },
  { code: 'B16', area: 'Birmingham Edgbaston' },
  { code: 'B17', area: 'Birmingham Harborne' },
  { code: 'B18', area: 'Birmingham Hockley' },
  { code: 'B19', area: 'Birmingham Newtown' },
]

export default function DeliveryPage() {
  const router = useRouter()
  const [selectedPostalCode, setSelectedPostalCode] = useState<string | null>(null)

  const handleSelect = (postalCode: string, area: string) => {
    setSelectedPostalCode(postalCode)
    // Store selected postal code in localStorage
    localStorage.setItem('orderType', 'delivery')
    localStorage.setItem('selectedLocation', JSON.stringify({ postalCode, area }))
    toast.success(`Selected ${area} (${postalCode})`)
    router.push('/menu')
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 bg-gradient-to-br from-gray-50 via-white to-primary-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Select Delivery Area
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600">
            Choose your postal code for delivery
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {birminghamPostalCodes.map((location) => (
            <div
              key={location.code}
              onClick={() => handleSelect(location.code, location.area)}
              className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all transform hover:scale-105 border-2 ${
                selectedPostalCode === location.code
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-transparent hover:border-primary-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-primary-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {location.code}
                    </h3>
                    <p className="text-sm text-gray-600">{location.area}</p>
                  </div>
                </div>
                {selectedPostalCode === location.code && (
                  <Check className="w-5 h-5 text-primary-600" />
                )}
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
