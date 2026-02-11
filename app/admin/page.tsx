'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Package, Bell, BellRing, X, Banknote, CreditCard, DollarSign, Calendar, Filter, ChevronDown, Mail, Phone, MapPin, Utensils, Plus, Trash2, Edit, Save, X as XIcon, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

const statusRowColors: Record<string, string> = {
  PENDING: 'bg-yellow-50 border-l-4 border-yellow-500',
  CONFIRMED: 'bg-blue-50 border-l-4 border-blue-500',
  PREPARING: 'bg-purple-50 border-l-4 border-purple-500',
  READY: 'bg-green-50 border-l-4 border-green-500',
  DELIVERED: 'bg-gray-50 border-l-4 border-gray-500',
  CANCELLED: 'bg-red-50 border-l-4 border-red-500',
}

const orderStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']

type DateFilter = '24h' | '3d' | '7d' | '15d' | '30d' | '6m' | '1y' | 'custom'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [dateFilter, setDateFilter] = useState<DateFilter>('24h')
  const [customFromDate, setCustomFromDate] = useState<string>('')
  const [customToDate, setCustomToDate] = useState<string>('')
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders')
  
  // Menu management state
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [meals, setMeals] = useState<any[]>([]) // All meals
  const [selectedMeal, setSelectedMeal] = useState<any>(null) // Currently selected meal for editing
  const [showAddMenuItem, setShowAddMenuItem] = useState(false)
  const [showMealEditor, setShowMealEditor] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  
  // Form states
  const [menuItemForm, setMenuItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    available: true,
  })
  
  const [mealForm, setMealForm] = useState({
    name: 'Meal Deal',
    description: '',
    basePrice: '',
    image: '',
    available: true,
  })
  
  const [mealCategories, setMealCategories] = useState<Array<{
    id?: string // For existing categories
    name: string
    order: number
  }>>([
    { name: 'Fries', order: 1 },
    { name: 'Drink', order: 2 },
    { name: 'Side', order: 3 },
  ])
  
  const [mealOptions, setMealOptions] = useState<Array<{
    menuItemId: string
    categoryId: string // Changed from category number to categoryId
    additionalPrice: number
  }>>([])
  
  const [linkedMenuItems, setLinkedMenuItems] = useState<string[]>([]) // Menu item IDs linked to this meal
  
  const categories = [
    { id: 'burger', name: 'Burgers' },
    { id: 'wrap', name: 'Wraps' },
    { id: 'fries', name: 'Fries' },
    { id: 'side', name: 'Sides' },
    { id: 'box', name: 'Boxes' },
    { id: 'drink', name: 'Drinks' },
    { id: 'dip', name: 'Dips' },
  ]

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
      
      // Set up real-time updates using shorter polling (every 2 seconds)
      const interval = setInterval(fetchOrders, 2000)
      return () => clearInterval(interval)
    }
  }, [session, dateFilter, customFromDate, customToDate])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN' && activeTab === 'menu') {
      fetchMenuItems()
      fetchMeals()
    }
  }, [session, activeTab])

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu-items')
      if (response.ok) {
        const data = await response.json()
        // Sort by order, then by name
        const sorted = data.sort((a: any, b: any) => {
          if (a.order !== b.order) return (a.order || 0) - (b.order || 0)
          return a.name.localeCompare(b.name)
        })
        setMenuItems(sorted)
      }
    } catch (error) {
      console.error('Error fetching menu items:', error)
      toast.error('Failed to fetch menu items')
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = menuItems.findIndex((item) => item.id === active.id)
      const newIndex = menuItems.findIndex((item) => item.id === over.id)

      const newItems = arrayMove(menuItems, oldIndex, newIndex)
      
      // Update order values
      const itemOrders = newItems.map((item, index) => ({
        id: item.id,
        order: index,
      }))

      // Update in database
      try {
        const response = await fetch('/api/menu-items/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemOrders }),
        })

        if (response.ok) {
          setMenuItems(newItems)
          toast.success('Menu items reordered')
        } else {
          toast.error('Failed to save new order')
          fetchMenuItems() // Revert to original order
        }
      } catch (error) {
        console.error('Error reordering:', error)
        toast.error('Failed to save new order')
        fetchMenuItems() // Revert to original order
      }
    }
  }

  // Sortable Menu Item Component
  const SortableMenuItem = ({ item }: { item: any }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    const isEditing = editingMenuItem?.id === item.id

    return (
      <div ref={setNodeRef} style={style} className="space-y-2">
        {isEditing ? (
          // Edit Form Inline
          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
            <h3 className="font-semibold mb-4 text-blue-900">Edit Menu Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={selectedCategory || menuItemForm.category}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setMenuItemForm({ ...menuItemForm, category: e.target.value })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={menuItemForm.name}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Item name"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={menuItemForm.description}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Item description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={menuItemForm.price}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('File too large. Maximum size is 5MB.')
                        return
                      }
                      try {
                        toast.loading('Uploading image...')
                        const formData = new FormData()
                        formData.append('file', file)
                        const response = await fetch('/api/upload-image', {
                          method: 'POST',
                          body: formData,
                        })
                        const data = await response.json()
                        if (response.ok && data.url) {
                          setMenuItemForm({ ...menuItemForm, image: data.url })
                          toast.dismiss()
                          toast.success('Image uploaded successfully!')
                        } else {
                          toast.dismiss()
                          toast.error(data.error || 'Failed to upload image')
                        }
                      } catch (error) {
                        toast.dismiss()
                        toast.error('Failed to upload image')
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="url"
                    value={menuItemForm.image}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Or paste image URL here"
                  />
                  {menuItemForm.image && (
                    <div className="mt-2">
                      <img
                        src={menuItemForm.image}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={menuItemForm.available}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, available: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Available</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleUpdateMenuItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Update Item
              </button>
              <button
                onClick={() => {
                  setEditingMenuItem(null)
                  setMenuItemForm({ name: '', description: '', price: '', category: '', image: '', available: true })
                  setSelectedCategory('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <XIcon className="w-4 h-4 inline mr-2" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // Regular Item Display
          <div
            className={`p-4 border rounded-lg flex items-center justify-between ${
              !item.available ? 'opacity-60 bg-gray-50' : 'bg-white'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <GripVertical className="w-5 h-5 text-gray-400" />
              </div>
              {item.image && (
                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
              )}
              <div className="flex-1">
                <h4 className="font-semibold">{item.name}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm font-medium text-blue-600">${item.price.toFixed(2)}</span>
                  <span className="text-xs text-gray-500 capitalize">{item.category}</span>
                  {!item.available && (
                    <span className="text-xs text-red-600 font-medium">Unavailable</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingMenuItem(item)
                  setShowAddMenuItem(false)
                  setMenuItemForm({
                    name: item.name,
                    description: item.description || '',
                    price: item.price.toString(),
                    category: item.category,
                    image: item.image || '',
                    available: item.available,
                  })
                  setSelectedCategory(item.category)
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteMenuItem(item.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const fetchMeals = async () => {
    try {
      const response = await fetch('/api/meals')
      if (response.ok) {
        const data = await response.json()
        const mealsArray = Array.isArray(data) ? data : [data].filter(Boolean)
        setMeals(mealsArray)
        
        // If a meal is selected, refresh its data
        if (selectedMeal) {
          const refreshedMeal = mealsArray.find((m: any) => m.id === selectedMeal.id)
          if (refreshedMeal) {
            loadMealIntoEditor(refreshedMeal)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching meals:', error)
      toast.error('Failed to fetch meals')
    }
  }

  const loadMealIntoEditor = (mealToLoad: any) => {
    setSelectedMeal(mealToLoad)
    setMealForm({
      name: mealToLoad.name || 'Meal Deal',
      description: mealToLoad.description || '',
      basePrice: mealToLoad.basePrice?.toString() || '',
      image: mealToLoad.image || '',
      available: mealToLoad.available !== undefined ? mealToLoad.available : true,
    })
    // Set categories from the meal
    if (mealToLoad.categories && Array.isArray(mealToLoad.categories)) {
      setMealCategories(mealToLoad.categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        order: cat.order,
      })).sort((a: any, b: any) => a.order - b.order))
    } else {
      // Default categories if none exist
      setMealCategories([
        { name: 'Fries', order: 1 },
        { name: 'Drink', order: 2 },
        { name: 'Side', order: 3 },
      ])
    }
    // Set meal options with categoryId
    if (mealToLoad.options) {
      setMealOptions(mealToLoad.options.map((opt: any) => ({
        menuItemId: opt.menuItemId,
        categoryId: opt.categoryId || opt.category?.id,
        additionalPrice: opt.additionalPrice || 0,
      })))
    } else {
      setMealOptions([])
    }
    // Set linked menu items
    if (mealToLoad.menuItems && Array.isArray(mealToLoad.menuItems)) {
      setLinkedMenuItems(mealToLoad.menuItems.map((link: any) => link.menuItem?.id || link.menuItemId).filter(Boolean))
    } else {
      setLinkedMenuItems([])
    }
  }

  const resetMealEditor = () => {
    setSelectedMeal(null)
    setMealForm({
      name: 'Meal Deal',
      description: '',
      basePrice: '',
      image: '',
      available: true,
    })
    setMealCategories([
      { name: 'Fries', order: 1 },
      { name: 'Drink', order: 2 },
      { name: 'Side', order: 3 },
    ])
    setMealOptions([])
    setLinkedMenuItems([])
  }

  const handleDeleteMeal = async (mealId: string) => {
    if (!confirm('Are you sure you want to delete this meal?')) return

    try {
      const response = await fetch(`/api/meals/${mealId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Meal deleted successfully')
        if (selectedMeal?.id === mealId) {
          resetMealEditor()
          setShowMealEditor(false)
        }
        fetchMeals()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete meal')
      }
    } catch (error) {
      toast.error('Failed to delete meal')
    }
  }

  const handleAddMenuItem = async () => {
    if (!menuItemForm.name || !menuItemForm.price || !menuItemForm.category) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuItemForm),
      })

      if (response.ok) {
        toast.success('Menu item added successfully')
        setShowAddMenuItem(false)
        setMenuItemForm({ name: '', description: '', price: '', category: '', image: '', available: true })
        setSelectedCategory('')
        fetchMenuItems()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add menu item')
      }
    } catch (error) {
      toast.error('Failed to add menu item')
    }
  }

  const handleUpdateMenuItem = async () => {
    if (!editingMenuItem) return

    try {
      const response = await fetch(`/api/menu-items/${editingMenuItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuItemForm),
      })

      if (response.ok) {
        toast.success('Menu item updated successfully')
        setEditingMenuItem(null)
        setMenuItemForm({ name: '', description: '', price: '', category: '', image: '', available: true })
        setSelectedCategory('')
        fetchMenuItems()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update menu item')
      }
    } catch (error) {
      toast.error('Failed to update menu item')
    }
  }

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return

    try {
      const response = await fetch(`/api/menu-items/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Menu item deleted successfully')
        fetchMenuItems()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete menu item')
      }
    } catch (error) {
      toast.error('Failed to delete menu item')
    }
  }

  const handleSaveMeal = async () => {
    if (!mealForm.name || !mealForm.basePrice) {
      toast.error('Please fill in name and base price')
      return
    }

    if (!mealCategories || mealCategories.length === 0) {
      toast.error('Please add at least one category')
      return
    }

    try {
      // Prepare categories array
      const categoriesToSend = mealCategories.map(cat => ({
        name: cat.name,
        order: cat.order,
      }))

      // For new meals, we need to map temporary category IDs to category orders
      // The API will create categories and we'll match options by order
      // For existing meals, we can use the actual category IDs
      let optionsToSend
      
      if (selectedMeal && selectedMeal.id) {
        // Existing meal: resolve categoryId from categoryOrder since categories may have been recreated
        // Match each option to its category by finding the category with matching ID or by order
        optionsToSend = mealOptions.map(opt => {
          // Find which category this option belongs to
          const category = mealCategories.find(cat => {
            return opt.categoryId === cat.id || opt.categoryId === `temp_${mealCategories.indexOf(cat)}_${cat.order}`
          })
          
          if (!category) {
            console.error('Could not find category for option:', opt)
            return null
          }
          
          // Always send categoryOrder for updates to ensure proper resolution
          return {
            menuItemId: opt.menuItemId,
            categoryOrder: category.order, // Always use order for updates
            categoryId: category.id, // Include ID as fallback
            additionalPrice: opt.additionalPrice,
          }
        }).filter(Boolean) // Remove any null entries
      } else {
        // New meal: map by category order (temporary IDs start with "temp_")
        // Match options to categories by finding the category with matching temp ID or order
        optionsToSend = mealOptions.map(opt => {
          // Find which category this option belongs to
          const category = mealCategories.find(cat => {
            const tempId = `temp_${mealCategories.indexOf(cat)}_${cat.order}`
            return opt.categoryId === tempId || opt.categoryId === cat.id
          })
          
          if (!category) {
            console.error('Could not find category for option:', opt)
            return null
          }
          
          // For new meals, send the order and let the API match it
          return {
            menuItemId: opt.menuItemId,
            categoryOrder: category.order, // Send order for matching
            additionalPrice: opt.additionalPrice,
          }
        }).filter(Boolean) // Remove any null entries
      }

      // Use PUT endpoint if meal exists, POST if new
      const url = selectedMeal ? `/api/meals/${selectedMeal.id}` : '/api/meals'
      const method = selectedMeal ? 'PUT' : 'POST'
      
      const requestBody = {
        name: mealForm.name,
        description: mealForm.description,
        basePrice: mealForm.basePrice,
        image: mealForm.image,
        available: mealForm.available,
        categories: categoriesToSend,
        options: optionsToSend || [],
        menuItemIds: linkedMenuItems || [],
      }

      console.log('Saving meal with data:', JSON.stringify(requestBody, null, 2)) // Debug log
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        toast.success('Meal saved successfully')
        const savedMeal = await response.json()
        fetchMeals()
        // Load the saved meal into editor if it was a new meal
        if (!selectedMeal) {
          loadMealIntoEditor(savedMeal)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save meal')
        console.error('Save meal error:', error)
        console.error('Request body was:', requestBody)
      }
    } catch (error) {
      console.error('Error saving meal:', error)
      toast.error('Failed to save meal')
    }
  }

  const addMealOption = (menuItemId: string, categoryId: string) => {
    const menuItem = menuItems.find(item => item.id === menuItemId)
    if (!menuItem) return

    // Check if this menu item is already in this category
    if (mealOptions.some(opt => opt.menuItemId === menuItemId && opt.categoryId === categoryId)) {
      toast.error('This item is already in this category')
      return
    }

    setMealOptions([...mealOptions, {
      menuItemId,
      categoryId,
      additionalPrice: 0,
    }])
  }

  const addMealCategory = () => {
    const maxOrder = mealCategories.length > 0 
      ? Math.max(...mealCategories.map(c => c.order)) 
      : 0
    setMealCategories([...mealCategories, {
      name: `Category ${maxOrder + 1}`,
      order: maxOrder + 1,
    }])
  }

  const removeMealCategory = (index: number) => {
    const categoryToRemove = mealCategories[index]
    // Remove the category
    const newCategories = mealCategories.filter((_, i) => i !== index)
    // Reorder remaining categories
    const reordered = newCategories.map((cat, i) => ({
      ...cat,
      order: i + 1,
    }))
    setMealCategories(reordered)
    // Remove all options for this category
    if (categoryToRemove.id) {
      setMealOptions(mealOptions.filter(opt => opt.categoryId !== categoryToRemove.id))
    }
  }

  const updateMealCategory = (index: number, name: string) => {
    const updated = [...mealCategories]
    updated[index] = { ...updated[index], name }
    setMealCategories(updated)
  }

  const removeMealOption = (index: number) => {
    setMealOptions(mealOptions.filter((_, i) => i !== index))
  }

  const updateMealOptionPrice = (index: number, additionalPrice: number) => {
    const updated = [...mealOptions]
    updated[index].additionalPrice = additionalPrice
    setMealOptions(updated)
  }

  const getDateRange = (): { from: Date; to: Date } => {
    const now = new Date()
    const to = new Date(now)
    
    if (dateFilter === 'custom') {
      const from = customFromDate ? new Date(customFromDate) : new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const customTo = customToDate ? new Date(customToDate) : now
      // Set time to end of day for 'to' date
      customTo.setHours(23, 59, 59, 999)
      return { from, to: customTo }
    }

    let from = new Date(now)
    
    switch (dateFilter) {
      case '24h':
        from.setHours(now.getHours() - 24)
        break
      case '3d':
        from.setDate(now.getDate() - 3)
        break
      case '7d':
        from.setDate(now.getDate() - 7)
        break
      case '15d':
        from.setDate(now.getDate() - 15)
        break
      case '30d':
        from.setDate(now.getDate() - 30)
        break
      case '6m':
        from.setMonth(now.getMonth() - 6)
        break
      case '1y':
        from.setFullYear(now.getFullYear() - 1)
        break
      default:
        from.setHours(now.getHours() - 24)
    }
    
    return { from, to }
  }

  const fetchOrders = async () => {
    try {
      const { from, to } = getDateRange()
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      })
      const response = await fetch(`/api/orders?${params.toString()}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      // Ensure data is always an array
      if (Array.isArray(data)) {
      setOrders(data)
      } else {
        console.error('Expected array but got:', data)
        setOrders([])
        if (data.error) {
          toast.error(data.error)
        }
      }
      setLastUpdateTime(new Date())
    } catch (error) {
      // Don't show error toast on every failed request (too noisy)
      if (orders.length === 0) {
      toast.error('Failed to load orders')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter)
    if (filter !== 'custom') {
      setShowCustomPicker(false)
    } else {
      setShowCustomPicker(true)
    }
  }

  const applyCustomDateFilter = () => {
    if (!customFromDate || !customToDate) {
      toast.error('Please select both from and to dates')
      return
    }
    if (new Date(customFromDate) > new Date(customToDate)) {
      toast.error('From date must be before to date')
      return
    }
    setDateFilter('custom')
    setShowCustomPicker(false)
  }

  const updateOrderStatus = async (orderId: string, status: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
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

  // Calculate order counts by status
  const orderCountsByStatus = orderStatuses.reduce((acc, status) => {
    acc[status] = orders.filter(order => order.status === status).length
    return acc
  }, {} as Record<string, number>)

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
          <div className="flex items-center justify-between">
            <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Manage orders and track deliveries</p>
            </div>
            {lastUpdateTime && activeTab === 'orders' && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live updates</span>
                <span className="text-gray-400">
                  {lastUpdateTime.toLocaleTimeString()}
                </span>
              </div>
            )}
        </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Orders
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'menu'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Utensils className="w-4 h-4 inline mr-2" />
              Menu Management
            </button>
          </div>
        </div>

        {/* Orders Tab Content */}
        {activeTab === 'orders' && (
          <>
        {/* Date Filter Section */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filter Orders by Date</h2>
          </div>
          
          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(['24h', '3d', '7d', '15d', '30d', '6m', '1y'] as DateFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => handleDateFilterChange(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateFilter === filter
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter === '24h' ? '24 Hours' :
                 filter === '3d' ? '3 Days' :
                 filter === '7d' ? '7 Days' :
                 filter === '15d' ? '15 Days' :
                 filter === '30d' ? '30 Days' :
                 filter === '6m' ? '6 Months' :
                 filter === '1y' ? '1 Year' : filter}
              </button>
            ))}
            <button
              onClick={() => handleDateFilterChange('custom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                dateFilter === 'custom'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Custom
            </button>
          </div>

          {/* Custom Date Picker */}
          {showCustomPicker && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={customFromDate}
                    onChange={(e) => setCustomFromDate(e.target.value)}
                    max={customToDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={customToDate}
                    onChange={(e) => setCustomToDate(e.target.value)}
                    min={customFromDate}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={applyCustomDateFilter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Apply Filter
                </button>
                <button
                  onClick={() => {
                    setShowCustomPicker(false)
                    setCustomFromDate('')
                    setCustomToDate('')
                    setDateFilter('24h')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Active Filter Display */}
          {dateFilter !== 'custom' && (
            <div className="text-sm text-gray-600 mt-2">
              Showing orders from: {(() => {
                const { from } = getDateRange()
                return from.toLocaleDateString() + ' to ' + new Date().toLocaleDateString()
              })()}
            </div>
          )}
          {dateFilter === 'custom' && customFromDate && customToDate && (
            <div className="text-sm text-gray-600 mt-2">
              Showing orders from: {new Date(customFromDate).toLocaleDateString()} to {new Date(customToDate).toLocaleDateString()}
            </div>
          )}
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
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-3">Recent Orders ({orders.length})</h2>
              
              {/* Status Tags with Counts */}
              <div className="flex flex-wrap gap-2 mb-4">
                {orderStatuses.map((status) => {
                  const count = orderCountsByStatus[status] || 0
                  if (count === 0) return null
                  
                  return (
                    <div
                      key={status}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                        statusColors[status] || statusColors.PENDING
                      }`}
                    >
                      <span>{status}</span>
                      <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-primary-100">
                  <Package className="w-16 h-16 mx-auto text-primary-300 mb-4" />
                  <p className="text-gray-600">No orders yet</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-all border ${statusRowColors[order.status] || statusRowColors.PENDING}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900 truncate">
                          {order.customerName}
                        </h3>
                          <span className="text-xs text-gray-500">#{order.id.slice(-8)}</span>
                          {order.arrivalNotification && !order.arrivalAcknowledged && (
                            <span className="flex items-center bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse">
                              <BellRing className="w-3 h-3 mr-1" />
                              ARRIVED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-xl text-primary-600 mb-1">
                          ${order.totalAmount.toFixed(2)}
                        </p>
                        {/* Status Dropdown */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                            statusColors[order.status] || statusColors.PENDING
                          }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {orderStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-600" />
                      </div>
                    </div>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-gray-900 truncate">{order.customerEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-gray-900">{order.customerPhone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="text-gray-900 truncate">{order.deliveryAddress}</p>
                          <p className="text-gray-600 text-xs">{order.city}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Items</p>
                          <p className="text-gray-900">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                          <p className="text-gray-600 text-xs">
                            {order.items.slice(0, 2).map(item => item.menuItem.name).join(', ')}
                            {order.items.length > 2 && ` +${order.items.length - 2} more`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-3">
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
                      <div className="text-xs text-gray-500">
                        Click to view details
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
          </>
        )}

        {/* Menu Management Tab Content */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* Menu Items Section */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Menu Items</h2>
                <button
                        onClick={() => {
                          setShowAddMenuItem(true)
                          setEditingMenuItem(null)
                          setMenuItemForm({ name: '', description: '', price: '', category: '', image: '', available: true })
                          setSelectedCategory('')
                        }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Menu Item
                </button>
      </div>

              {/* Add Menu Item Form */}
              {showAddMenuItem && !editingMenuItem && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-300">
                  <h3 className="font-semibold mb-4">Add Menu Item</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={selectedCategory || menuItemForm.category}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value)
                          setMenuItemForm({ ...menuItemForm, category: e.target.value })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={menuItemForm.name}
                        onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Item name"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={menuItemForm.description}
                        onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Item description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={menuItemForm.price}
                        onChange={(e) => setMenuItemForm({ ...menuItemForm, price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image
                      </label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return

                            // Validate file size (5MB max)
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('File too large. Maximum size is 5MB.')
                              return
                            }

                            try {
                              toast.loading('Uploading image...')
                              const formData = new FormData()
                              formData.append('file', file)

                              const response = await fetch('/api/upload-image', {
                                method: 'POST',
                                body: formData,
                              })

                              const data = await response.json()

                              if (response.ok && data.url) {
                                setMenuItemForm({ ...menuItemForm, image: data.url })
                                toast.dismiss()
                                toast.success('Image uploaded successfully!')
                              } else {
                                toast.dismiss()
                                toast.error(data.error || 'Failed to upload image')
                              }
                            } catch (error) {
                              toast.dismiss()
                              toast.error('Failed to upload image')
                              console.error('Upload error:', error)
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <input
                          type="url"
                          value={menuItemForm.image}
                          onChange={(e) => setMenuItemForm({ ...menuItemForm, image: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Or paste image URL here"
                        />
                        {menuItemForm.image && (
                          <div className="mt-2">
                            <img
                              src={menuItemForm.image}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2 flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={menuItemForm.available}
                          onChange={(e) => setMenuItemForm({ ...menuItemForm, available: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Available</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={editingMenuItem ? handleUpdateMenuItem : handleAddMenuItem}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Save className="w-4 h-4 inline mr-2" />
                      {editingMenuItem ? 'Update' : 'Add'} Item
                    </button>
                    <button
                      onClick={() => {
                        setShowAddMenuItem(false)
                        setEditingMenuItem(null)
                        setMenuItemForm({ name: '', description: '', price: '', category: '', image: '', available: true })
                        setSelectedCategory('')
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <XIcon className="w-4 h-4 inline mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Menu Items List with Drag and Drop */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={menuItems.map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {menuItems.map((item) => (
                      <SortableMenuItem key={item.id} item={item} />
                    ))}
                    {menuItems.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No menu items yet</p>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* Meals Section - Multiple Meals Management */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Meals</h2>
                <button
                  onClick={() => {
                    resetMealEditor()
                    setShowMealEditor(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create New Meal
                </button>
              </div>

              {/* Meals List */}
              {meals.length > 0 && (
                <div className="mb-6 space-y-2">
                  {meals.map((mealItem) => (
                    <div
                      key={mealItem.id}
                      className={`p-4 border rounded-lg flex items-center justify-between ${
                        selectedMeal?.id === mealItem.id ? 'border-green-500 bg-green-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {mealItem.image && (
                          <img src={mealItem.image} alt={mealItem.name} className="w-16 h-16 object-cover rounded" />
                        )}
                        <div>
                          <h4 className="font-semibold">{mealItem.name}</h4>
                          <p className="text-sm text-gray-600">{mealItem.description}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm font-medium text-green-600">Base: ${mealItem.basePrice?.toFixed(2) || '0.00'}</span>
                            <span className="text-xs text-gray-500">
                              {mealItem.categories?.length || 0} categories, {mealItem.options?.length || 0} options
                            </span>
                            {mealItem.menuItems && mealItem.menuItems.length > 0 && (
                              <span className="text-xs text-blue-600">
                                Linked to {mealItem.menuItems.length} menu item{mealItem.menuItems.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {!mealItem.available && (
                              <span className="text-xs text-red-600 font-medium">Unavailable</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            loadMealIntoEditor(mealItem)
                            setShowMealEditor(true)
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMeal(mealItem.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Meal Editor Form */}
              {showMealEditor && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{selectedMeal ? 'Edit Meal' : 'Create New Meal'}</h3>
                    <button
                      onClick={() => {
                        setShowMealEditor(false)
                        resetMealEditor()
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>
                  </div>

              {/* Meal Editor Form */}
              {showMealEditor && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-300">
                  <h3 className="font-semibold mb-4">Configure Meal Deal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={mealForm.name}
                        onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Meal Deal"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={mealForm.basePrice}
                        onChange={(e) => setMealForm({ ...mealForm, basePrice: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="0.00"
                      />
                    </div>
                    {/* Dynamic Categories */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Categories *
                        </label>
                        <button
                          type="button"
                          onClick={addMealCategory}
                          className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add Category
                        </button>
                      </div>
                      <div className="space-y-2">
                        {mealCategories.map((category, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={category.name}
                              onChange={(e) => updateMealCategory(index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder={`Category ${category.order}`}
                            />
                            <span className="text-sm text-gray-500 w-8 text-center">
                              #{category.order}
                            </span>
                            {mealCategories.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeMealCategory(index)}
                                className="text-red-600 hover:text-red-800 p-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={mealForm.description}
                        onChange={(e) => setMealForm({ ...mealForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Meal description"
                        rows={2}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image
                      </label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return

                            // Validate file size (5MB max)
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('File too large. Maximum size is 5MB.')
                              return
                            }

                            try {
                              toast.loading('Uploading image...')
                              const formData = new FormData()
                              formData.append('file', file)

                              const response = await fetch('/api/upload-image', {
                                method: 'POST',
                                body: formData,
                              })

                              const data = await response.json()

                              if (response.ok && data.url) {
                                setMealForm({ ...mealForm, image: data.url })
                                toast.dismiss()
                                toast.success('Image uploaded successfully!')
                              } else {
                                toast.dismiss()
                                toast.error(data.error || 'Failed to upload image')
                              }
                            } catch (error) {
                              toast.dismiss()
                              toast.error('Failed to upload image')
                              console.error('Upload error:', error)
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                        />
                        <input
                          type="url"
                          value={mealForm.image}
                          onChange={(e) => setMealForm({ ...mealForm, image: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                          placeholder="Or paste image URL here"
                        />
                        {mealForm.image && (
                          <div className="mt-2">
                            <img
                              src={mealForm.image}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2 flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={mealForm.available}
                          onChange={(e) => setMealForm({ ...mealForm, available: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Available</span>
                      </label>
                    </div>
                  </div>

                  {/* Meal Options by Category */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Add menu items to each category. Set additional price (0 for included items, or extra amount for premium options).
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mealCategories.map((category, catIndex) => {
                        // Get a temporary ID for the category (use existing ID or generate one)
                        const categoryId = category.id || `temp_${catIndex}_${category.order}`
                        const categoryOptions = mealOptions.filter(opt => opt.categoryId === categoryId)
                        
                        return (
                          <div key={catIndex} className="p-4 bg-white rounded-lg border border-gray-300">
                            <h4 className="font-semibold mb-3">{category.name} (#{category.order})</h4>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  addMealOption(e.target.value, categoryId)
                                  e.target.value = ''
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
                            >
                              <option value="">Add menu item...</option>
                              {menuItems.filter(item => 
                                item.available && 
                                !mealOptions.some(opt => opt.menuItemId === item.id && opt.categoryId === categoryId)
                              ).map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                              ))}
                            </select>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {categoryOptions.map((opt, idx) => {
                                const menuItem = menuItems.find(item => item.id === opt.menuItemId)
                                const actualIdx = mealOptions.findIndex(o => o === opt)
                                return (
                                  <div key={idx} className="p-2 bg-gray-50 rounded flex items-center justify-between gap-2">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{menuItem?.name}</p>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={opt.additionalPrice}
                                        onChange={(e) => updateMealOptionPrice(actualIdx, parseFloat(e.target.value) || 0)}
                                        className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                                        placeholder="Extra price"
                                      />
                                    </div>
                                    <button
                                      onClick={() => removeMealOption(actualIdx)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <XIcon className="w-4 h-4" />
                                    </button>
    </div>
  )
                              })}
                              {categoryOptions.length === 0 && (
                                <p className="text-xs text-gray-500 text-center py-2">No items added</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Link Meal to Menu Items */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link to Menu Items (select which menu items can have this meal)
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {menuItems.map((item) => (
                        <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={linkedMenuItems.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setLinkedMenuItems([...linkedMenuItems, item.id])
                              } else {
                                setLinkedMenuItems(linkedMenuItems.filter(id => id !== item.id))
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{item.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveMeal}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4 inline mr-2" />
                      Save Meal
                    </button>
                    <button
                      onClick={() => setShowMealEditor(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <XIcon className="w-4 h-4 inline mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!showMealEditor && meals.length === 0 && (
                <p className="text-center text-gray-500 py-8">No meals created yet. Click "Create New Meal" to get started.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

