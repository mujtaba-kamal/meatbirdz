'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import toast from 'react-hot-toast'
import { useCartStore } from '@/store/cartStore'
import { Banknote, CreditCard } from 'lucide-react'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

function CheckoutForm({ paymentIntentId, orderType }: { paymentIntentId: string | null; orderType: string | null }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [codLoading, setCodLoading] = useState(false)
  const clearCart = useCartStore((state) => state.clearCart)
  const { items, getTotal, getDeliveryFee, getGrandTotal } = useCartStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${typeof window !== 'undefined' ? window.location.origin : ''}/order-confirmation?paymentIntentId=${paymentIntentId}`,
        },
        redirect: 'if_required',
      })

      if (error) {
        toast.error(error.message || 'Payment failed')
        setLoading(false)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        clearCart()
        toast.success('Payment successful!')
        router.push(`/order-confirmation?paymentIntentId=${paymentIntentId}`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment failed')
      setLoading(false)
    }
  }

  const handleCOD = async () => {
    setCodLoading(true)
    try {
      // Get customer info from sessionStorage (stored when creating payment intent)
      const storedData = sessionStorage.getItem('pendingOrderData')
      if (!storedData) {
        throw new Error('Order data not found. Please go back to checkout.')
      }
      
      const checkoutData = JSON.parse(storedData)
      
      // Store COD order data temporarily
      const deliveryFee = getDeliveryFee()
      const codOrderData = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          selectedAddOns: item.selectedAddOns || null,
        })),
        total: getGrandTotal(),
        deliveryFee: deliveryFee,
        orderType: orderType,
      }
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingCODOrder', JSON.stringify(codOrderData))
      }

      clearCart()
      toast.success(orderType === 'delivery' ? 'Order placed! Pay cash on delivery.' : 'Order placed! Pay at collection.')
      router.push(`/order-confirmation?cod=true`)
    } catch (error: any) {
      console.error('Error processing COD order:', error)
      toast.error(error.message || 'Failed to place order')
      setCodLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* COD/Pay at Collection Option */}
      {(orderType === 'delivery' || orderType === 'collection') && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              {orderType === 'delivery' ? (
                <Banknote className="w-6 h-6 text-green-700" />
              ) : (
                <CreditCard className="w-6 h-6 text-green-700" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {orderType === 'delivery' ? 'Cash on Delivery' : 'Pay at Collection'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {orderType === 'delivery' 
                  ? 'Pay with cash when your order is delivered'
                  : 'Pay with cash or card when you collect your order'}
              </p>
              <button
                onClick={handleCOD}
                disabled={codLoading}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {codLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Placing Order...
                  </>
                ) : (
                  <>
                    {orderType === 'delivery' ? (
                      <>
                        <Banknote className="w-5 h-5" />
                        Place Order (Cash on Delivery)
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Place Order (Pay at Collection)
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Divider */}
      {(orderType === 'delivery' || orderType === 'collection') && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>
      )}

      {/* Stripe Payment Option */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Pay Online</h3>
      <PaymentElement />
        </div>
      <button
        type="submit"
        disabled={!stripe || loading}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
    </div>
  )
}

function PaymentPageContent() {
  const searchParams = useSearchParams()
  const clientSecret = searchParams.get('clientSecret')
  const paymentIntentId = searchParams.get('paymentIntentId')
  const orderType = searchParams.get('orderType')
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!clientSecret && !paymentIntentId) {
      router.push('/cart')
    }
  }, [clientSecret, paymentIntentId, router])

  // Get orderType from localStorage if not in URL
  const getOrderType = () => {
    if (orderType) return orderType
    if (typeof window !== 'undefined') {
      return localStorage.getItem('orderType')
    }
    return null
  }

  const finalOrderType = getOrderType()

  if (!mounted) {
    return null
  }

  if (!clientSecret && !paymentIntentId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Invalid payment session</p>
          <button
            onClick={() => router.push('/cart')}
            className="text-primary-600 hover:underline"
          >
            Return to cart
          </button>
        </div>
      </div>
    )
  }

  // If COD is selected, we don't need Stripe
  if (!clientSecret && stripePromise) {
    const options = {
      clientSecret: '', // Will be set if needed
      appearance: {
        theme: 'stripe' as const,
      },
    }

    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Complete Your Order</h1>
          <div className="bg-white rounded-lg shadow-md p-6">
            <CheckoutForm paymentIntentId={paymentIntentId} orderType={finalOrderType} />
          </div>
        </div>
      </div>
    )
  }

  const options = {
    clientSecret: clientSecret || '',
    appearance: {
      theme: 'stripe' as const,
    },
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Complete Your Payment</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          {clientSecret && stripePromise ? (
          <Elements stripe={stripePromise} options={options}>
              <CheckoutForm paymentIntentId={paymentIntentId} orderType={finalOrderType} />
          </Elements>
          ) : (
            <CheckoutForm paymentIntentId={paymentIntentId} orderType={finalOrderType} />
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading payment...</div>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  )
}

