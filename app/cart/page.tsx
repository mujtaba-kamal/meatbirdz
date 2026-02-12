'use client'

import { useCartStore } from '@/store/cartStore'
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, getTotal, clearCart } =
    useCartStore()

  const total = getTotal()

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
          <Link
            href="/menu"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b last:border-b-0 gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base sm:text-lg truncate">{item.name}</h3>
                <p className="text-gray-600 text-sm">£{item.price.toFixed(2)} each</p>
                {item.selectedMealOptions && item.selectedMealOptions.length > 0 && (
                  <div className="mt-1 text-xs text-gray-500">
                    <div className="font-semibold mb-1">Includes:</div>
                    {item.selectedMealOptions.map((option, idx) => (
                      <div key={idx} className="ml-2">
                        • {option.menuItemName}
                        {option.additionalPrice > 0 && (
                          <span className="text-primary-600"> (+£{option.additionalPrice.toFixed(2)})</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {item.instructions && (
                  <p className="text-xs sm:text-sm text-primary-600 mt-1 italic">
                    Note: {item.instructions}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="font-semibold text-base sm:text-lg min-w-[80px] text-right">
                  £{(item.price * item.quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-semibold">Total</span>
            <span className="text-2xl font-bold text-primary-600">
              £{total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/menu"
            className="flex-1 text-center bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Continue Shopping
          </Link>
          <button
            onClick={() => router.push('/checkout')}
            className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  )
}

