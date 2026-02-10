'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Package, Bell, BellRing, X, Banknote, CreditCard, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

interface OrderItem {
  id: string
  quantity: number
  price: number
  menuItem: {
    id: string
    name: string
  }
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
  stripePaymentId: string | null
  arrivalNotification: string | null
  arrivalAcknowledged: boolean
  items: OrderItem[]
  createdAt: string
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-primary-100 text-primary-800',
  PREPARING: 'bg-purple-100 text-purple-800',
  READY: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated or not an admin
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    // Only redirect non-admin users if they're authenticated but not admin
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/')
      return
    }
    
    // If authenticated and admin, stay on admin page
    // Don't redirect if already on admin page
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchOrders()
      // Refresh every 30 seconds
      const interval = setInterval(fetchOrders, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast.success('Order status updated')
        fetchOrders()
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status })
        }
      } else {
        toast.error('Failed to update order status')
      }
    } catch (error) {
      toast.error('Failed to update order status')
    }
  }

  const markAsPaid = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/orders/${orderId}/mark-paid`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Order marked as paid')
        fetchOrders()
        // Update selected order if it's the one being marked as paid
        if (selectedOrder?.id === orderId) {
          const updatedOrder = orders.find(o => o.id === orderId)
          if (updatedOrder) {
            setSelectedOrder({ ...updatedOrder, paymentStatus: 'PAID' })
          }
        }
      } else {
        toast.error('Failed to mark order as paid')
      }
    } catch (error) {
      toast.error('Failed to mark order as paid')
    }
  }

  const acknowledgeArrival = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selecting the order
    try {
      const response = await fetch(`/api/orders/${orderId}/acknowledge-arrival`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Arrival acknowledged')
        fetchOrders()
        if (selectedOrder?.id === orderId) {
          const updatedOrder = orders.find(o => o.id === orderId)
          if (updatedOrder) {
            setSelectedOrder({ ...updatedOrder, arrivalAcknowledged: true })
          }
        }
      } else {
        toast.error('Failed to acknowledge arrival')
      }
    } catch (error) {
      toast.error('Failed to acknowledge arrival')
    }
  }

  // Get orders with unacknowledged arrivals
  const arrivalNotifications = orders.filter(
    order => order.arrivalNotification && !order.arrivalAcknowledged
  )

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  // Show loading while checking authentication
  if (status === 'unauthenticated') {
    return null // Will redirect via useEffect
  }

  // If authenticated but not admin, return null (will redirect via useEffect)
  if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
    return null
  }

  // If no session or not admin after loading, don't render
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen py-6 sm:py-8 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Manage orders and track deliveries</p>
        </div>

        {/* Arrival Notifications Banner - Prominent Display */}
        {arrivalNotifications.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-xl p-6 border-4 border-orange-300 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <BellRing className="w-8 h-8 text-white mr-3 animate-bounce" />
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {arrivalNotifications.length} Customer{arrivalNotifications.length > 1 ? 's' : ''} Arrived!
                  </h2>
                  <p className="text-orange-100">Click to view order details</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {arrivalNotifications.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white/95 rounded-lg p-4 cursor-pointer hover:bg-white transition-colors flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className="w-5 h-5 text-orange-600" />
                      <span className="font-bold text-gray-900">{order.customerName}</span>
                      <span className="text-sm text-gray-600">
                        - Order #{order.id.slice(-8)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Arrived at {new Date(order.arrivalNotification!).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => acknowledgeArrival(order.id, e)}
                    className="ml-4 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Orders List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-primary-100">
                  <Package className="w-16 h-16 mx-auto text-primary-300 mb-4" />
                  <p className="text-gray-600">No orders yet</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all border border-primary-100 hover:border-primary-300"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                          {order.customerName}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-bold text-base sm:text-lg text-primary-600">
                          ${order.totalAmount.toFixed(2)}
                        </p>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${
                            statusColors[order.status] || statusColors.PENDING
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        {order.items.length} item(s)
                      </p>
                      <div className="flex items-center gap-2">
                        {order.arrivalNotification && !order.arrivalAcknowledged && (
                          <span className="flex items-center bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                            <BellRing className="w-3 h-3 mr-1" />
                            ARRIVED
                          </span>
                        )}
                        {order.paymentStatus === 'PAID' ? (
                          <span className="flex items-center text-green-600 text-sm font-semibold">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Paid
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            {!order.stripePaymentId ? (
                              <span className="flex items-center bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold">
                                {order.deliveryAddress.includes('High Street') || order.deliveryAddress.includes('Hagley Road') || order.deliveryAddress.includes('Digbeth') ? (
                                  <>
                                    <CreditCard className="w-3 h-3 mr-1" />
                                    Pay at Collection
                                  </>
                                ) : (
                                  <>
                                    <Banknote className="w-3 h-3 mr-1" />
                                    COD
                                  </>
                                )}
                              </span>
                            ) : (
                              <span className="flex items-center text-red-600 text-sm">
                                <XCircle className="w-4 h-4 mr-1" />
                                {order.paymentStatus}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Order Details Sidebar */}
          <div className="lg:col-span-1 order-3">
            {selectedOrder ? (
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-24 border border-primary-100">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Order Details</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="font-semibold mb-2">Customer Info</h3>
                    <p className="text-sm text-gray-700">{selectedOrder.customerName}</p>
                    <p className="text-sm text-gray-700">{selectedOrder.customerEmail}</p>
                    <p className="text-sm text-gray-700">{selectedOrder.customerPhone}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Delivery Address</h3>
                    <p className="text-sm text-gray-700">
                      {selectedOrder.deliveryAddress}
                      <br />
                      {selectedOrder.city} {selectedOrder.postalCode}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Payment Status</h3>
                    <div className="mb-3">
                      {selectedOrder.paymentStatus === 'PAID' ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                            <span className="font-semibold text-green-800">Paid</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              {!selectedOrder.stripePaymentId ? (
                                <>
                                  {selectedOrder.deliveryAddress.includes('High Street') || selectedOrder.deliveryAddress.includes('Hagley Road') || selectedOrder.deliveryAddress.includes('Digbeth') ? (
                                    <>
                                      <CreditCard className="w-5 h-5 text-orange-600 mr-2" />
                                      <span className="font-semibold text-orange-800">Pay at Collection</span>
                                    </>
                                  ) : (
                                    <>
                                      <Banknote className="w-5 h-5 text-orange-600 mr-2" />
                                      <span className="font-semibold text-orange-800">Cash on Delivery</span>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  <DollarSign className="w-5 h-5 text-orange-600 mr-2" />
                                  <span className="font-semibold text-orange-800">Online Payment - {selectedOrder.paymentStatus}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => markAsPaid(selectedOrder.id, e)}
                            className="mt-2 w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <DollarSign className="w-4 h-4" />
                            Mark as Paid
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Items</h3>
                    <div className="space-y-1">
                      {selectedOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.menuItem.name} x {item.quantity}
                          </span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${selectedOrder.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Arrival Notification */}
                  {selectedOrder.arrivalNotification && (
                    <div className={`border-t pt-4 ${selectedOrder.arrivalAcknowledged ? 'opacity-60' : ''}`}>
                      <div className={`p-3 rounded-lg ${selectedOrder.arrivalAcknowledged ? 'bg-gray-100' : 'bg-orange-50 border-2 border-orange-300'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <BellRing className={`w-5 h-5 mr-2 ${selectedOrder.arrivalAcknowledged ? 'text-gray-500' : 'text-orange-600'}`} />
                            <span className={`font-semibold ${selectedOrder.arrivalAcknowledged ? 'text-gray-600' : 'text-orange-800'}`}>
                              Customer Arrived
                            </span>
                          </div>
                          {selectedOrder.arrivalAcknowledged && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-700">
                          {selectedOrder.customerName} arrived at {new Date(selectedOrder.arrivalNotification).toLocaleTimeString()}
                        </p>
                        {!selectedOrder.arrivalAcknowledged && (
                          <button
                            onClick={() => acknowledgeArrival(selectedOrder.id, {} as React.MouseEvent)}
                            className="mt-2 w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Acknowledge Arrival
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Update Status</h3>
                  <div className="space-y-2">
                    {['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() =>
                            updateOrderStatus(selectedOrder.id, status)
                          }
                          disabled={selectedOrder.status === status}
                          className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedOrder.status === status
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                        >
                          Mark as {status}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center text-gray-500 border border-primary-100">
                Select an order to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

