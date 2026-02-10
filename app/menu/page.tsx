'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { Plus, Minus, MapPin, Store, Truck, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  image: string | null
  available: boolean
}

const categories = [
  { id: 'burger', name: 'Burgers', emoji: '🍔' },
  { id: 'wrap', name: 'Wraps', emoji: '🌯' },
  { id: 'fries', name: 'Fries', emoji: '🍟' },
  { id: 'side', name: 'Sides', emoji: '🥔' },
  { id: 'box', name: 'Boxes', emoji: '📦' },
  { id: 'drink', name: 'Drinks', emoji: '🥤' },
  { id: 'dip', name: 'Dips', emoji: '🥣' },
]

export default function MenuPage() {
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [orderType, setOrderType] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({})
  const [itemInstructions, setItemInstructions] = useState<Record<string, string>>({})
  const [meals, setMeals] = useState<any[]>([])
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null)
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    // Check if location is selected
    const storedOrderType = localStorage.getItem('orderType')
    const storedLocation = localStorage.getItem('selectedLocation')
    
    if (storedOrderType && storedLocation) {
      setOrderType(storedOrderType)
      setSelectedLocation(JSON.parse(storedLocation))
    } else {
      // Redirect to order online page if no location selected
      router.push('/order-online')
    }
    
    fetchMenuItems()
    fetchMeals()
  }, [router])

  const fetchMeals = async () => {
    try {
      const response = await fetch('/api/meals')
      if (response.ok) {
        const data = await response.json()
        setMeals(data.filter((meal: any) => meal.available))
      }
    } catch (error) {
      console.error('Error fetching meals:', error)
    }
  }

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu')
      if (!response.ok) {
        throw new Error('Failed to fetch menu')
      }
      const data = await response.json()
      // Ensure data is an array
      if (Array.isArray(data)) {
        setMenuItems(data)
        // Initialize quantities to 1 for all items
        const initialQuantities: Record<string, number> = {}
        data.forEach((item: MenuItem) => {
          initialQuantities[item.id] = 1
        })
        setItemQuantities(initialQuantities)
      } else {
        console.error('Menu API returned non-array data:', data)
        toast.error('Failed to load menu: Invalid data format')
        setMenuItems([])
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
      toast.error('Failed to load menu')
      setMenuItems([])
    } finally {
      setLoading(false)
    }
  }

  const filteredItems =
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory)

  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const updateQuantity = (itemId: string, change: number) => {
    setItemQuantities((prev) => {
      const current = prev[itemId] || 1
      const newQuantity = Math.max(1, current + change)
      return { ...prev, [itemId]: newQuantity }
    })
  }

  const handleAddToCart = (item: MenuItem) => {
    if (!item.available) {
      toast.error('This item is currently unavailable')
      return
    }
    if (!orderType || !selectedLocation) {
      toast.error('Please select a location first')
      router.push('/order-online')
      return
    }
    
    const quantity = itemQuantities[item.id] || 1
    const instructions = itemInstructions[item.id] || ''
    
    // Add item with quantity
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image || undefined,
        instructions: instructions || undefined,
        type: 'menuItem',
        menuItemId: item.id,
      })
    }
    
    toast.success(`${quantity}x ${item.name} added to cart`)
    
    // Reset quantity and instructions for this item
    setItemQuantities((prev) => ({ ...prev, [item.id]: 1 }))
    setItemInstructions((prev) => {
      const newInstructions = { ...prev }
      delete newInstructions[item.id]
      return newInstructions
    })
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      newSet.delete(item.id)
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading menu...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 pt-20 sm:pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Location Banner */}
        {orderType && selectedLocation && (
          <div className="mb-6 sm:mb-8 bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-primary-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center">
                {orderType === 'collection' ? (
                  <Store className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 mr-3" />
                ) : (
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 mr-3" />
                )}
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    {orderType === 'collection' ? 'Collection from' : 'Delivery to'}
                  </p>
                  <p className="font-bold text-base sm:text-lg text-gray-900">
                    {orderType === 'collection'
                      ? selectedLocation.name
                      : `${selectedLocation.area} (${selectedLocation.postalCode})`}
                  </p>
                  {orderType === 'collection' && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">{selectedLocation.address}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => router.push('/order-online')}
                className="text-primary-600 hover:text-primary-700 font-medium text-xs sm:text-sm"
              >
                Change Location
              </button>
            </div>
          </div>
        )}

        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 sm:mb-4">Our Menu</h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">Delicious food made fresh for you</p>
        </div>

        {/* Category Filter - Sticky and Scrollable on Mobile */}
        <div className="sticky top-16 sm:top-20 z-40 bg-gradient-to-br from-gray-50 via-white to-primary-50 pb-4 sm:pb-0 -mx-4 sm:mx-0 px-4 sm:px-0 mb-6 sm:mb-12">
          <div className="flex overflow-x-auto gap-2 sm:gap-3 pb-2 sm:pb-0 sm:flex-wrap sm:justify-center scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all transform hover:scale-105 whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              All Items
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all transform hover:scale-105 whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                }`}
              >
                <span className="text-lg sm:text-xl mr-2">{category.emoji}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Meals Section */}
        {meals.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Meal Deals</h2>
            <p className="text-gray-600 mb-4 sm:mb-6">Select one meal deal to add to your order</p>
            <div className="space-y-3 sm:space-y-4">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className={`bg-white rounded-xl sm:rounded-2xl shadow-md border-2 transition-all ${
                    selectedMeal === meal.id
                      ? 'border-primary-500 shadow-lg'
                      : 'border-gray-200 hover:shadow-lg'
                  }`}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <input
                        type="radio"
                        name="meal"
                        id={`meal-${meal.id}`}
                        checked={selectedMeal === meal.id}
                        onChange={() => setSelectedMeal(meal.id)}
                        className="mt-1 w-5 h-5 text-primary-600 focus:ring-primary-500"
                      />
                      {meal.image && (
                        <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={meal.image}
                            alt={meal.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop&crop=center`
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={`meal-${meal.id}`}
                          className="cursor-pointer block"
                        >
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-1">
                                {meal.name}
                              </h3>
                              {meal.description && (
                                <p className="text-sm sm:text-base text-gray-600 mb-2">
                                  {meal.description}
                                </p>
                              )}
                              <div className="mb-2">
                                <p className="text-xs font-medium text-gray-700 mb-1">Includes:</p>
                                <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                                  {meal.items?.map((item: any, idx: number) => (
                                    <li key={idx}>
                                      • {item.menuItem?.name} {item.quantity > 1 && `x ${item.quantity}`}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-xl sm:text-2xl text-primary-600">
                                ${meal.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </label>
                        {selectedMeal === meal.id && (
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => {
                                addItem({
                                  id: meal.id,
                                  name: meal.name,
                                  price: meal.price,
                                  quantity: 1,
                                  image: meal.image || undefined,
                                  type: 'meal',
                                  mealId: meal.id,
                                })
                                toast.success(`${meal.name} added to cart!`)
                                setSelectedMeal(null) // Clear selection after adding
                              }}
                              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                            >
                              Add to Cart
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredItems.map((item) => {
            const isExpanded = expandedItems.has(item.id)
            const quantity = itemQuantities[item.id] || 1
            const instructions = itemInstructions[item.id] || ''

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl sm:rounded-2xl shadow-md border border-gray-200 transition-all ${
                  !item.available ? 'opacity-60' : 'hover:shadow-lg'
                } ${isExpanded ? 'border-primary-300 shadow-lg' : ''}`}
              >
                {/* Item Header - Always Visible */}
                <button
                  onClick={() => toggleExpand(item.id)}
                  disabled={!item.available}
                  className="w-full p-4 sm:p-6 flex items-start gap-4 text-left hover:bg-gray-50 transition-colors disabled:cursor-not-allowed"
                >
                  {/* Item Image */}
                  {item.image && (
                    <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.src = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop&crop=center`
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex-1">{item.name}</h3>
                      <span className="text-lg sm:text-xl font-extrabold text-primary-600 whitespace-nowrap">
                        £{item.price.toFixed(2)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm sm:text-base text-gray-600 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {!item.available && (
                      <p className="text-red-600 text-sm font-semibold mt-2">Currently Unavailable</p>
                    )}
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && item.available && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-200 pt-4 sm:pt-6 space-y-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <label className="text-sm sm:text-base font-semibold text-gray-700">Quantity:</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateQuantity(item.id, -1)
                          }}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-600 flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <span className="text-lg sm:text-xl font-bold text-gray-900 w-8 text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateQuantity(item.id, 1)
                          }}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-600 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Instructions/Notes */}
                    <div>
                      <label htmlFor={`instructions-${item.id}`} className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                        Special Instructions (Optional):
                      </label>
                      <textarea
                        id={`instructions-${item.id}`}
                        value={instructions}
                        onChange={(e) => {
                          setItemInstructions((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="E.g., No onions, extra sauce, well done..."
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm sm:text-base"
                        rows={3}
                      />
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToCart(item)
                      }}
                      className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 sm:py-4 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all transform hover:scale-[1.02] shadow-md text-sm sm:text-base"
                    >
                      Add {quantity > 1 ? `${quantity}x ` : ''}to Cart - £{(item.price * quantity).toFixed(2)}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No items found in this category</p>
          </div>
        )}
      </div>
    </div>
  )
}
