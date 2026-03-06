import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SelectedAddOn {
  addOnId: string
  name: string
  price: number
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  instructions?: string
  type?: 'menuItem'
  menuItemId?: string
  selectedAddOns?: SelectedAddOn[]
}

interface CartStore {
  items: CartItem[]
      addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number; instructions?: string }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  getDeliveryFee: () => number
  getGrandTotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existingItem = get().items.find((i) => i.id === item.id)
        if (existingItem) {
          set({
            items: get().items.map((i) =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            ),
          })
        } else {
          set({
            items: [...get().items, { ...item, quantity: item.quantity || 1, type: 'menuItem' }],
          })
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
        } else {
          set({
            items: get().items.map((i) =>
              i.id === id ? { ...i, quantity } : i
            ),
          })
        }
      },
      clearCart: () => {
        set({ items: [] })
      },
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
      getDeliveryFee: () => {
        if (typeof window === 'undefined') return 0
        const orderType = localStorage.getItem('orderType')
        if (orderType !== 'delivery') return 0
        const selectedLocation = localStorage.getItem('selectedLocation')
        if (!selectedLocation) return 0
        try {
          const location = JSON.parse(selectedLocation)
          const postalCode = location.postalCode
          if (!postalCode) return location.deliveryFee || 0
          
          // Import getDeliveryFee dynamically to avoid SSR issues
          const { getDeliveryFee } = require('@/lib/deliveryFees')
          const orderTotal = get().getTotal()
          return getDeliveryFee(postalCode, orderTotal)
        } catch {
          return 0
        }
      },
      getGrandTotal: () => {
        return get().getTotal() + get().getDeliveryFee()
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)

