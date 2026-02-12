'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { Plus, Minus, MapPin, Store, Truck, X, Menu as MenuIcon } from 'lucide-react'
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
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({})
  const [itemInstructions, setItemInstructions] = useState<Record<string, string>>({})
  const [meals, setMeals] = useState<Record<string, any>>({})
  const [mealChoices, setMealChoices] = useState<Record<string, Record<string, any>>>({})
  const [showMealOption, setShowMealOption] = useState<Record<string, string | null>>({})
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const storedOrderType = localStorage.getItem('orderType')
    const storedLocation = localStorage.getItem('selectedLocation')
    
    if (storedOrderType && storedLocation) {
      setOrderType(storedOrderType)
      setSelectedLocation(JSON.parse(storedLocation))
    } else {
      router.push('/order-online')
    }
    
    fetchMenuItems()
  }, [router])

  // Fetch meals when menu items are loaded
  useEffect(() => {
    if (menuItems.length > 0) {
      fetchMeals()
    }
  }, [menuItems])

  const fetchMeals = async () => {
    try {
      const response = await fetch('/api/meals')
      if (!response.ok) return
      const allMeals = await response.json()
      if (Array.isArray(allMeals)) {
        const mealsByMenuItem: Record<string, any[]> = {}
        
        // First, add meals directly linked to menu items
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
        
        // Then, add meals by categoryFilter (after menuItems are loaded)
        if (menuItems.length > 0) {
          allMeals.forEach((meal: any) => {
            if (meal.available && meal.categoryFilter) {
              menuItems.forEach((item: MenuItem) => {
                if (item.category === meal.categoryFilter) {
                  if (!mealsByMenuItem[item.id]) {
                    mealsByMenuItem[item.id] = []
                  }
                  if (!mealsByMenuItem[item.id].find((m: any) => m.id === meal.id)) {
                    mealsByMenuItem[item.id].push(meal)
                  }
                }
              })
            }
          })
        }
        
        setMeals(mealsByMenuItem)
      }
    } catch (error) {
      console.error('Error fetching meals:', error)
    }
  }

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu')
      if (!response.ok) throw new Error('Failed to fetch menu')
      const data = await response.json()
      if (Array.isArray(data)) {
        setMenuItems(data)
        const initialQuantities: Record<string, number> = {}
        data.forEach((item: MenuItem) => {
          initialQuantities[item.id] = 1
        })
        setItemQuantities(initialQuantities)
      } else {
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

  const updateQuantity = (itemId: string, change: number) => {
    setItemQuantities((prev) => {
      const current = prev[itemId] || 1
      const newQuantity = Math.max(1, current + change)
      return { ...prev, [itemId]: newQuantity }
    })
  }

  const openDrawer = async (item: MenuItem) => {
    if (!item.available) {
      toast.error('This item is currently unavailable')
      return
    }
    setSelectedItem(item)
    setDrawerOpen(true)
    // Initialize quantity if not set
    if (!itemQuantities[item.id]) {
      setItemQuantities((prev) => ({ ...prev, [item.id]: 1 }))
    }
    
    // Fetch meals for this specific menu item if not already loaded
    if (!meals[item.id] || meals[item.id].length === 0) {
      try {
        const response = await fetch(`/api/meals?menuItemId=${item.id}`)
        if (response.ok) {
          const itemMeals = await response.json()
          if (Array.isArray(itemMeals) && itemMeals.length > 0) {
            setMeals((prev) => ({
              ...prev,
              [item.id]: itemMeals,
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching meals for item:', error)
      }
    }
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedItem(null)
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
    
    if (selectedMealId && selectedMeal) {
      const allCategoriesSelected = selectedMeal.categories?.every((cat: any) => 
        mealChoicesForItem?.[cat.id]
      )
      if (!allCategoriesSelected) {
        toast.error(`Please select one option from each category for ${selectedMeal.name}`)
        return
      }
    }
    
    for (let i = 0; i < quantity; i++) {
      if (selectedMealId && selectedMeal && mealChoicesForItem) {
        const totalPrice =
          item.price +
          (selectedMeal.basePrice || 0) +
          (selectedMeal.categories || []).reduce((sum: number, cat: any) => {
            const choice = mealChoicesForItem[cat.id]
            return sum + (choice?.price || 0)
          }, 0)

        const mealChoicesObj: Record<string, any> = {}
        selectedMeal.categories?.forEach((cat: any) => {
          const choice = mealChoicesForItem[cat.id]
          if (choice) {
            mealChoicesObj[cat.id] = choice
          }
        })

        addItem({
          id: `${item.id}-meal-${selectedMealId}-${Date.now()}-${i}`,
          name: `${item.name} - ${selectedMeal.name}`,
          price: totalPrice,
          quantity: 1,
          image: item.image || selectedMeal.image || undefined,
          instructions: instructions || undefined,
          type: 'meal',
          menuItemId: item.id, // Store the base menu item ID
          mealId: selectedMeal.id, // Store the meal deal ID
          mealChoices: mealChoicesObj,
        })
      } else {
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
    
    // Reset and close drawer
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
    closeDrawer()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading menu...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Location Banner */}
        {orderType && selectedLocation && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center">
                {orderType === 'collection' ? (
                  <Store className="w-5 h-5 text-primary-600 mr-2" />
                ) : (
                  <Truck className="w-5 h-5 text-primary-600 mr-2" />
                )}
                <div>
                  <p className="text-xs text-gray-600">
                    {orderType === 'collection' ? 'Collection from' : 'Delivery to'}
                  </p>
                  <p className="font-bold text-sm text-gray-900">
                    {orderType === 'collection'
                      ? selectedLocation.name
                      : `${selectedLocation.area} (${selectedLocation.postalCode})`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/order-online')}
                className="text-primary-600 hover:text-primary-700 font-medium text-xs"
              >
                Change
              </button>
            </div>
            </div>
          </div>
        )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Our Menu</h1>
              <p className="text-gray-600 mt-1">Delicious food made fresh for you</p>
            </div>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
            >
              <MenuIcon className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-24">
              <h2 className="font-bold text-lg mb-4 text-gray-900">Categories</h2>
              <nav className="space-y-2">
            <button
              onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${
                selectedCategory === 'all'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Items
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      selectedCategory === category.id
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{category.emoji}</span>
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 lg:hidden overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg text-gray-900">Categories</h2>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <nav className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedCategory('all')
                        setSidebarOpen(false)
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${
                        selectedCategory === 'all'
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      All Items
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id)
                          setSidebarOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                          selectedCategory === category.id
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-xl">{category.emoji}</span>
                        {category.name}
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>
            </>
          )}

          {/* Main Content - Card Grid */}
          <main className="flex-1 min-w-0">
            {/* Mobile Category Filter */}
            <div className="lg:hidden mb-6">
              <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                  selectedCategory === category.id
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                    <span>{category.emoji}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

            {/* Menu Items Grid */}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredItems.map((item) => (
              <div
                key={item.id}
                    onClick={() => openDrawer(item)}
                    className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${
                      !item.available ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {item.image && (
                      <div className="aspect-square w-full overflow-hidden bg-gray-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop`
                          }}
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-extrabold text-primary-600">
                        £{item.price.toFixed(2)}
                      </span>
                        {!item.available && (
                          <span className="text-xs text-red-600 font-semibold">Unavailable</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
                    ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No items found in this category</p>
              </div>
                    )}
          </main>
        </div>
                  </div>

      {/* Side Drawer */}
      {drawerOpen && selectedItem && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
            onClick={closeDrawer}
          />
          
          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">{selectedItem.name}</h2>
              <button
                onClick={closeDrawer}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Item Image */}
              {selectedItem.image && (
                <div className="aspect-square w-full rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Description */}
              {selectedItem.description && (
                <p className="text-gray-600">{selectedItem.description}</p>
              )}

              {/* Price */}
              <div className="text-2xl font-extrabold text-primary-600">
                £{selectedItem.price.toFixed(2)}
              </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                <label className="text-base font-semibold text-gray-700">Quantity:</label>
                      <div className="flex items-center gap-3">
                        <button
                    onClick={() => updateQuantity(selectedItem.id, -1)}
                    className="w-10 h-10 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-600 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                        </button>
                  <span className="text-xl font-bold text-gray-900 w-8 text-center">
                    {itemQuantities[selectedItem.id] || 1}
                        </span>
                        <button
                    onClick={() => updateQuantity(selectedItem.id, 1)}
                    className="w-10 h-10 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-600 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

              {/* Instructions */}
                    <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">
                        Special Instructions (Optional):
                      </label>
                      <textarea
                  value={itemInstructions[selectedItem.id] || ''}
                        onChange={(e) => {
                          setItemInstructions((prev) => ({
                            ...prev,
                      [selectedItem.id]: e.target.value,
                          }))
                        }}
                  placeholder="E.g., No onions, extra sauce..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                    </div>

              {/* Meal Options */}
              {meals[selectedItem.id] && meals[selectedItem.id].length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Meal Options</h3>
                  {meals[selectedItem.id].map((meal: any) => (
                    meal.available && (
                      <div key={meal.id} className="border border-gray-200 rounded-lg p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showMealOption[selectedItem.id] === meal.id}
                            onChange={(e) => {
                              setShowMealOption((prev) => ({
                                ...prev,
                                [selectedItem.id]: prev[selectedItem.id] === meal.id ? null : meal.id,
                              }))
                              if (showMealOption[selectedItem.id] === meal.id) {
                                setMealChoices((prev) => {
                                  const newChoices = { ...prev }
                                  if (newChoices[selectedItem.id]) {
                                    delete newChoices[selectedItem.id][meal.id]
                                    if (Object.keys(newChoices[selectedItem.id]).length === 0) {
                                      delete newChoices[selectedItem.id]
                                    }
                                  }
                                  return newChoices
                                })
                              }
                            }}
                            className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{meal.name}</div>
                            <div className="text-sm text-gray-600">
                              +£{meal.basePrice?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                        </label>

                        {/* Meal Category Options */}
                        {showMealOption[selectedItem.id] === meal.id && meal.categories && (
                          <div className="mt-4 space-y-4 pl-8">
                            {meal.categories.map((category: any) => (
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
                                        className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                                      >
                                        <input
                                          type="radio"
                                          name={`meal-${meal.id}-category-${category.id}-${selectedItem.id}`}
                                          checked={mealChoices[selectedItem.id]?.[meal.id]?.[category.id]?.id === option.menuItemId}
                                          onChange={() => {
                                            setMealChoices((prev) => ({
                                              ...prev,
                                              [selectedItem.id]: {
                                                ...prev[selectedItem.id],
                                                [meal.id]: {
                                                  ...prev[selectedItem.id]?.[meal.id],
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

                            {/* Meal Total */}
                            {meal.categories && meal.categories.every((cat: any) => mealChoices[selectedItem.id]?.[meal.id]?.[cat.id]) && (
                              <div className="pt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-gray-900">Meal Total:</span>
                                  <span className="text-lg font-bold text-primary-600">
                                    £{(
                                      (meal.basePrice || 0) +
                                      (meal.categories || []).reduce((sum: number, cat: any) => {
                                        const choice = mealChoices[selectedItem.id]?.[meal.id]?.[cat.id]
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
            )
                  ))}
        </div>
              )}

              {/* Add to Cart Button */}
              <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 -mx-4 px-4 pb-4">
                <button
                  onClick={() => handleAddToCart(selectedItem)}
                  disabled={
                    (() => {
                      const selectedMealId = showMealOption[selectedItem.id]
                      if (!selectedMealId) return false
                      const selectedMeal = meals[selectedItem.id]?.find((m: any) => m.id === selectedMealId)
                      if (!selectedMeal) return false
                      const mealChoicesForItem = mealChoices[selectedItem.id]?.[selectedMealId]
                      return !selectedMeal.categories?.every((cat: any) => mealChoicesForItem?.[cat.id])
                    })()
                  }
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(() => {
                    const selectedMealId = showMealOption[selectedItem.id]
                    const selectedMeal = selectedMealId && meals[selectedItem.id]?.find((m: any) => m.id === selectedMealId)
                    const mealChoicesForItem = selectedMealId && mealChoices[selectedItem.id]?.[selectedMealId]
                    const allSelected = selectedMeal?.categories?.every((cat: any) => mealChoicesForItem?.[cat.id])
                    const quantity = itemQuantities[selectedItem.id] || 1
                    
                    if (selectedMeal && allSelected) {
                      const totalPrice = selectedItem.price + (selectedMeal.basePrice || 0) + 
                        (selectedMeal.categories || []).reduce((sum: number, cat: any) => {
                          const choice = mealChoicesForItem?.[cat.id]
                          return sum + (choice?.price || 0)
                        }, 0)
                      return `Add ${quantity > 1 ? `${quantity}x ` : ''}to Cart - £${(totalPrice * quantity).toFixed(2)}`
                    }
                    return `Add ${quantity > 1 ? `${quantity}x ` : ''}to Cart - £${(selectedItem.price * quantity).toFixed(2)}`
                  })()}
                </button>
              </div>
            </div>
          </div>
        </>
        )}
    </div>
  )
}
