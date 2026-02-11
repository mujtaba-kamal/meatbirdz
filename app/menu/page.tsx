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
  const [meals, setMeals] = useState<Record<string, any>>({}) // meals linked to each menu item: { menuItemId: meal }
  const [mealChoices, setMealChoices] = useState<Record<string, Record<string, any>>>({}) // { menuItemId: { mealId: { categoryId: choice } } }
  const [showMealOption, setShowMealOption] = useState<Record<string, string | null>>({}) // { menuItemId: mealId | null }
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
      // Fetch all meals - we'll filter by menu item when displaying
      const response = await fetch('/api/meals')
      if (!response.ok) {
        console.error('Failed to fetch meals:', response.status, response.statusText)
        return
      }
      const allMeals = await response.json()
      if (Array.isArray(allMeals)) {
        // Create a map of meals by menu item ID
        const mealsByMenuItem: Record<string, any[]> = {}
        
        allMeals.forEach((meal: any) => {
          if (meal.available && meal.menuItems && Array.isArray(meal.menuItems)) {
            meal.menuItems.forEach((link: any) => {
              const menuItemId = link.menuItem?.id
              if (menuItemId) {
                if (!mealsByMenuItem[menuItemId]) {
                  mealsByMenuItem[menuItemId] = []
                }
                mealsByMenuItem[menuItemId].push(meal)
              }
            })
          }
        })
        
        setMeals(mealsByMenuItem)
      } else {
        console.error('Meals API returned non-array data:', allMeals)
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
    const selectedMealId = showMealOption[item.id]
    const selectedMeal = selectedMealId && meals[item.id]?.find((m: any) => m.id === selectedMealId)
    const mealChoicesForItem = mealChoices[item.id]?.[selectedMealId || '']
    
    // If meal is selected, check if all categories are selected
    if (selectedMealId && selectedMeal) {
      const allCategoriesSelected = selectedMeal.categories?.every((cat: any) => 
        mealChoicesForItem?.[cat.id]
      )
      if (!allCategoriesSelected) {
        toast.error(`Please select one option from each category for ${selectedMeal.name}`)
        return
      }
    }
    
    // Add item with quantity
    for (let i = 0; i < quantity; i++) {
      if (selectedMealId && selectedMeal && mealChoicesForItem) {
        // Add as meal
        const totalPrice =
          item.price +
          (selectedMeal.basePrice || 0) +
          (selectedMeal.categories || []).reduce((sum: number, cat: any) => {
            const choice = mealChoicesForItem[cat.id]
            return sum + (choice?.price || 0)
          }, 0)

        // Build meal choices object
        const mealChoicesObj: Record<string, any> = {}
        selectedMeal.categories?.forEach((cat: any) => {
          const choice = mealChoicesForItem[cat.id]
          if (choice) {
            mealChoicesObj[cat.id] = choice
          }
        })

        addItem({
          id: `${item.id}-meal-${selectedMealId}-${Date.now()}-${i}`, // Unique ID for meal with this item
          name: `${item.name} - ${selectedMeal.name}`,
          price: totalPrice,
          quantity: 1,
          image: item.image || selectedMeal.image || undefined,
          instructions: instructions || undefined,
          type: 'meal',
          mealId: selectedMeal.id,
          mealChoices: mealChoicesObj,
        })
      } else {
        // Add as regular menu item
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
    }
    
    const itemName = selectedMealId && selectedMeal ? `${item.name} with ${selectedMeal.name}` : item.name
    toast.success(`${quantity}x ${itemName} added to cart`)
    
    // Reset quantity, instructions, meal option, and meal choices for this item
    setItemQuantities((prev) => ({ ...prev, [item.id]: 1 }))
    setItemInstructions((prev) => {
      const newInstructions = { ...prev }
      delete newInstructions[item.id]
      return newInstructions
    })
    setShowMealOption((prev) => {
      const newOptions = { ...prev }
      delete newOptions[item.id]
      return newOptions
    })
    setMealChoices((prev) => {
      const newChoices = { ...prev }
      delete newChoices[item.id]
      return newChoices
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

                    {/* Meal Deal Option */}
                    {meals[item.id] && meals[item.id].length > 0 && meals[item.id].map((meal: any) => (
                      meal.available && (
                      <div className="border-t border-gray-200 pt-4">
                        <label className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showMealOption[item.id] === meal.id}
                            onChange={(e) => {
                              e.stopPropagation()
                              setShowMealOption((prev) => ({
                                ...prev,
                                [item.id]: prev[item.id] === meal.id ? null : meal.id,
                              }))
                              if (showMealOption[item.id] === meal.id) {
                                setMealChoices((prev) => {
                                  const newChoices = { ...prev }
                                  if (newChoices[item.id]) {
                                    delete newChoices[item.id][meal.id]
                                    if (Object.keys(newChoices[item.id]).length === 0) {
                                      delete newChoices[item.id]
                                    }
                                  }
                                  return newChoices
                                })
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-lg">🍔</span>
                            <span className="font-semibold text-gray-900">
                              Make it a {meal.name}
                            </span>
                            <span className="text-sm text-gray-600">
                              (+£{meal.basePrice?.toFixed(2) || '0.00'})
                            </span>
                          </div>
                        </label>

                        {/* Meal Options */}
                        {showMealOption[item.id] === meal.id && (
                          <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                            {/* Dynamic Categories */}
                            {meal.categories && meal.categories.map((category: any) => (
                              <div key={category.id}>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  {category.name}:
                                </label>
                                <div className="space-y-2">
                                  {meal.options
                                    .filter((opt: any) => opt.categoryId === category.id)
                                    .map((option: any) => (
                                      <label
                                        key={option.id}
                                        className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors bg-white"
                                      >
                                        <input
                                          type="radio"
                                          name={`meal-${meal.id}-category-${category.id}-${item.id}`}
                                          value={option.menuItemId}
                                          checked={mealChoices[item.id]?.[meal.id]?.[category.id]?.id === option.menuItemId}
                                          onChange={() => {
                                            setMealChoices((prev) => ({
                                              ...prev,
                                              [item.id]: {
                                                ...prev[item.id],
                                                [meal.id]: {
                                                  ...prev[item.id]?.[meal.id],
                                                  [category.id]: {
                                                    id: option.menuItemId,
                                                    name: option.menuItem.name,
                                                    price: option.additionalPrice || 0,
                                                  },
                                                },
                                              },
                                            }))
                                          }}
                                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                        />
                                        <div className="flex-1">
                                          <span className="text-sm font-medium text-gray-900">{option.menuItem.name}</span>
                                          {option.additionalPrice > 0 && (
                                            <span className="text-xs text-gray-600 ml-2">
                                              (+£{option.additionalPrice.toFixed(2)})
                                            </span>
                                          )}
                                          {option.additionalPrice === 0 && (
                                            <span className="text-xs text-green-600 ml-2">(Included)</span>
                                          )}
                                        </div>
                                      </label>
                                    ))}
                                </div>
                              </div>
                            ))}

                            {/* Meal Total Price Display */}
                            {meal.categories && meal.categories.every((cat: any) => mealChoices[item.id]?.[meal.id]?.[cat.id]) && (
                              <div className="pt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-gray-900">Meal Total:</span>
                                  <span className="text-lg font-bold text-primary-600">
                                    £{(
                                      (meal.basePrice || 0) +
                                      (meal.categories || []).reduce((sum: number, cat: any) => {
                                        const choice = mealChoices[item.id]?.[meal.id]?.[cat.id]
                                        return sum + (choice?.price || 0)
                                      }, 0)
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))).filter(Boolean)}

                    {/* Add to Cart Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToCart(item)
                      }}
                      disabled={
                        (() => {
                          const selectedMealId = showMealOption[item.id]
                          if (!selectedMealId) return false
                          const selectedMeal = meals[item.id]?.find((m: any) => m.id === selectedMealId)
                          if (!selectedMeal) return false
                          const mealChoicesForItem = mealChoices[item.id]?.[selectedMealId]
                          return !selectedMeal.categories?.every((cat: any) => mealChoicesForItem?.[cat.id])
                        })()
                      }
                      className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 sm:py-4 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all transform hover:scale-[1.02] shadow-md text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {(() => {
                        const selectedMealId = showMealOption[item.id]
                        const selectedMeal = selectedMealId && meals[item.id]?.find((m: any) => m.id === selectedMealId)
                        const mealChoicesForItem = selectedMealId && mealChoices[item.id]?.[selectedMealId]
                        const allSelected = selectedMeal?.categories?.every((cat: any) => mealChoicesForItem?.[cat.id])
                        
                        if (selectedMeal && allSelected) {
                          const totalPrice = item.price + (selectedMeal.basePrice || 0) + 
                            (selectedMeal.categories || []).reduce((sum: number, cat: any) => {
                              const choice = mealChoicesForItem?.[cat.id]
                              return sum + (choice?.price || 0)
                            }, 0)
                          return `Add ${quantity > 1 ? `${quantity}x ` : ''}to Cart - £${(totalPrice * quantity).toFixed(2)}`
                        }
                        return `Add ${quantity > 1 ? `${quantity}x ` : ''}to Cart - £${(item.price * quantity).toFixed(2)}`
                      })()}
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
