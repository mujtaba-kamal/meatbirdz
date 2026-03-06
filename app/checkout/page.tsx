'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useCartStore } from '@/store/cartStore'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Store, Truck } from 'lucide-react'
import { freeDeliveryPostcodes, MINIMUM_ORDER_FOR_FREE_DELIVERY, DELIVERY_FEE_BELOW_MINIMUM } from '@/lib/deliveryFees'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { items, getTotal, getDeliveryFee, getGrandTotal, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [orderType, setOrderType] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [isFreeDeliveryPostcode, setIsFreeDeliveryPostcode] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    city: '',
    postalCode: '',
    carDetails: '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Only run on client side after mount
    if (!mounted || typeof window === 'undefined') return
    
    // Get selected location from localStorage
    const storedOrderType = localStorage.getItem('orderType')
    const storedLocation = localStorage.getItem('selectedLocation')
    
    if (storedOrderType && storedLocation) {
      const parsedLocation = JSON.parse(storedLocation)
      setOrderType(storedOrderType)
      setSelectedLocation(parsedLocation)

      const postalCode = storedOrderType === 'delivery' 
        ? parsedLocation?.postalCode || '' 
        : parsedLocation?.address?.split(',').pop()?.trim() || ''
      
      // Check if it's a free delivery postcode
      if (storedOrderType === 'delivery' && postalCode && freeDeliveryPostcodes.includes(postalCode)) {
        setIsFreeDeliveryPostcode(true)
      }

      if (session?.user) {
        setFormData({
          customerName: session.user.name || '',
          customerEmail: session.user.email || '',
          customerPhone: '',
          deliveryAddress: storedOrderType === 'delivery' ? '' : parsedLocation?.address || '',
          city: 'Birmingham',
          postalCode: postalCode,
          carDetails: '',
        })
      } else {
        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          deliveryAddress: storedOrderType === 'delivery' ? '' : parsedLocation?.address || '',
          city: 'Birmingham',
          postalCode: postalCode,
          carDetails: '',
        })
      }
    } else {
      toast.error('Please select a location first')
      router.push('/order-online')
    }
  }, [session, router, mounted]) // Added mounted to dependencies

  const subtotal = getTotal()
  const deliveryFee = getDeliveryFee()
  const total = getGrandTotal()

  // Don't render until mounted (prevents SSR issues)
  if (!mounted) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          customerInfo: formData,
          total,
          deliveryFee: deliveryFee,
        }),
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error('Server returned an error. Please check your Stripe configuration.')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment')
      }

      // Store order data temporarily for confirmation page
      if (typeof window !== 'undefined' && data.paymentIntentId) {
        sessionStorage.setItem('pendingOrderData', JSON.stringify({
          items,
          customerInfo: formData,
          total,
          deliveryFee: deliveryFee,
          paymentIntentId: data.paymentIntentId,
          orderType: orderType,
        }))
      }

      // Redirect to Stripe Checkout
      if (data.clientSecret) {
        // For Stripe Elements integration - pass orderType
        const orderTypeParam = orderType ? `&orderType=${orderType}` : ''
        router.push(`/payment?clientSecret=${data.clientSecret}&paymentIntentId=${data.paymentIntentId}${orderTypeParam}`)
      } else if (data.checkoutUrl) {
        // For Stripe Checkout redirect
        if (typeof window !== 'undefined') {
          window.location.href = data.checkoutUrl
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process checkout')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  return (
    <div className="min-h-screen py-6 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>£{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                {isFreeDeliveryPostcode && subtotal < MINIMUM_ORDER_FOR_FREE_DELIVERY && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      Add £{(MINIMUM_ORDER_FOR_FREE_DELIVERY - subtotal).toFixed(2)} more for free delivery
                    </p>
                  </div>
                )}
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>£{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {isFreeDeliveryPostcode && subtotal >= MINIMUM_ORDER_FOR_FREE_DELIVERY && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Delivery Fee</span>
                    <span>Free</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary-600">
                    £{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="mb-6 pb-4 border-b">
                <div className="flex items-center mb-2">
                  {orderType === 'collection' ? (
                    <Store className="w-5 h-5 text-primary-600 mr-2" />
                  ) : (
                    <Truck className="w-5 h-5 text-primary-600 mr-2" />
                  )}
                  <h2 className="text-xl font-bold">
                    {orderType === 'collection' ? 'Collection Information' : 'Delivery Information'}
                  </h2>
                </div>
                {orderType === 'collection' && selectedLocation && (
                  <p className="text-sm text-gray-600">
                    Collecting from: <strong>{selectedLocation.name}</strong>
                    <br />
                    {selectedLocation.address}
                  </p>
                )}
                {orderType === 'delivery' && selectedLocation && (
                  <p className="text-sm text-gray-600">
                    Delivering to: <strong>{selectedLocation.area} ({selectedLocation.postalCode})</strong>
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, customerEmail: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.customerPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, customerPhone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {orderType === 'delivery' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Delivery Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.deliveryAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deliveryAddress: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Street address"
                    />
                  </div>
                )}

                {orderType === 'collection' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Car Details (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.carDetails}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          carDetails: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your car details e.g. registration number, color, make, model etc"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

