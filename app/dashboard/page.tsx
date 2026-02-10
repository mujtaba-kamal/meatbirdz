'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Clock, CheckCircle, XCircle, MapPin, Phone, Mail, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress: string
  city: string
  totalAmount: number
  status: string
  paymentStatus: string
  arrivalNotification: string | null
  arrivalAcknowledged: boolean
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    price: number
    menuItem: {
      name: string
    }
  }>
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    // Always fetch orders, even if not logged in
    fetchOrders()
  }, [session])

  // Sync guest orders when user logs in
  useEffect(() => {
    if (session?.user?.email && typeof window !== 'undefined') {
      const guestOrderEmail = localStorage.getItem('guestOrderEmail')
      if (guestOrderEmail && guestOrderEmail === session.user.email) {
        syncGuestOrders(guestOrderEmail)
      }
    }
  }, [session])

  const syncGuestOrders = async (email: string) => {
    if (syncing) return
    setSyncing(true)
    try {
      const response = await fetch('/api/orders/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (response.ok && data.syncedCount > 0) {
        toast.success(data.message)
        // Clear guest orders from localStorage after syncing
        localStorage.removeItem('guestOrders')
        localStorage.removeItem('guestOrderEmail')
        // Refresh orders
        fetchOrders()
      }
    } catch (error) {
      console.error('Error syncing orders:', error)
    } finally {
      setSyncing(false)
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      if (session?.user?.id) {
        // Fetch orders for logged-in user
        console.log('Dashboard: Fetching orders for logged-in user:', session.user.id)
        const response = await fetch('/api/orders/user')
        if (!response.ok) {
          console.error('Failed to fetch orders:', response.status, response.statusText)
          const errorData = await response.json().catch(() => ({}))
          console.error('Error data:', errorData)
        }
        const data = await response.json()
        console.log('Dashboard: Received orders:', data?.length || 0, 'orders')
        setOrders(Array.isArray(data) ? data : [])
      } else {
        // Fetch guest orders from localStorage
        if (typeof window !== 'undefined') {
          const guestOrderIds = JSON.parse(localStorage.getItem('guestOrders') || '[]')
          const guestOrderEmail = localStorage.getItem('guestOrderEmail')
          
          if (guestOrderIds.length > 0) {
            // Fetch orders by IDs
            const response = await fetch(`/api/orders/user?orderIds=${guestOrderIds.join(',')}`)
            const data = await response.json()
            setOrders(data || [])
          } else if (guestOrderEmail) {
            // Fetch orders by email
            const response = await fetch(`/api/orders/user?email=${encodeURIComponent(guestOrderEmail)}`)
            const data = await response.json()
            setOrders(data || [])
          } else {
            setOrders([])
          }
        } else {
          setOrders([])
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkArrival = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/arrival`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Arrival notification sent! Admin has been notified.')
        fetchOrders() // Refresh orders to show updated status
      } else {
        toast.error(data.error || 'Failed to mark arrival')
      }
    } catch (error) {
      console.error('Error marking arrival:', error)
      toast.error('Failed to mark arrival')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          {session ? (
            <p className="text-gray-600">
              Welcome back, {session.user?.name || session.user?.email}!
            </p>
          ) : (
            <div className="flex items-center gap-4">
              <p className="text-gray-600">View your orders</p>
              <Link
                href="/login"
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Log in to sync orders
              </Link>
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">
              Start ordering delicious food from our menu!
            </p>
            <Link
              href="/menu"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div className="mb-4 md:mb-0">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(order.status)}
                      <h3 className="text-xl font-semibold">Order #{order.id.slice(-8)}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'DELIVERED'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                    <p
                      className={`text-sm font-medium ${
                        order.paymentStatus === 'PAID'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {order.paymentStatus}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">Items Ordered</h4>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm text-gray-700"
                        >
                          <span>
                            {item.menuItem.name} x {item.quantity}
                          </span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Delivery Address
                    </h4>
                    <p className="text-sm text-gray-700">
                      {order.deliveryAddress}, {order.city}
                    </p>
                  </div>

                  {/* Arrival Button - Show for PENDING, CONFIRMED, PREPARING, or READY orders (not DELIVERED or CANCELLED) */}
                  {(order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'PREPARING' || order.status === 'READY') && (
                    <div className="border-t pt-4">
                      {order.arrivalNotification ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                            <span className="text-sm font-medium text-green-800">
                              {order.arrivalAcknowledged 
                                ? 'Admin has been notified and acknowledged your arrival'
                                : 'Arrival notification sent! Admin will be notified shortly.'}
                            </span>
                          </div>
                          {order.arrivalAcknowledged && (
                            <span className="text-xs text-green-600">
                              {new Date(order.arrivalNotification).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMarkArrival(order.id)}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-[1.02] shadow-md flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          I&apos;ve Arrived
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

