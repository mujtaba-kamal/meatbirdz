'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Check, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { deliveryFees, freeDeliveryPostcodes, MINIMUM_ORDER_FOR_FREE_DELIVERY, DELIVERY_FEE_BELOW_MINIMUM } from '@/lib/deliveryFees'

const birminghamPostalCodes = [
  { code: 'B2', area: 'Birmingham City Centre' },
  { code: 'B3', area: 'Birmingham Jewellery Quarter' },
  { code: 'B4', area: 'Birmingham City Centre' },
  { code: 'B5', area: 'Birmingham Digbeth' },
  { code: 'B6', area: 'Birmingham' },
  { code: 'B7', area: 'Birmingham' },
  { code: 'B8', area: 'Birmingham' },
  { code: 'B9', area: 'Birmingham' },
  { code: 'B10', area: 'Birmingham' },
  { code: 'B11', area: 'Birmingham' },
  { code: 'B12', area: 'Birmingham' },
  { code: 'B13', area: 'Birmingham' },
  { code: 'B14', area: 'Birmingham' },
  { code: 'B25', area: 'Birmingham' },
  { code: 'B26', area: 'Birmingham' },
  { code: 'B27', area: 'Birmingham' },
  { code: 'B28', area: 'Birmingham' },
  { code: 'B33', area: 'Birmingham' },
  { code: 'B34', area: 'Birmingham' },
  { code: 'B35', area: 'Birmingham' },
]

export default function DeliveryPage() {
  const router = useRouter()
  const [selectedPostalCode, setSelectedPostalCode] = useState<string | null>(null)

  const handleSelect = (postalCode: string, area: string) => {
    setSelectedPostalCode(postalCode)
    // Store selected postal code in localStorage (delivery fee will be calculated dynamically based on order total)
    localStorage.setItem('orderType', 'delivery')
    localStorage.setItem('selectedLocation', JSON.stringify({ postalCode, area }))
    const isFreeDelivery = freeDeliveryPostcodes.includes(postalCode)
    const feeText = isFreeDelivery 
      ? `Free delivery (min order £${MINIMUM_ORDER_FOR_FREE_DELIVERY})` 
      : `Delivery fee: £${(deliveryFees[postalCode] || 0).toFixed(2)}`
    toast.success(`Selected ${area} (${postalCode}) - ${feeText}`)
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

        {/* Warning Message */}
        <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-900 mb-2 text-sm sm:text-base">
                Important: Delivery Area Restriction
              </h3>
              <p className="text-sm sm:text-base text-yellow-800 leading-relaxed">
                Please <strong>only select</strong> the postal codes listed below as we are only delivering to these areas. 
                If you are not from these areas, you can choose <strong>collection</strong> to collect your order. 
                <strong className="block mt-2">If a delivery order is placed outside these postal codes, the order will be discarded.</strong>
              </p>
            </div>
          </div>
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
                <div className="flex items-center flex-1">
                  <MapPin className="w-5 h-5 text-primary-600 mr-3" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {location.code}
                    </h3>
                    <p className="text-sm text-gray-600">{location.area}</p>
                    <div className="mt-1">
                      {freeDeliveryPostcodes.includes(location.code) ? (
                        <div>
                          <p className="text-sm font-semibold text-green-600">
                            Free delivery
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Min order: £{MINIMUM_ORDER_FOR_FREE_DELIVERY} (or £{DELIVERY_FEE_BELOW_MINIMUM.toFixed(2)} fee)
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-primary-600">
                          Delivery fee: £{(deliveryFees[location.code] || 0).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {selectedPostalCode === location.code && (
                  <Check className="w-5 h-5 text-primary-600 ml-2" />
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
