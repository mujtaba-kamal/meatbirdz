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

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

function CheckoutForm({ orderId }: { orderId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const clearCart = useCartStore((state) => state.clearCart)

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
          return_url: `${window.location.origin}/order-confirmation?orderId=${orderId}`,
        },
        redirect: 'if_required',
      })

      if (error) {
        toast.error(error.message || 'Payment failed')
        setLoading(false)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        clearCart()
        toast.success('Payment successful!')
        router.push(`/order-confirmation?orderId=${orderId}`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment failed')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full mt-6 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  )
}

function PaymentPageContent() {
  const searchParams = useSearchParams()
  const clientSecret = searchParams.get('clientSecret')
  const orderId = searchParams.get('orderId')
  const router = useRouter()

  useEffect(() => {
    if (!clientSecret || !orderId) {
      router.push('/cart')
    }
  }, [clientSecret, orderId, router])

  if (!clientSecret || !orderId || !stripePromise) {
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

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Complete Your Payment</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm orderId={orderId} />
          </Elements>
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

