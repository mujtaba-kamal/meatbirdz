'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, MapPin, Phone, Mail, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface OrderItem {
  id: string
  quantity: number
  price: number
  menuItem: {
    id: string
    name: string
    price: number
  } | null
}

interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress: string
  city: string
  postalCode: string | null
  totalAmount: number
  status: string
  paymentStatus: string
  arrivalNotification: string | null
  arrivalAcknowledged: boolean
  items: OrderItem[]
  createdAt: string
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const paymentIntentId = searchParams.get('paymentIntentId')
  const cod = searchParams.get('cod')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Create order if it doesn't exist yet
    if (orderId) {
      fetchOrder(orderId)
    } else if (paymentIntentId || cod) {
      createOrderFromConfirmation()
    } else {
      setLoading(false)
    }
  }, [orderId, paymentIntentId, cod])

  const createOrderFromConfirmation = async () => {
    try {
      let orderData: any = null

      if (cod) {
        // Get COD order data from sessionStorage
        const codData = sessionStorage.getItem('pendingCODOrder')
        if (!codData) {
          throw new Error('Order data not found')
        }
        const codOrderData = JSON.parse(codData)
        
        // Get customer info from checkout form (stored in sessionStorage)
        const checkoutData = sessionStorage.getItem('pendingOrderData')
        if (!checkoutData) {
          throw new Error('Customer info not found')
        }
        const checkout = JSON.parse(checkoutData)
        
        orderData = {
          items: codOrderData.items,
          customerInfo: checkout.customerInfo,
          total: codOrderData.total,
          orderType: codOrderData.orderType,
        }
      } else if (paymentIntentId) {
        // Get order data from sessionStorage
        const storedData = sessionStorage.getItem('pendingOrderData')
        if (!storedData) {
          throw new Error('Order data not found')
        }
        orderData = JSON.parse(storedData)
        orderData.paymentIntentId = paymentIntentId
      }

      if (!orderData) {
        throw new Error('No order data available')
      }

      // Log what we're sending
      console.log('📤 Sending order data:', {
        itemsCount: orderData.items?.length || 0,
        items: orderData.items?.slice(0, 2).map((item: any) => ({
          id: item.id,
          name: item.name,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
        })),
        customerInfo: {
          name: orderData.customerInfo?.customerName,
          email: orderData.customerInfo?.customerEmail,
        },
        total: orderData.total,
      })

      // Create order
      const response = await fetch('/api/orders/create-from-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ Order creation failed:', {
          status: response.status,
          error: data.error,
          details: data.details,
          code: data.code,
          meta: data.meta,
        })
        const errorMessage = data.details || data.error || 'Failed to create order'
        throw new Error(errorMessage)
      }

      // Clear sessionStorage
      sessionStorage.removeItem('pendingOrderData')
      sessionStorage.removeItem('pendingCODOrder')

      // Store order ID in localStorage for guest orders
      if (typeof window !== 'undefined' && data.order) {
        const guestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]')
        if (!guestOrders.includes(data.orderId)) {
          guestOrders.push(data.orderId)
          localStorage.setItem('guestOrders', JSON.stringify(guestOrders))
        }
        if (data.order.customerEmail) {
          localStorage.setItem('guestOrderEmail', data.order.customerEmail)
        }
      }

      setOrder(data.order)
    } catch (error: any) {
      console.error('❌ Error creating order:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      })
      const errorMessage = error.message || 'Failed to create order. Please try again or contact support.'
      toast.error(errorMessage)
      setLoading(false)
    }
  }

  const fetchOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`)
      const data = await response.json()
      setOrder(data)
      
      // Store order ID in localStorage for guest orders
      if (typeof window !== 'undefined' && data) {
        const guestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]')
        if (!guestOrders.includes(id)) {
          guestOrders.push(id)
          localStorage.setItem('guestOrders', JSON.stringify(guestOrders))
        }
        // Also store order email for syncing later
        if (data.customerEmail) {
          localStorage.setItem('guestOrderEmail', data.customerEmail)
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkArrival = async () => {
    if (!order) return
    
    try {
      const response = await fetch(`/api/orders/${order.id}/arrival`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Arrival notification sent! Admin has been notified.')
        // Refresh order to show updated status
        if (order.id) {
          fetchOrder(order.id)
        }
      } else {
        toast.error(data.error || 'Failed to mark arrival')
      }
    } catch (error) {
      console.error('Error marking arrival:', error)
      toast.error('Failed to mark arrival')
    }
  }

  // Check if order is a collection order
  const isCollectionOrder = order && (
    order.deliveryAddress.includes('High Street') ||
    order.deliveryAddress.includes('Hagley Road') ||
    order.deliveryAddress.includes('Digbeth')
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading order details...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <Link
            href="/menu"
            className="text-primary-600 hover:underline"
          >
            Return to menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h1 className="text-4xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your order. We&apos;ll prepare it right away.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Order Details</h2>
          <div className="space-y-2 mb-6">
            <p>
              <span className="font-semibold">Order ID:</span> {order.id}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{' '}
              <span className="capitalize">{order.status.toLowerCase()}</span>
            </p>
            <p>
              <span className="font-semibold">Payment Status:</span>{' '}
              <span className="capitalize text-green-600">
                {order.paymentStatus.toLowerCase()}
              </span>
            </p>
          </div>

          <div className="border-t pt-4 mb-6">
            <h3 className="font-semibold mb-3">Items Ordered</h3>
            <div className="space-y-2">
              {order.items.map((item) => {
                // Handle null menuItem (for meal items or invalid menuItemIds)
                const itemName = item.menuItem?.name || 'Unknown Item'
                return (
                  <div
                    key={item.id}
                    className="flex justify-between items-center"
                  >
                    <span>
                      {itemName} x {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                )
              })}
            </div>
            <div className="border-t mt-4 pt-4 flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary-600">
                ${order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Delivery Address
            </h3>
            <p className="text-gray-700">
              {order.deliveryAddress}
              <br />
              {order.city} {order.postalCode && order.postalCode}
            </p>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-3">Contact Information</h3>
            <div className="space-y-2 text-gray-700">
              <p className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                {order.customerEmail}
              </p>
              <p className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                {order.customerPhone}
              </p>
            </div>
          </div>

          {/* Arrival Button for Collection Orders */}
          {isCollectionOrder && (order.status === 'CONFIRMED' || order.status === 'PREPARING' || order.status === 'READY') && (
            <div className="border-t pt-4 mt-4">
              {order.arrivalNotification ? (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <span className="text-sm font-medium text-green-800 block">
                        {order.arrivalAcknowledged 
                          ? 'Admin has been notified and acknowledged your arrival'
                          : 'Arrival notification sent! Admin will be notified shortly.'}
                      </span>
                      {order.arrivalAcknowledged && (
                        <span className="text-xs text-green-600">
                          Arrived at {new Date(order.arrivalNotification).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleMarkArrival}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-[1.02] shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  I&apos;ve Arrived
                </button>
              )}
            </div>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/menu"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Order Again
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading order confirmation...</div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  )
}

