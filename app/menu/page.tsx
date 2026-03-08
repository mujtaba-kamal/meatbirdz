'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { Plus, Minus, MapPin, Store, Truck, X, Menu as MenuIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'

interface AddOn {
  id: string
  name: string
  price: number
  available: boolean
}

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  image: string | null
  available: boolean
  addOns?: AddOn[]
}

// Static meal configuration for burgers
const burgerFriesOptions = [
  { id: 'regular', label: 'Skin on fries', price: 0 },
  { id: 'loaded-chicken', label: 'Loaded skin on fries topped with crispy chicken, melted cheese and drizzled with house sauce.', price: 0.5 },
  { id: 'loaded-angus', label: 'Loaded skin on fries topped with Angus, melted cheese and drizzled with house sauce.', price: 1.49 },
  { id: 'loaded-both', label: 'Loaded skin on fries topped with crispy chicken and angus, melted cheese and drizzled with house sauce.', price: 2.49 },
]

const burgerDrinkOptions = [
  { id: 'ice-cola', label: 'Ice Cola (330ml)' },
  { id: 'ice-mojito', label: 'Ice Mojito' },
  { id: 'ice-pro-max-diet', label: 'Ice Pro Max Diet (330ml)' },
  { id: 'rubicon-mango', label: 'Rubicon Mango' },
  { id: 'rubicon-passion', label: 'Rubicon Passion' },
  { id: 'water', label: 'Water' },
]

const burgerDipOptions = [
  { id: 'signature-sauce', label: 'Signature' },
  { id: 'garlic-mayo', label: 'Garlic mayo' },
  { id: 'cajun-tomato', label: 'Cajun & tomato' },
  { id: 'mayo', label: 'Mayo' },
  { id: 'ketchup', label: 'Ketchup' },
  { id: 'cheese-sauce', label: 'Cheese sauce' },
]

// Tender quantity options
const crispyTenderOptions = [
  { id: '3', quantity: 3, price: 4.99 },
  { id: '6', quantity: 6, price: 6.99 },
  { id: '9', quantity: 9, price: 8.99 },
  { id: '12', quantity: 12, price: 11.99 },
]

const chargrilledTenderOptions = [
  { id: '3', quantity: 3, price: 5.99 },
  { id: '6', quantity: 6, price: 7.99 },
  { id: '9', quantity: 9, price: 9.99 },
  { id: '12', quantity: 12, price: 12.99 },
]

// Box customization options
const classicBoxBurgerOptions = [
  { id: 'crispy-bird-heat', label: 'The Crispy Bird (Heat)', price: 0 },
  { id: 'crispy-bird-classic', label: 'The Crispy Bird (Classic)', price: 0 },
  { id: 'angus-classic', label: 'Angus Classic', price: 0 },
]

const classicBoxFriesOptions = [
  { id: 'none', label: 'No fries', price: 0 },
  { id: 'loaded-chicken', label: 'Loaded fries with crispy chicken', price: 0 },
  { id: 'loaded-angus-jalapeno', label: 'Skin loaded fries topped with fresh Angus, melted cheese, jalapenos & drizzled with house sauce.', price: 0 },
  { id: 'loaded-both-jalapeno', label: 'Skin loaded fries topped with crispy chicken and fresh Angus, melted cheese, jalapenos & drizzled with house sauce.', price: 3.99 },
]

// HexWrap Box wrap options
const hexWrapBoxOptions = [
  { id: 'crispy-bird-hex', label: 'The Crispy Bird Hex', price: 0 },
  { id: 'grilled-bird-hex', label: 'The Grilled Bird Hex', price: 0 },
  { id: 'meat-hex', label: 'The Meat Hex', price: 0 },
]

const categories = [
  { id: 'burger', name: 'Burgers', emoji: '🍔' },
  { id: 'wrap', name: 'Hex-Wraps', emoji: '🌯' },
  { id: 'fries', name: 'Loaded-Fries', emoji: '🍟' },
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
  const [selectedMeal, setSelectedMeal] = useState<Record<string, string | null>>({}) // menuItemId -> selected addOnId (single selection, non-burgers)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Burger meal specific state
  const [burgerMealSelected, setBurgerMealSelected] = useState<Record<string, boolean>>({})
  const [burgerFriesChoice, setBurgerFriesChoice] = useState<Record<string, 'regular' | 'loaded-chicken' | 'loaded-angus' | 'loaded-both'>>({})
  const [burgerDrinkChoice, setBurgerDrinkChoice] = useState<Record<string, string>>({})
  const [burgerDipsChoice, setBurgerDipsChoice] = useState<Record<string, string[]>>({}) // Array of selected dip IDs (max 2)
  // Heat level state for crispy items
  const [heatLevelChoice, setHeatLevelChoice] = useState<Record<string, 'classic' | 'heat'>>({})
  // Tender quantity selection state
  const [tenderQuantityChoice, setTenderQuantityChoice] = useState<Record<string, string>>({}) // menuItemId -> selected quantity option id (e.g., '3', '6', '9', '12')
  // Box customization state
  const [boxBurgerChoice, setBoxBurgerChoice] = useState<Record<string, string>>({}) // menuItemId -> selected burger option id (Classic Box)
  const [boxFriesChoice, setBoxFriesChoice] = useState<Record<string, string>>({}) // menuItemId -> selected fries option id
  const [boxDrinkChoice, setBoxDrinkChoice] = useState<Record<string, string>>({}) // menuItemId -> selected drink option id (Classic Box)
  const [boxDipsChoice, setBoxDipsChoice] = useState<Record<string, string[]>>({}) // menuItemId -> selected dips (max 2)
  // Buddy Box state (2 burgers, 2 drinks) - quantity based
  const [buddyBoxBurgerQuantities, setBuddyBoxBurgerQuantities] = useState<Record<string, Record<string, number>>>({}) // menuItemId -> { burgerId: quantity }
  const [buddyBoxDrinkQuantities, setBuddyBoxDrinkQuantities] = useState<Record<string, Record<string, number>>>({}) // menuItemId -> { drinkId: quantity }
  const [buddyBoxDipQuantities, setBuddyBoxDipQuantities] = useState<Record<string, Record<string, number>>>({}) // menuItemId -> { dipId: quantity }
  // House Box state (4 burgers, 4 drinks, 8 dips) - quantity based
  const [houseBoxBurgerQuantities, setHouseBoxBurgerQuantities] = useState<Record<string, Record<string, number>>>({}) // menuItemId -> { burgerId: quantity }
  const [houseBoxDrinkQuantities, setHouseBoxDrinkQuantities] = useState<Record<string, Record<string, number>>>({}) // menuItemId -> { drinkId: quantity }
  const [houseBoxDipQuantities, setHouseBoxDipQuantities] = useState<Record<string, Record<string, number>>>({}) // menuItemId -> { dipId: quantity }
  // Char-Flame Box state
  const [charFlameBoxDoubleBurger, setCharFlameBoxDoubleBurger] = useState<Record<string, boolean>>({}) // menuItemId -> double burger selected
  const [charFlameBoxDrinkChoice, setCharFlameBoxDrinkChoice] = useState<Record<string, string>>({}) // menuItemId -> selected drink option id
  const [charFlameBoxDipsChoice, setCharFlameBoxDipsChoice] = useState<Record<string, string[]>>({}) // menuItemId -> selected dips (max 2)
  // HexWrap Box state
  const [hexWrapBoxWrapChoice, setHexWrapBoxWrapChoice] = useState<Record<string, string>>({}) // menuItemId -> selected wrap option id
  const [hexWrapBoxFriesChoice, setHexWrapBoxFriesChoice] = useState<Record<string, string>>({}) // menuItemId -> selected fries option id
  const [hexWrapBoxDrinkChoice, setHexWrapBoxDrinkChoice] = useState<Record<string, string>>({}) // menuItemId -> selected drink option id
  const [hexWrapBoxDipsChoice, setHexWrapBoxDipsChoice] = useState<Record<string, string[]>>({}) // menuItemId -> selected dips (max 2)
  const [hexWrapBoxHeatLevel, setHexWrapBoxHeatLevel] = useState<Record<string, 'classic' | 'heat'>>({}) // menuItemId -> heat level for Crispy Bird Hex
  const addItem = useCartStore((state) => state.addItem)

  // Fetch menu status
  useEffect(() => {
    const fetchMenuStatus = async () => {
      try {
        const response = await fetch('/api/menu-status')
        if (response.ok) {
          const data = await response.json()
          setMenuEnabled(data.enabled)
        }
      } catch (error) {
        console.error('Error fetching menu status:', error)
      }
    }
    fetchMenuStatus()
    // Poll menu status every 5 seconds
    const interval = setInterval(fetchMenuStatus, 5000)
    return () => clearInterval(interval)
  }, [])

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

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      console.log('📋 Fetching menu items...')
      const response = await fetch('/api/menu')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        console.error('❌ Menu API error:', errorData)
        throw new Error(errorData.error || errorData.details || `Failed to fetch menu: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📦 Menu API response:', { 
        isArray: Array.isArray(data), 
        length: Array.isArray(data) ? data.length : 0,
        hasError: data.error,
      })
      
      if (Array.isArray(data)) {
        console.log(`✅ Loaded ${data.length} menu items`)
        setMenuItems(data)
        const initialQuantities: Record<string, number> = {}
        data.forEach((item: MenuItem) => {
          initialQuantities[item.id] = 1
        })
        setItemQuantities(initialQuantities)
      } else if (data.items && Array.isArray(data.items)) {
        // Handle case where API returns { items: [...] }
        console.log(`✅ Loaded ${data.items.length} menu items from items array`)
        setMenuItems(data.items)
        const initialQuantities: Record<string, number> = {}
        data.items.forEach((item: MenuItem) => {
          initialQuantities[item.id] = 1
        })
        setItemQuantities(initialQuantities)
      } else {
        console.error('❌ Invalid data format:', data)
        toast.error(`Failed to load menu: ${data.error || 'Invalid data format'}`)
        setMenuItems([])
      }
    } catch (error: any) {
      console.error('❌ Error fetching menu:', error)
      toast.error(error.message || 'Failed to load menu')
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

  // Helper function to check if item needs heat level option
  const needsHeatLevel = (item: MenuItem): boolean => {
    const name = item.name.toLowerCase()
    return (
      name.includes('crispy bird') ||
      name.includes('big bird') ||
      name.includes('crispy chicken tenders')
    )
  }

  // Helper function to check if item is a tender
  const isTender = (item: MenuItem): boolean => {
    const name = item.name.toLowerCase()
    return name.includes('crispy chicken tenders') || name.includes('chargrilled tenders')
  }

  // Helper function to get tender quantity options
  const getTenderOptions = (item: MenuItem) => {
    const name = item.name.toLowerCase()
    if (name.includes('crispy chicken tenders')) {
      return crispyTenderOptions
    } else if (name.includes('chargrilled tenders')) {
      return chargrilledTenderOptions
    }
    return []
  }

  // Helper function to check if item is a box
  const isBox = (item: MenuItem): boolean => {
    const name = item.name.toLowerCase()
    return name.includes('classic box') || name.includes('buddy box') || name.includes('house box') || name.includes('char-flame box') || name.includes('hexwrap box')
  }

  // Helper function to check if item is Classic Box
  const isClassicBox = (item: MenuItem): boolean => {
    return item.name.toLowerCase().includes('classic box')
  }

  // Helper function to check if item is Buddy Box
  const isBuddyBox = (item: MenuItem): boolean => {
    return item.name.toLowerCase().includes('buddy box')
  }

  // Helper function to check if item is House Box
  const isHouseBox = (item: MenuItem): boolean => {
    return item.name.toLowerCase().includes('house box')
  }

  // Helper function to check if item is Char-Flame Box
  const isCharFlameBox = (item: MenuItem): boolean => {
    return item.name.toLowerCase().includes('char-flame box')
  }

  // Helper function to check if item is HexWrap Box
  const isHexWrapBox = (item: MenuItem): boolean => {
    return item.name.toLowerCase().includes('hexwrap box')
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
    // Initialize selected meal if not set
    if (!selectedMeal[item.id]) {
      setSelectedMeal((prev) => ({ ...prev, [item.id]: null }))
    }
    // Initialize burger/wrap meal state if not set
    if ((item.category === 'burger' || item.category === 'wrap') && burgerMealSelected[item.id] === undefined) {
      setBurgerMealSelected((prev) => ({ ...prev, [item.id]: false }))
      setBurgerFriesChoice((prev) => ({ ...prev, [item.id]: 'regular' }))
      setBurgerDrinkChoice((prev) => ({ ...prev, [item.id]: burgerDrinkOptions[0].id }))
    }
    // Initialize tender meal state if not set
    if (isTender(item) && burgerMealSelected[item.id] === undefined) {
      setBurgerMealSelected((prev) => ({ ...prev, [item.id]: false }))
      setBurgerFriesChoice((prev) => ({ ...prev, [item.id]: 'regular' })) // Always regular for tenders
      setBurgerDrinkChoice((prev) => ({ ...prev, [item.id]: burgerDrinkOptions[0].id }))
    }
    // Initialize heat level if not set (default to classic)
    if (needsHeatLevel(item) && heatLevelChoice[item.id] === undefined) {
      setHeatLevelChoice((prev) => ({ ...prev, [item.id]: 'classic' }))
    }
    // Initialize tender quantity if not set (default to 3)
    if (isTender(item) && tenderQuantityChoice[item.id] === undefined) {
      setTenderQuantityChoice((prev) => ({ ...prev, [item.id]: '3' }))
    }
    // Initialize box customization if not set
    if (isClassicBox(item)) {
      if (boxBurgerChoice[item.id] === undefined) {
        setBoxBurgerChoice((prev) => ({ ...prev, [item.id]: classicBoxBurgerOptions[0].id }))
      }
      if (boxFriesChoice[item.id] === undefined) {
        setBoxFriesChoice((prev) => ({ ...prev, [item.id]: classicBoxFriesOptions[0].id }))
      }
      if (boxDrinkChoice[item.id] === undefined) {
        setBoxDrinkChoice((prev) => ({ ...prev, [item.id]: burgerDrinkOptions[0].id }))
      }
    }
    // Initialize Buddy Box customization if not set
    if (isBuddyBox(item)) {
      if (!buddyBoxBurgerQuantities[item.id]) {
        setBuddyBoxBurgerQuantities((prev) => ({
          ...prev,
          [item.id]: {}, // Start empty
        }))
      }
      if (boxFriesChoice[item.id] === undefined) {
        setBoxFriesChoice((prev) => ({ ...prev, [item.id]: classicBoxFriesOptions[0].id }))
      }
      if (!buddyBoxDrinkQuantities[item.id]) {
        setBuddyBoxDrinkQuantities((prev) => ({
          ...prev,
          [item.id]: {}, // Start empty
        }))
      }
      if (!buddyBoxDipQuantities[item.id]) {
        setBuddyBoxDipQuantities((prev) => ({
          ...prev,
          [item.id]: {},
        }))
      }
    }
    // Initialize House Box customization if not set
    if (isHouseBox(item)) {
      if (!houseBoxBurgerQuantities[item.id]) {
        setHouseBoxBurgerQuantities((prev) => ({
          ...prev,
          [item.id]: {}, // Start empty
        }))
      }
      if (boxFriesChoice[item.id] === undefined) {
        setBoxFriesChoice((prev) => ({ ...prev, [item.id]: classicBoxFriesOptions[0].id }))
      }
      if (!houseBoxDrinkQuantities[item.id]) {
        setHouseBoxDrinkQuantities((prev) => ({
          ...prev,
          [item.id]: {}, // Start empty
        }))
      }
      if (!houseBoxDipQuantities[item.id]) {
        setHouseBoxDipQuantities((prev) => ({
          ...prev,
          [item.id]: {},
        }))
      }
    }
    // Initialize Char-Flame Box customization if not set
    if (isCharFlameBox(item)) {
      if (charFlameBoxDoubleBurger[item.id] === undefined) {
        setCharFlameBoxDoubleBurger((prev) => ({ ...prev, [item.id]: false }))
      }
      if (charFlameBoxDrinkChoice[item.id] === undefined) {
        setCharFlameBoxDrinkChoice((prev) => ({ ...prev, [item.id]: burgerDrinkOptions[0].id }))
      }
    }
    // Initialize HexWrap Box customization if not set
    if (isHexWrapBox(item)) {
      if (hexWrapBoxWrapChoice[item.id] === undefined) {
        setHexWrapBoxWrapChoice((prev) => ({ ...prev, [item.id]: hexWrapBoxOptions[0].id }))
      }
      if (hexWrapBoxFriesChoice[item.id] === undefined) {
        setHexWrapBoxFriesChoice((prev) => ({ ...prev, [item.id]: classicBoxFriesOptions[1].id })) // Default to first fries option (skip 'none')
      }
      if (hexWrapBoxDrinkChoice[item.id] === undefined) {
        setHexWrapBoxDrinkChoice((prev) => ({ ...prev, [item.id]: burgerDrinkOptions[0].id }))
      }
      // Initialize heat level if Crispy Bird Hex is selected (default to classic)
      const selectedWrapId = hexWrapBoxWrapChoice[item.id] || hexWrapBoxOptions[0].id
      if (selectedWrapId === 'crispy-bird-hex' && hexWrapBoxHeatLevel[item.id] === undefined) {
        setHexWrapBoxHeatLevel((prev) => ({ ...prev, [item.id]: 'classic' }))
      }
    }
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedItem(null)
  }

  const selectMeal = (menuItemId: string, addOnId: string | null) => {
    setSelectedMeal((prev) => {
      // If clicking the same option, deselect it
      if (prev[menuItemId] === addOnId) {
        return { ...prev, [menuItemId]: null }
      }
      return { ...prev, [menuItemId]: addOnId }
    })
  }

  const getItemTotalPrice = (item: MenuItem): number => {
    // Special pricing for Classic Box
    if (isClassicBox(item)) {
      let totalPrice = item.price
      
      // Add fries upgrade price if selected
      const friesChoice = boxFriesChoice[item.id] || classicBoxFriesOptions[0].id
      const friesOption = classicBoxFriesOptions.find((opt) => opt.id === friesChoice)
      if (friesOption) {
        totalPrice += friesOption.price
      }
      
      return totalPrice
    }
    
    // Special pricing for Buddy Box
    if (isBuddyBox(item)) {
      let totalPrice = item.price
      
      // Add fries upgrade price if selected
      const friesChoice = boxFriesChoice[item.id] || classicBoxFriesOptions[0].id
      const friesOption = classicBoxFriesOptions.find((opt) => opt.id === friesChoice)
      if (friesOption) {
        totalPrice += friesOption.price
      }
      
      return totalPrice
    }
    
    // Special pricing for House Box
    if (isHouseBox(item)) {
      let totalPrice = item.price
      
      // Add fries upgrade price if selected
      const friesChoice = boxFriesChoice[item.id] || classicBoxFriesOptions[0].id
      const friesOption = classicBoxFriesOptions.find((opt) => opt.id === friesChoice)
      if (friesOption) {
        totalPrice += friesOption.price
      }
      
      return totalPrice
    }
    
    // Special pricing for Char-Flame Box
    if (isCharFlameBox(item)) {
      let totalPrice = item.price
      
      // Add double burger price if selected
      if (charFlameBoxDoubleBurger[item.id]) {
        totalPrice += 1.5
      }
      
      return totalPrice
    }
    
    // Special pricing for HexWrap Box
    if (isHexWrapBox(item)) {
      let totalPrice = item.price
      
      // Add fries upgrade price if selected
      const friesChoice = hexWrapBoxFriesChoice[item.id] || classicBoxFriesOptions[1].id
      const friesOption = classicBoxFriesOptions.find((opt) => opt.id === friesChoice)
      if (friesOption) {
        totalPrice += friesOption.price
      }
      
      return totalPrice
    }
    
    // Special pricing for tenders (use selected quantity option price)
    if (isTender(item)) {
      const selectedQuantityId = tenderQuantityChoice[item.id] || '3'
      const tenderOptions = getTenderOptions(item)
      const selectedOption = tenderOptions.find((opt) => opt.id === selectedQuantityId) || tenderOptions[0]
      let totalPrice = selectedOption.price
      
      // Add meal price if selected
      const isMeal = burgerMealSelected[item.id]
      if (isMeal) {
        totalPrice += 2.5 // Base meal price (+£2.50)
        // Fries are always regular (skin on fries) for tenders, no extra cost
      }
      
      return totalPrice
    }

    const quantity = itemQuantities[item.id] || 1

    // Special meal logic for burgers and wraps
    if (item.category === 'burger' || item.category === 'wrap') {
      let unitPrice = item.price
      const isMeal = burgerMealSelected[item.id]

      if (isMeal) {
        // Base meal price (+£2.50)
        unitPrice += 2.5

        // Fries upgrade price based on selection
        const friesChoice = burgerFriesChoice[item.id] || 'regular'
        const friesOption = burgerFriesOptions.find((opt) => opt.id === friesChoice)
        if (friesOption) {
          unitPrice += friesOption.price
        }
      }

      return unitPrice * quantity
    }

    // Default add-on logic for non-burgers
    const basePrice = item.price * quantity
    const selectedAddOnId = selectedMeal[item.id] || null
    const selectedAddOn = selectedAddOnId ? item.addOns?.find((a) => a.id === selectedAddOnId) : null
    const addOnPrice = selectedAddOn ? selectedAddOn.price * quantity : 0
    return basePrice + addOnPrice
  }

  // Validation function to check if box selections are complete
  const isBoxSelectionComplete = (item: MenuItem): boolean => {
    if (isBuddyBox(item)) {
      const burgerTotal = Object.values(buddyBoxBurgerQuantities[item.id] || {}).reduce((sum, q) => sum + q, 0)
      const drinkTotal = Object.values(buddyBoxDrinkQuantities[item.id] || {}).reduce((sum, q) => sum + q, 0)
      const dipTotal = Object.values(buddyBoxDipQuantities[item.id] || {}).reduce((sum, q) => sum + q, 0)
      return burgerTotal === 2 && drinkTotal === 2 && dipTotal === 2
    }
    if (isHouseBox(item)) {
      const burgerTotal = Object.values(houseBoxBurgerQuantities[item.id] || {}).reduce((sum, q) => sum + q, 0)
      const drinkTotal = Object.values(houseBoxDrinkQuantities[item.id] || {}).reduce((sum, q) => sum + q, 0)
      const dipTotal = Object.values(houseBoxDipQuantities[item.id] || {}).reduce((sum, q) => sum + q, 0)
      return burgerTotal === 4 && drinkTotal === 4 && dipTotal === 8
    }
    if (isClassicBox(item)) {
      // Classic Box has 1 burger, 1 drink, 2 dips - check if all are selected
      const burgerSelected = !!boxBurgerChoice[item.id]
      const drinkSelected = !!boxDrinkChoice[item.id]
      const dipsSelected = (boxDipsChoice[item.id] || []).length === 2
      return burgerSelected && drinkSelected && dipsSelected
    }
    return true // Other items don't need validation
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
    
    const instructions = itemInstructions[item.id] || ''
    
    // Add heat level if needed (for crispy items)
    const selectedAddOnsData: {
      addOnId: string
      name: string
      price: number
    }[] = []
    
    if (needsHeatLevel(item)) {
      const heatLevel = heatLevelChoice[item.id] || 'classic'
      selectedAddOnsData.push({
        addOnId: `heat-level-${heatLevel}`,
        name: `Heat Level: ${heatLevel.charAt(0).toUpperCase() + heatLevel.slice(1)}`,
        price: 0,
      })
    }

    // Special handling for tenders (use selected quantity option)
    if (isTender(item)) {
      const selectedQuantityId = tenderQuantityChoice[item.id] || '3'
      const tenderOptions = getTenderOptions(item)
      const selectedOption = tenderOptions.find((opt) => opt.id === selectedQuantityId) || tenderOptions[0]
      
      // Add quantity info to add-ons
      selectedAddOnsData.push({
        addOnId: `tender-quantity-${selectedOption.id}`,
        name: `${selectedOption.quantity}x Tenders`,
        price: 0,
      })
      
      let itemTotalPrice = selectedOption.price
      const isMeal = burgerMealSelected[item.id]
      
      if (isMeal) {
        // Base tender meal (+£2.50)
        itemTotalPrice += 2.5
        selectedAddOnsData.push({
          addOnId: 'tender-meal',
          name: 'Make it a meal (Fries + Drink + 2 Dips)',
          price: 2.5,
        })
        
        // Fries choice (always regular/skin on fries for tenders)
        const friesOption = burgerFriesOptions.find((opt) => opt.id === 'regular') || burgerFriesOptions[0]
        selectedAddOnsData.push({
          addOnId: `tender-fries-${friesOption.id}`,
          name: friesOption.label,
          price: friesOption.price,
        })
        
        // Drink choice (default to first option)
        const drinkChoiceId = burgerDrinkChoice[item.id] || burgerDrinkOptions[0].id
        const drinkOption =
          burgerDrinkOptions.find((d) => d.id === drinkChoiceId) || burgerDrinkOptions[0]
        selectedAddOnsData.push({
          addOnId: `tender-drink-${drinkOption.id}`,
          name: `Drink: ${drinkOption.label}`,
          price: 0,
        })
        
        // Dips choice (choice of 2)
        const selectedDips = burgerDipsChoice[item.id] || []
        selectedDips.forEach((dipId) => {
          const dipOption = burgerDipOptions.find((d) => d.id === dipId)
          if (dipOption) {
            selectedAddOnsData.push({
              addOnId: `tender-dip-${dipOption.id}`,
              name: `Dip: ${dipOption.label}`,
              price: 0,
            })
          }
        })
      }
      
      addItem({
        id: `${item.id}-${Date.now()}`,
        name: item.name,
        price: itemTotalPrice,
        image: item.image || undefined,
        instructions: instructions || undefined,
        type: 'menuItem',
        menuItemId: item.id,
        selectedAddOns: selectedAddOnsData,
        quantity: 1,
      })
      
      const mealText = isMeal ? ' as a meal' : ''
      toast.success(`${selectedOption.quantity}x ${item.name}${mealText} added to cart`)
      
      // Reset and close drawer
      setItemInstructions((prev) => {
        const newInstructions = { ...prev }
        delete newInstructions[item.id]
        return newInstructions
      })
      if (needsHeatLevel(item)) {
        setHeatLevelChoice((prev) => {
          const updated = { ...prev }
          delete updated[item.id]
          return updated
        })
      }
      setTenderQuantityChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBurgerMealSelected((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBurgerFriesChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBurgerDrinkChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      closeDrawer()
      return
    }

    // Special handling for Classic Box
    if (isClassicBox(item)) {
      const selectedBurgerId = boxBurgerChoice[item.id] || classicBoxBurgerOptions[0].id
      const selectedBurger = classicBoxBurgerOptions.find((opt) => opt.id === selectedBurgerId) || classicBoxBurgerOptions[0]
      
      const selectedFriesId = boxFriesChoice[item.id] || classicBoxFriesOptions[0].id
      const selectedFries = classicBoxFriesOptions.find((opt) => opt.id === selectedFriesId) || classicBoxFriesOptions[0]
      
      const selectedDrinkId = boxDrinkChoice[item.id] || burgerDrinkOptions[0].id
      const selectedDrink = burgerDrinkOptions.find((opt) => opt.id === selectedDrinkId) || burgerDrinkOptions[0]
      
      const selectedDips = boxDipsChoice[item.id] || []
      
      // Add box selections to add-ons
      selectedAddOnsData.push({
        addOnId: `box-burger-${selectedBurger.id}`,
        name: `Burger: ${selectedBurger.label}`,
        price: selectedBurger.price,
      })
      
      selectedAddOnsData.push({
        addOnId: `box-fries-${selectedFries.id}`,
        name: `Fries: ${selectedFries.label}`,
        price: selectedFries.price,
      })
      
      selectedAddOnsData.push({
        addOnId: `box-drink-${selectedDrink.id}`,
        name: `Drink: ${selectedDrink.label}`,
        price: 0,
      })
      
      // Add dips
      selectedDips.forEach((dipId) => {
        const dipOption = burgerDipOptions.find((d) => d.id === dipId)
        if (dipOption) {
          selectedAddOnsData.push({
            addOnId: `box-dip-${dipOption.id}`,
            name: `Dip: ${dipOption.label}`,
            price: 0,
          })
        }
      })
      
      const itemTotalPrice = getItemTotalPrice(item)
      
      addItem({
        id: `${item.id}-${Date.now()}`,
        name: item.name,
        price: itemTotalPrice,
        image: item.image || undefined,
        instructions: instructions || undefined,
        type: 'menuItem',
        menuItemId: item.id,
        selectedAddOns: selectedAddOnsData,
        quantity: 1,
      })
      
      toast.success(`${item.name} added to cart`)
      
      // Reset and close drawer
      setItemInstructions((prev) => {
        const newInstructions = { ...prev }
        delete newInstructions[item.id]
        return newInstructions
      })
      setBoxBurgerChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBoxFriesChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBoxDrinkChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBoxDipsChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      closeDrawer()
      return
    }

    // Special handling for Buddy Box
    if (isBuddyBox(item)) {
      const burgerQuantities = buddyBoxBurgerQuantities[item.id] || {}
      const drinkQuantities = buddyBoxDrinkQuantities[item.id] || {}
      const dipQuantities = buddyBoxDipQuantities[item.id] || {}
      
      const selectedFriesId = boxFriesChoice[item.id] || classicBoxFriesOptions[0].id
      const selectedFries = classicBoxFriesOptions.find((opt) => opt.id === selectedFriesId) || classicBoxFriesOptions[0]
      
      // Add burgers with quantities
      Object.entries(burgerQuantities).forEach(([burgerId, quantity]) => {
        if (quantity > 0) {
          const burger = classicBoxBurgerOptions.find((opt) => opt.id === burgerId)
          if (burger) {
            selectedAddOnsData.push({
              addOnId: `box-burger-${burgerId}`,
              name: `${burger.label} x${quantity}`,
              price: burger.price,
            })
          }
        }
      })
      
      // Add fries
      if (selectedFries.id !== 'none') {
        selectedAddOnsData.push({
          addOnId: `box-fries-${selectedFries.id}`,
          name: `Fries: ${selectedFries.label}`,
          price: selectedFries.price,
        })
      }
      
      // Add drinks with quantities
      Object.entries(drinkQuantities).forEach(([drinkId, quantity]) => {
        if (quantity > 0) {
          const drink = burgerDrinkOptions.find((opt) => opt.id === drinkId)
          if (drink) {
            selectedAddOnsData.push({
              addOnId: `box-drink-${drinkId}`,
              name: `${drink.label} x${quantity}`,
              price: 0,
            })
          }
        }
      })
      
      // Add dips with quantities
      Object.entries(dipQuantities).forEach(([dipId, quantity]) => {
        if (quantity > 0) {
          const dip = burgerDipOptions.find((d) => d.id === dipId)
          if (dip) {
            selectedAddOnsData.push({
              addOnId: `box-dip-${dipId}`,
              name: `${dip.label} x${quantity}`,
              price: 0,
            })
          }
        }
      })
      
      const itemTotalPrice = getItemTotalPrice(item)
      
      addItem({
        id: `${item.id}-${Date.now()}`,
        name: item.name,
        price: itemTotalPrice,
        image: item.image || undefined,
        instructions: instructions || undefined,
        type: 'menuItem',
        menuItemId: item.id,
        selectedAddOns: selectedAddOnsData,
        quantity: 1,
      })
      
      toast.success(`${item.name} added to cart`)
      
      // Reset and close drawer
      setItemInstructions((prev) => {
        const newInstructions = { ...prev }
        delete newInstructions[item.id]
        return newInstructions
      })
      setBuddyBoxBurgerQuantities((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBoxFriesChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBuddyBoxDrinkQuantities((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBuddyBoxDipQuantities((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      closeDrawer()
      return
    }

    // Special handling for House Box
    if (isHouseBox(item)) {
      const burgerQuantities = houseBoxBurgerQuantities[item.id] || {}
      const drinkQuantities = houseBoxDrinkQuantities[item.id] || {}
      const dipQuantities = houseBoxDipQuantities[item.id] || {}
      
      const selectedFriesId = boxFriesChoice[item.id] || classicBoxFriesOptions[0].id
      const selectedFries = classicBoxFriesOptions.find((opt) => opt.id === selectedFriesId) || classicBoxFriesOptions[0]
      
      // Add burgers with quantities
      Object.entries(burgerQuantities).forEach(([burgerId, quantity]) => {
        if (quantity > 0) {
          const burger = classicBoxBurgerOptions.find((opt) => opt.id === burgerId)
          if (burger) {
            selectedAddOnsData.push({
              addOnId: `box-burger-${burgerId}`,
              name: `${burger.label} x${quantity}`,
              price: burger.price,
            })
          }
        }
      })
      
      // Add fries
      if (selectedFries.id !== 'none') {
        selectedAddOnsData.push({
          addOnId: `box-fries-${selectedFries.id}`,
          name: `Fries: ${selectedFries.label}`,
          price: selectedFries.price,
        })
      }
      
      // Add drinks with quantities
      Object.entries(drinkQuantities).forEach(([drinkId, quantity]) => {
        if (quantity > 0) {
          const drink = burgerDrinkOptions.find((opt) => opt.id === drinkId)
          if (drink) {
            selectedAddOnsData.push({
              addOnId: `box-drink-${drinkId}`,
              name: `${drink.label} x${quantity}`,
              price: 0,
            })
          }
        }
      })
      
      // Add dips with quantities
      Object.entries(dipQuantities).forEach(([dipId, quantity]) => {
        if (quantity > 0) {
          const dip = burgerDipOptions.find((d) => d.id === dipId)
          if (dip) {
            selectedAddOnsData.push({
              addOnId: `box-dip-${dipId}`,
              name: `${dip.label} x${quantity}`,
              price: 0,
            })
          }
        }
      })
      
      const itemTotalPrice = getItemTotalPrice(item)
      
      addItem({
        id: `${item.id}-${Date.now()}`,
        name: item.name,
        price: itemTotalPrice,
        image: item.image || undefined,
        instructions: instructions || undefined,
        type: 'menuItem',
        menuItemId: item.id,
        selectedAddOns: selectedAddOnsData,
        quantity: 1,
      })
      
      toast.success(`${item.name} added to cart`)
      
      // Reset and close drawer
      setItemInstructions((prev) => {
        const newInstructions = { ...prev }
        delete newInstructions[item.id]
        return newInstructions
      })
      setHouseBoxBurgerQuantities((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBoxFriesChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxDrinkQuantities((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxDipQuantities((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      closeDrawer()
      return
    }

    // Special handling for Char-Flame Box
    if (isCharFlameBox(item)) {
      const isDouble = charFlameBoxDoubleBurger[item.id] || false
      const selectedDrinkId = charFlameBoxDrinkChoice[item.id] || burgerDrinkOptions[0].id
      const selectedDrink = burgerDrinkOptions.find((opt) => opt.id === selectedDrinkId) || burgerDrinkOptions[0]
      const selectedDips = charFlameBoxDipsChoice[item.id] || []
      
      // Add double burger option if selected
      if (isDouble) {
        selectedAddOnsData.push({
          addOnId: 'char-flame-double-burger',
          name: 'Make it a double burger',
          price: 1.5,
        })
      }
      
      // Add drink
      selectedAddOnsData.push({
        addOnId: `char-flame-drink-${selectedDrink.id}`,
        name: `Drink: ${selectedDrink.label}`,
        price: 0,
      })
      
      // Add dips
      selectedDips.forEach((dipId) => {
        const dipOption = burgerDipOptions.find((d) => d.id === dipId)
        if (dipOption) {
          selectedAddOnsData.push({
            addOnId: `char-flame-dip-${dipOption.id}`,
            name: `Dip: ${dipOption.label}`,
            price: 0,
          })
        }
      })
      
      const itemTotalPrice = getItemTotalPrice(item)
      
      addItem({
        id: `${item.id}-${Date.now()}`,
        name: item.name,
        price: itemTotalPrice,
        image: item.image || undefined,
        instructions: instructions || undefined,
        type: 'menuItem',
        menuItemId: item.id,
        selectedAddOns: selectedAddOnsData,
        quantity: 1,
      })
      
      toast.success(`${item.name} added to cart`)
      
      // Reset and close drawer
      setItemInstructions((prev) => {
        const newInstructions = { ...prev }
        delete newInstructions[item.id]
        return newInstructions
      })
      setCharFlameBoxDoubleBurger((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setCharFlameBoxDrinkChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setCharFlameBoxDipsChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      closeDrawer()
      return
    }

    // Special handling for HexWrap Box
    if (isHexWrapBox(item)) {
      const selectedWrapId = hexWrapBoxWrapChoice[item.id] || hexWrapBoxOptions[0].id
      const selectedWrap = hexWrapBoxOptions.find((opt) => opt.id === selectedWrapId) || hexWrapBoxOptions[0]
      
      const selectedFriesId = hexWrapBoxFriesChoice[item.id] || classicBoxFriesOptions[1].id
      const selectedFries = classicBoxFriesOptions.find((opt) => opt.id === selectedFriesId) || classicBoxFriesOptions[1]
      
      const selectedDrinkId = hexWrapBoxDrinkChoice[item.id] || burgerDrinkOptions[0].id
      const selectedDrink = burgerDrinkOptions.find((opt) => opt.id === selectedDrinkId) || burgerDrinkOptions[0]
      
      const selectedDips = hexWrapBoxDipsChoice[item.id] || []
      
      // Add box selections to add-ons
      // Include heat level if Crispy Bird Hex is selected
      const wrapLabel = selectedWrap.id === 'crispy-bird-hex' 
        ? `${selectedWrap.label} (${hexWrapBoxHeatLevel[item.id] === 'heat' ? 'Heat' : 'Classic'})`
        : selectedWrap.label
      
      selectedAddOnsData.push({
        addOnId: `hexwrap-wrap-${selectedWrap.id}`,
        name: `Wrap: ${wrapLabel}`,
        price: selectedWrap.price,
      })
      
      // Only add fries if not "none"
      if (selectedFries.id !== 'none') {
        selectedAddOnsData.push({
          addOnId: `hexwrap-fries-${selectedFries.id}`,
          name: `Fries: ${selectedFries.label}`,
          price: selectedFries.price,
        })
      }
      
      selectedAddOnsData.push({
        addOnId: `hexwrap-drink-${selectedDrink.id}`,
        name: `Drink: ${selectedDrink.label}`,
        price: 0,
      })
      
      // Add dips
      selectedDips.forEach((dipId) => {
        const dipOption = burgerDipOptions.find((d) => d.id === dipId)
        if (dipOption) {
          selectedAddOnsData.push({
            addOnId: `hexwrap-dip-${dipOption.id}`,
            name: `Dip: ${dipOption.label}`,
            price: 0,
          })
        }
      })
      
      const itemTotalPrice = getItemTotalPrice(item)
      
      addItem({
        id: `${item.id}-${Date.now()}`,
        name: item.name,
        price: itemTotalPrice,
        image: item.image || undefined,
        instructions: instructions || undefined,
        type: 'menuItem',
        menuItemId: item.id,
        selectedAddOns: selectedAddOnsData,
        quantity: 1,
      })
      
      toast.success(`${item.name} added to cart`)
      
      // Reset and close drawer
      setItemInstructions((prev) => {
        const newInstructions = { ...prev }
        delete newInstructions[item.id]
        return newInstructions
      })
      setHexWrapBoxWrapChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHexWrapBoxFriesChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHexWrapBoxDrinkChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHexWrapBoxDipsChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHexWrapBoxHeatLevel((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      closeDrawer()
      return
    }

    const quantity = itemQuantities[item.id] || 1

    // Special meal handling for burgers and wraps
    if (item.category === 'burger' || item.category === 'wrap') {
      const isMeal = burgerMealSelected[item.id]
      let unitPrice = item.price

      if (isMeal) {
        // Base burger meal (+£2.50)
        unitPrice += 2.5
        selectedAddOnsData.push({
          addOnId: item.category === 'burger' ? 'burger-meal' : 'wrap-meal',
          name: 'Make it a meal (Fries + Drink + 2 Dips)',
          price: 2.5,
        })

        // Fries choice (default to regular)
        const friesChoice = burgerFriesChoice[item.id] || 'regular'
        const friesOption = burgerFriesOptions.find((opt) => opt.id === friesChoice) || burgerFriesOptions[0]
        unitPrice += friesOption.price
        const prefix = item.category === 'burger' ? 'burger' : 'wrap'
        selectedAddOnsData.push({
          addOnId: `${prefix}-fries-${friesOption.id}`,
          name: friesOption.label,
          price: friesOption.price,
        })

        // Drink choice (default to first option)
        const drinkChoiceId = burgerDrinkChoice[item.id] || burgerDrinkOptions[0].id
        const drinkOption =
          burgerDrinkOptions.find((d) => d.id === drinkChoiceId) || burgerDrinkOptions[0]
        selectedAddOnsData.push({
          addOnId: `${prefix}-drink-${drinkOption.id}`,
          name: `Drink: ${drinkOption.label}`,
          price: 0,
        })

        // Dips for all burger meals (choice of 2)
        const selectedDips = burgerDipsChoice[item.id] || []
        selectedDips.forEach((dipId) => {
          const dipOption = burgerDipOptions.find((d) => d.id === dipId)
          if (dipOption) {
            selectedAddOnsData.push({
              addOnId: `${prefix}-dip-${dipOption.id}`,
              name: `Dip: ${dipOption.label}`,
              price: 0,
            })
          }
        })
      }

      const itemTotalPrice = unitPrice

    for (let i = 0; i < quantity; i++) {
      addItem({
          id: `${item.id}-${Date.now()}-${i}`, // Unique ID for each item instance
        name: item.name,
          price: itemTotalPrice,
        image: item.image || undefined,
        instructions: instructions || undefined,
          type: 'menuItem',
          menuItemId: item.id,
          selectedAddOns: selectedAddOnsData,
      })
    }
    
      const mealText = isMeal ? ' as a meal' : ''
      toast.success(`${quantity}x ${item.name}${mealText} added to cart`)
    
      // Reset and close drawer
    setItemQuantities((prev) => ({ ...prev, [item.id]: 1 }))
    setItemInstructions((prev) => {
      const newInstructions = { ...prev }
      delete newInstructions[item.id]
      return newInstructions
    })
      setBurgerMealSelected((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBurgerFriesChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBurgerDrinkChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBurgerDipsChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      if (needsHeatLevel(item)) {
        setHeatLevelChoice((prev) => {
          const updated = { ...prev }
          delete updated[item.id]
          return updated
        })
      }
      closeDrawer()
      return
    }

    // Default handling for non-burgers (using add-ons from API)
    const selectedAddOnId = selectedMeal[item.id] || null
    const selectedAddOn = selectedAddOnId ? item.addOns?.find((a) => a.id === selectedAddOnId) : null
    const nonBurgerAddOns = selectedAddOn
      ? [
          {
            addOnId: selectedAddOn.id,
            name: selectedAddOn.name,
            price: selectedAddOn.price,
          },
        ]
      : []
    
    // Combine heat level (if needed) with other add-ons
    const finalSelectedAddOnsData = [...selectedAddOnsData, ...nonBurgerAddOns]

    const basePrice = item.price
    const addOnPrice = selectedAddOn ? selectedAddOn.price : 0
    const itemTotalPrice = basePrice + addOnPrice

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: `${item.id}-${Date.now()}-${i}`, // Unique ID for each item instance
        name: item.name,
        price: itemTotalPrice,
        image: item.image || undefined,
        instructions: instructions || undefined,
        type: 'menuItem',
        menuItemId: item.id,
        selectedAddOns: finalSelectedAddOnsData,
      })
    }
    
    const mealText = selectedAddOn ? ` with ${selectedAddOn.name}` : ''
    toast.success(`${quantity}x ${item.name}${mealText} added to cart`)
    
    // Reset and close drawer
    setItemQuantities((prev) => ({ ...prev, [item.id]: 1 }))
    setItemInstructions((prev) => {
      const newInstructions = { ...prev }
      delete newInstructions[item.id]
      return newInstructions
    })
    setSelectedMeal((prev) => {
      const newMeal = { ...prev }
      delete newMeal[item.id]
      return newMeal
    })
    if (needsHeatLevel(item)) {
      setHeatLevelChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
    }
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
    <div className="min-h-screen bg-gray-50 relative">
      {/* Menu Disabled Overlay */}
      {!menuEnabled && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Currently Unavailable</h2>
              <p className="text-gray-600">
                We&apos;re currently not accepting orders. Please check back later.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
      
      {/* Grey out content when menu is disabled */}
      <div className={menuEnabled ? '' : 'opacity-50 pointer-events-none'}>
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
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                £{getItemTotalPrice(selectedItem).toFixed(2)}
              </div>

              {/* Quantity Selection - Special handling for tenders and boxes */}
              {isTender(selectedItem) ? (
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-3">
                    Select Quantity:
                  </label>
                  <div className="space-y-2">
                    {getTenderOptions(selectedItem).map((option) => {
                      const currentChoice = tenderQuantityChoice[selectedItem.id] || '3'
                      const isSelected = currentChoice === option.id
                      return (
                        <label
                          key={option.id}
                          className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`tender-quantity-${selectedItem.id}`}
                              checked={isSelected}
                              onChange={() =>
                                setTenderQuantityChoice((prev) => ({
                                  ...prev,
                                  [selectedItem.id]: option.id,
                                }))
                              }
                              className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                            />
                            <span className="font-medium text-gray-900">
                              {option.quantity}x
                            </span>
                          </div>
                          <span className="text-primary-600 font-semibold">
                            £{option.price.toFixed(2)}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ) : isBox(selectedItem) ? (
                /* No quantity controls for boxes - always 1 */
                null
              ) : (
                /* Regular Quantity Controls for non-tenders */
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
              )}

              {/* Heat Level Selection - For crispy items */}
              {needsHeatLevel(selectedItem) && (
                    <div>
                  <label className="block text-base font-semibold text-gray-700 mb-3">
                    Heat Level:
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'classic', label: 'Classic' },
                      { id: 'heat', label: 'Heat' },
                    ].map((option) => {
                      const currentChoice = heatLevelChoice[selectedItem.id] || 'classic'
                      const isSelected = currentChoice === option.id
                      return (
                        <label
                          key={option.id}
                          className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`heat-level-${selectedItem.id}`}
                              checked={isSelected}
                              onChange={() =>
                                setHeatLevelChoice((prev) => ({
                                  ...prev,
                                  [selectedItem.id]: option.id as 'classic' | 'heat',
                                }))
                              }
                              className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                            />
                            <span className="font-medium text-gray-900">{option.label}</span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Box Customization - For Classic Box */}
              {isClassicBox(selectedItem) && (
                <div className="space-y-6">
                  {/* Choose Burger */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Burger:
                    </label>
                    <div className="space-y-2">
                      {classicBoxBurgerOptions.map((option) => {
                        const currentChoice = boxBurgerChoice[selectedItem.id] || classicBoxBurgerOptions[0].id
                        const isSelected = currentChoice === option.id
                        return (
                          <label
                            key={option.id}
                            className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name={`box-burger-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setBoxBurgerChoice((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                              />
                              <span className="font-medium text-gray-900">{option.label}</span>
                            </div>
                            {option.price > 0 && (
                              <span className="text-primary-600 font-semibold">
                                +£{option.price.toFixed(2)}
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Choose Loaded Fries */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Loaded Fries:
                    </label>
                    <div className="space-y-2">
                      {classicBoxFriesOptions.map((option) => {
                        const currentChoice = boxFriesChoice[selectedItem.id] || classicBoxFriesOptions[0].id
                        const isSelected = currentChoice === option.id
                        return (
                          <label
                            key={option.id}
                            className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="radio"
                                name={`box-fries-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setBoxFriesChoice((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 flex-shrink-0"
                              />
                              <span className="text-sm text-gray-900">{option.label}</span>
                            </div>
                            {option.price > 0 && (
                              <span className="text-sm font-medium text-primary-600 ml-2 flex-shrink-0">
                                +£{option.price.toFixed(2)}
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Choose Drink */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose a Drink:
                    </label>
                    <div className="space-y-2">
                      {burgerDrinkOptions.map((option) => {
                        const currentChoice =
                          boxDrinkChoice[selectedItem.id] || burgerDrinkOptions[0].id
                        const isSelected = currentChoice === option.id
                        return (
                          <label
                            key={option.id}
                            className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name={`box-drink-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setBoxDrinkChoice((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-900">{option.label}</span>
                            </div>
                            <span className="text-sm font-medium text-primary-600">
                              Included
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Choice of 2 Dips */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choice of 2 Dips:
                    </label>
                    <div className="space-y-2">
                      {burgerDipOptions.map((option) => {
                        const selectedDips = boxDipsChoice[selectedItem.id] || []
                        const isSelected = selectedDips.includes(option.id)
                        const canSelect = selectedDips.length < 2 || isSelected
                        return (
                          <label
                            key={option.id}
                            className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer transition-all ${
                              !canSelect
                                ? 'opacity-50 cursor-not-allowed'
                                : isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!canSelect}
                                onChange={() => {
                                  if (!canSelect) return
                                  setBoxDipsChoice((prev) => {
                                    const current = prev[selectedItem.id] || []
                                    if (current.includes(option.id)) {
                                      return {
                                        ...prev,
                                        [selectedItem.id]: current.filter((id) => id !== option.id),
                                      }
                                    } else {
                                      return {
                                        ...prev,
                                        [selectedItem.id]: [...current, option.id],
                                      }
                                    }
                                  })
                                }}
                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-900">{option.label}</span>
                            </div>
                            <span className="text-sm font-medium text-primary-600">Free</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Box Customization - For Buddy Box */}
              {isBuddyBox(selectedItem) && (
                <div className="space-y-6">
                  {/* Choose Burgers (2 total) */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Burgers (Total: 2):
                    </label>
                    <div className="space-y-3">
                      {classicBoxBurgerOptions.map((option) => {
                        const quantities = buddyBoxBurgerQuantities[selectedItem.id] || {}
                        const quantity = quantities[option.id] || 0
                        const totalSelected = Object.values(quantities).reduce((sum, q) => sum + q, 0)
                        const canIncrease = totalSelected < 2
                        
                        return (
                          <div
                            key={option.id}
                            className="flex items-center justify-between p-3 border-2 rounded-lg border-gray-200 bg-white"
                          >
                            <span className="font-medium text-gray-900 flex-1">{option.label}</span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (quantity > 0) {
                                    setBuddyBoxBurgerQuantities((prev) => ({
                                      ...prev,
                                      [selectedItem.id]: {
                                        ...(prev[selectedItem.id] || {}),
                                        [option.id]: quantity - 1,
                                      },
                                    }))
                                  }
                                }}
                                disabled={quantity === 0}
                                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-600"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-semibold">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (canIncrease) {
                                    setBuddyBoxBurgerQuantities((prev) => ({
                                      ...prev,
                                      [selectedItem.id]: {
                                        ...(prev[selectedItem.id] || {}),
                                        [option.id]: quantity + 1,
                                      },
                                    }))
                                  }
                                }}
                                disabled={!canIncrease}
                                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-600"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      <p className="text-xs text-gray-500 mt-2">
                        Selected: {Object.values(buddyBoxBurgerQuantities[selectedItem.id] || {}).reduce((sum, q) => sum + q, 0)} / 2
                      </p>
                    </div>
                  </div>

                  {/* Choose Loaded Fries */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Loaded Fries:
                    </label>
                    <div className="space-y-2">
                      {classicBoxFriesOptions.map((option) => {
                        const currentChoice = boxFriesChoice[selectedItem.id] || classicBoxFriesOptions[0].id
                        const isSelected = currentChoice === option.id
                        return (
                          <label
                            key={option.id}
                            className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="radio"
                                name={`box-fries-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setBoxFriesChoice((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 flex-shrink-0"
                              />
                              <span className="text-sm text-gray-900">{option.label}</span>
                            </div>
                            {option.price > 0 && (
                              <span className="text-sm font-medium text-primary-600 ml-2 flex-shrink-0">
                                +£{option.price.toFixed(2)}
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Choose Drinks (2 total) */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Drinks (Total: 2):
                    </label>
                    <div className="space-y-3">
                      {burgerDrinkOptions.map((option) => {
                        const quantities = buddyBoxDrinkQuantities[selectedItem.id] || {}
                        const quantity = quantities[option.id] || 0
                        const totalSelected = Object.values(quantities).reduce((sum, q) => sum + q, 0)
                        const canIncrease = totalSelected < 2
                        
                        return (
                          <div
                            key={option.id}
                            className="flex items-center justify-between p-3 border-2 rounded-lg border-gray-200 bg-white"
                          >
                            <span className="text-sm text-gray-900 flex-1">{option.label}</span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (quantity > 0) {
                                    setBuddyBoxDrinkQuantities((prev) => ({
                                      ...prev,
                                      [selectedItem.id]: {
                                        ...(prev[selectedItem.id] || {}),
                                        [option.id]: quantity - 1,
                                      },
                                    }))
                                  }
                                }}
                                disabled={quantity === 0}
                                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-600"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-semibold">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (canIncrease) {
                                    setBuddyBoxDrinkQuantities((prev) => ({
                                      ...prev,
                                      [selectedItem.id]: {
                                        ...(prev[selectedItem.id] || {}),
                                        [option.id]: quantity + 1,
                                      },
                                    }))
                                  }
                                }}
                                disabled={!canIncrease}
                                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-600"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      <p className="text-xs text-gray-500 mt-2">
                        Selected: {Object.values(buddyBoxDrinkQuantities[selectedItem.id] || {}).reduce((sum, q) => sum + q, 0)} / 2
                      </p>
                    </div>
                  </div>

                  {/* Choice of 2 Dips */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choice of Dips (Total: 2):
                    </label>
                    <div className="space-y-3">
                      {burgerDipOptions.map((option) => {
                        const quantities = buddyBoxDipQuantities[selectedItem.id] || {}
                        const quantity = quantities[option.id] || 0
                        const totalSelected = Object.values(quantities).reduce((sum, q) => sum + q, 0)
                        const canIncrease = totalSelected < 2
                        
                        return (
                          <div
                            key={option.id}
                            className="flex items-center justify-between p-3 border-2 rounded-lg border-gray-200 bg-white"
                          >
                            <span className="text-sm text-gray-900 flex-1">{option.label}</span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (quantity > 0) {
                                    setBuddyBoxDipQuantities((prev) => ({
                                      ...prev,
                                      [selectedItem.id]: {
                                        ...(prev[selectedItem.id] || {}),
                                        [option.id]: quantity - 1,
                                      },
                                    }))
                                  }
                                }}
                                disabled={quantity === 0}
                                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-600"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-semibold">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (canIncrease) {
                                    setBuddyBoxDipQuantities((prev) => ({
                                      ...prev,
                                      [selectedItem.id]: {
                                        ...(prev[selectedItem.id] || {}),
                                        [option.id]: quantity + 1,
                                      },
                                    }))
                                  }
                                }}
                                disabled={!canIncrease}
                                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-600"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      <p className="text-xs text-gray-500 mt-2">
                        Selected: {Object.values(buddyBoxDipQuantities[selectedItem.id] || {}).reduce((sum, q) => sum + q, 0)} / 2
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Box Customization - For House Box */}
              {isHouseBox(selectedItem) && (
                <div className="space-y-6">
                  {/* Choose Burgers (4 total) */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Burgers (Total: 4):
                    </label>
                    <div className="space-y-3">
                      {classicBoxBurgerOptions.map((option) => {
                        const quantities = houseBoxBurgerQuantities[selectedItem.id] || {}
                        const quantity = quantities[option.id] || 0
                        const totalSelected = Object.values(quantities).reduce((sum, q) => sum + q, 0)
                        const canIncrease = totalSelected < 4
                        
                        return (
                          <div
                            key={option.id}
                            className="flex items-center justify-between p-3 border-2 rounded-lg border-gray-200 bg-white"
                          >
                            <span className="font-medium text-gray-900 flex-1">{option.label}</span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (quantity > 0) {
                                    setHouseBoxBurgerQuantities((prev) => ({
                                      ...prev,
                                      [selectedItem.id]: {
                                        ...(prev[selectedItem.id] || {}),
                                        [option.id]: quantity - 1,
                                      },
                                    }))
                                  }
                                }}
                                disabled={quantity === 0}
                                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-600"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-semibold">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (canIncrease) {
                                    setHouseBoxBurgerQuantities((prev) => ({
                                      ...prev,
                                      [selectedItem.id]: {
                                        ...(prev[selectedItem.id] || {}),
                                        [option.id]: quantity + 1,
                                      },
                                    }))
                                  }
                                }}
                                disabled={!canIncrease}
                                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-600"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      <p className="text-xs text-gray-500 mt-2">
                        Selected: {Object.values(houseBoxBurgerQuantities[selectedItem.id] || {}).reduce((sum, q) => sum + q, 0)} / 4
                      </p>
                    </div>
                  </div>

                  {/* Choose Loaded Fries */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Loaded Fries:
                    </label>
                    <div className="space-y-2">
                      {classicBoxFriesOptions.map((option) => {
                        const currentChoice = boxFriesChoice[selectedItem.id] || classicBoxFriesOptions[0].id
                        const isSelected = currentChoice === option.id
                        return (
                          <label
                            key={option.id}
                            className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="radio"
                                name={`box-fries-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setBoxFriesChoice((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 flex-shrink-0"
                              />
                              <span className="text-sm text-gray-900">{option.label}</span>
                            </div>
                            {option.price > 0 && (
                              <span className="text-sm font-medium text-primary-600 ml-2 flex-shrink-0">
                                +£{option.price.toFixed(2)}
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Choose Drinks (4 total) */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Drinks (Total: 4):
                    </label>
                    <div className="space-y-3">
                      {burgerDrinkOptions.map((option) => {
                        const quantities = houseBoxDrinkQuantities[selectedItem.id] || {}
                        const quantity = quantities[option.id] || 0
                        const totalSelected = Object.values(quantities).reduce((sum, q) => sum + q, 0)
                        const canIncrease = totalSelected < 4
                        
                        return (
                          <div
                            key={option.id}
                            className="flex items-center justify-between p-3 border-2 rounded-lg border-gray-200 bg-white"
                          >
                            <span className="text-sm text-gray-900 flex-1">{option.label}</span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (quantity > 0) {
                                    setHouseBoxDrinkQuantities((prev) => ({
                                      ...prev,
                                      [selectedItem.id]: {
                                        ...(prev[selectedItem.id] || {}),
                                        [option.id]: quantity - 1,
                                      },
                                    }))
                                  }
                                }}
                                disabled={quantity === 0}
                                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-600"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-semibold">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (canIncrease) {
                                    setHouseBoxDrinkQuantities((prev) => ({
                                      ...prev,
                                      [selectedItem.id]: {
                                        ...(prev[selectedItem.id] || {}),
                                        [option.id]: quantity + 1,
                                      },
                                    }))
                                  }
                                }}
                                disabled={!canIncrease}
                                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-600"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      <p className="text-xs text-gray-500 mt-2">
                        Selected: {Object.values(houseBoxDrinkQuantities[selectedItem.id] || {}).reduce((sum, q) => sum + q, 0)} / 4
                      </p>
                    </div>
                  </div>

                  {/* Choice of 8 Dips */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choice of Dips (Total: 8):
                    </label>
                    <div className="space-y-3">
                      {burgerDipOptions.map((option) => {
                        const quantities = houseBoxDipQuantities[selectedItem.id] || {}
                        const quantity = quantities[option.id] || 0
                        const totalSelected = Object.values(quantities).reduce((sum, q) => sum + q, 0)
                        const canIncrease = totalSelected < 8
                        
                        return (
                          <div
                            key={option.id}
                            className="flex items-center justify-between p-3 border-2 rounded-lg border-gray-200 bg-white"
                          >
                            <span className="text-sm text-gray-900 flex-1">{option.label}</span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (quantity > 0) {
                                    setHouseBoxDipQuantities((prev) => ({
                                      ...prev,
                                      [selectedItem.id]: {
                                        ...(prev[selectedItem.id] || {}),
                                        [option.id]: quantity - 1,
                                      },
                                    }))
                                  }
                                }}
                                disabled={quantity === 0}
                                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-600"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-semibold">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (canIncrease) {
                                    setHouseBoxDipQuantities((prev) => ({
                                      ...prev,
                                      [selectedItem.id]: {
                                        ...(prev[selectedItem.id] || {}),
                                        [option.id]: quantity + 1,
                                      },
                                    }))
                                  }
                                }}
                                disabled={!canIncrease}
                                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-600"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      <p className="text-xs text-gray-500 mt-2">
                        Selected: {Object.values(houseBoxDipQuantities[selectedItem.id] || {}).reduce((sum, q) => sum + q, 0)} / 8
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Box Customization - For Char-Flame Box */}
              {isCharFlameBox(selectedItem) && (
                <div className="space-y-6">
                  {/* Make it a double burger */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Burger Options:
                    </label>
                    <label
                      className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        charFlameBoxDoubleBurger[selectedItem.id]
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!charFlameBoxDoubleBurger[selectedItem.id]}
                          onChange={() => {
                            setCharFlameBoxDoubleBurger((prev) => ({
                              ...prev,
                              [selectedItem.id]: !prev[selectedItem.id],
                            }))
                          }}
                          className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />
                        <span className="font-medium text-gray-900">
                          Make it a double burger
                        </span>
                      </div>
                      <span className="text-primary-600 font-semibold">+£1.50</span>
                    </label>
                  </div>

                  {/* Choose Drink */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose a Drink:
                    </label>
                    <div className="space-y-2">
                      {burgerDrinkOptions.map((option) => {
                        const currentChoice =
                          charFlameBoxDrinkChoice[selectedItem.id] || burgerDrinkOptions[0].id
                        const isSelected = currentChoice === option.id
                        return (
                          <label
                            key={option.id}
                            className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name={`char-flame-drink-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setCharFlameBoxDrinkChoice((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-900">{option.label}</span>
                            </div>
                            <span className="text-sm font-medium text-primary-600">
                              Included
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Choice of 2 Dips */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choice of 2 Dips:
                    </label>
                    <div className="space-y-2">
                      {burgerDipOptions.map((option) => {
                        const selectedDips = charFlameBoxDipsChoice[selectedItem.id] || []
                        const isSelected = selectedDips.includes(option.id)
                        const canSelect = selectedDips.length < 2 || isSelected
                        return (
                          <label
                            key={option.id}
                            className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer transition-all ${
                              !canSelect
                                ? 'opacity-50 cursor-not-allowed'
                                : isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!canSelect}
                                onChange={() => {
                                  if (!canSelect) return
                                  setCharFlameBoxDipsChoice((prev) => {
                                    const current = prev[selectedItem.id] || []
                                    if (current.includes(option.id)) {
                                      return {
                                        ...prev,
                                        [selectedItem.id]: current.filter((id) => id !== option.id),
                                      }
                                    } else {
                                      return {
                                        ...prev,
                                        [selectedItem.id]: [...current, option.id],
                                      }
                                    }
                                  })
                                }}
                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-900">{option.label}</span>
                            </div>
                            <span className="text-sm font-medium text-primary-600">Free</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Box Customization - For HexWrap Box */}
              {isHexWrapBox(selectedItem) && (
                <div className="space-y-6">
                  {/* Choose Wrap */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Wrap:
                    </label>
                    <div className="space-y-2">
                      {hexWrapBoxOptions.map((option) => {
                        const currentChoice = hexWrapBoxWrapChoice[selectedItem.id] || hexWrapBoxOptions[0].id
                        const isSelected = currentChoice === option.id
                        return (
                          <label
                            key={option.id}
                            className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name={`hexwrap-wrap-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() => {
                                  setHexWrapBoxWrapChoice((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                  // Initialize heat level if Crispy Bird Hex is selected
                                  if (option.id === 'crispy-bird-hex' && hexWrapBoxHeatLevel[selectedItem.id] === undefined) {
                                    setHexWrapBoxHeatLevel((prev) => ({ ...prev, [selectedItem.id]: 'classic' }))
                                  }
                                }}
                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                              />
                              <span className="font-medium text-gray-900">{option.label}</span>
                            </div>
                            {option.price > 0 && (
                              <span className="text-primary-600 font-semibold">
                                +£{option.price.toFixed(2)}
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Heat Level Selection - For Crispy Bird Hex */}
                  {hexWrapBoxWrapChoice[selectedItem.id] === 'crispy-bird-hex' && (
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Heat Level:
                      </label>
                      <div className="space-y-2">
                        {[
                          { id: 'classic', label: 'Classic' },
                          { id: 'heat', label: 'Heat' },
                        ].map((option) => {
                          const currentChoice = hexWrapBoxHeatLevel[selectedItem.id] || 'classic'
                          const isSelected = currentChoice === option.id
                          return (
                            <label
                              key={option.id}
                              className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-primary-600 bg-primary-50'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name={`hexwrap-heat-level-${selectedItem.id}`}
                                  checked={isSelected}
                                  onChange={() =>
                                    setHexWrapBoxHeatLevel((prev) => ({
                                      ...prev,
                                      [selectedItem.id]: option.id as 'classic' | 'heat',
                                    }))
                                  }
                                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                />
                                <span className="font-medium text-gray-900">{option.label}</span>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Choose Loaded Fries */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Loaded Fries:
                    </label>
                    <div className="space-y-2">
                      {classicBoxFriesOptions.map((option) => {
                        const currentChoice = hexWrapBoxFriesChoice[selectedItem.id] || classicBoxFriesOptions[1].id
                        const isSelected = currentChoice === option.id
                        return (
                          <label
                            key={option.id}
                            className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="radio"
                                name={`hexwrap-fries-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHexWrapBoxFriesChoice((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 flex-shrink-0"
                              />
                              <span className="text-sm text-gray-900">{option.label}</span>
                            </div>
                            {option.price > 0 && (
                              <span className="text-sm font-medium text-primary-600 ml-2 flex-shrink-0">
                                +£{option.price.toFixed(2)}
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Choose Drink */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose a Drink:
                    </label>
                    <div className="space-y-2">
                      {burgerDrinkOptions.map((option) => {
                        const currentChoice =
                          hexWrapBoxDrinkChoice[selectedItem.id] || burgerDrinkOptions[0].id
                        const isSelected = currentChoice === option.id
                        return (
                          <label
                            key={option.id}
                            className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name={`hexwrap-drink-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHexWrapBoxDrinkChoice((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-900">{option.label}</span>
                            </div>
                            <span className="text-sm font-medium text-primary-600">
                              Included
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Choice of 2 Dips */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choice of 2 Dips:
                    </label>
                    <div className="space-y-2">
                      {burgerDipOptions.map((option) => {
                        const selectedDips = hexWrapBoxDipsChoice[selectedItem.id] || []
                        const isSelected = selectedDips.includes(option.id)
                        const canSelect = selectedDips.length < 2 || isSelected
                        return (
                          <label
                            key={option.id}
                            className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer transition-all ${
                              !canSelect
                                ? 'opacity-50 cursor-not-allowed'
                                : isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!canSelect}
                                onChange={() => {
                                  if (!canSelect) return
                                  setHexWrapBoxDipsChoice((prev) => {
                                    const current = prev[selectedItem.id] || []
                                    if (current.includes(option.id)) {
                                      return {
                                        ...prev,
                                        [selectedItem.id]: current.filter((id) => id !== option.id),
                                      }
                                    } else {
                                      return {
                                        ...prev,
                                        [selectedItem.id]: [...current, option.id],
                                      }
                                    }
                                  })
                                }}
                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-900">{option.label}</span>
                            </div>
                            <span className="text-sm font-medium text-primary-600">Free</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Make it a meal - For Tenders */}
              {isTender(selectedItem) && (
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-3">
                    Make it a meal (Optional):
                  </label>
                  <label
                    className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      burgerMealSelected[selectedItem.id]
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!burgerMealSelected[selectedItem.id]}
                        onChange={() => {
                          const newValue = !burgerMealSelected[selectedItem.id]
                          setBurgerMealSelected((prev) => ({
                            ...prev,
                            [selectedItem.id]: newValue,
                          }))
                          // Reset dips if unchecking meal
                          if (!newValue) {
                            setBurgerDipsChoice((prev) => {
                              const updated = { ...prev }
                              delete updated[selectedItem.id]
                              return updated
                            })
                          }
                        }}
                        className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="font-medium text-gray-900">
                        Make it a meal (includes fries &amp; drink)
                      </span>
                    </div>
                    <span className="text-primary-600 font-semibold">+£2.50</span>
                  </label>

                  {burgerMealSelected[selectedItem.id] && (
                    <div className="mt-4 space-y-4">
                      {/* Fries - Only Skin on fries for tenders */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Fries:</p>
                        <div className="p-2 border rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-900">Skin on fries</span>
                            <span className="text-sm font-medium text-primary-600">Included</span>
                          </div>
                        </div>
                      </div>

                      {/* Drink options */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Drink:</p>
                        <div className="space-y-2">
                          {burgerDrinkOptions.map((option) => {
                            const currentChoice =
                              burgerDrinkChoice[selectedItem.id] || burgerDrinkOptions[0].id
                            const isSelected = currentChoice === option.id
                            return (
                              <label
                                key={option.id}
                                className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-primary-600 bg-primary-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name={`tender-drink-${selectedItem.id}`}
                                    checked={isSelected}
                                    onChange={() =>
                                      setBurgerDrinkChoice((prev) => ({
                                        ...prev,
                                        [selectedItem.id]: option.id,
                                      }))
                                    }
                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                  />
                                  <span className="text-sm text-gray-900">{option.label}</span>
                                </div>
                                <span className="text-sm font-medium text-primary-600">
                                  Included
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      {/* Dips options - For tenders meal */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Choice of 2 Dips:
                        </p>
                        <div className="space-y-2">
                          {burgerDipOptions.map((option) => {
                            const selectedDips = burgerDipsChoice[selectedItem.id] || []
                            const isSelected = selectedDips.includes(option.id)
                            const canSelect = selectedDips.length < 2 || isSelected
                            return (
                              <label
                                key={option.id}
                                className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer transition-all ${
                                  !canSelect
                                    ? 'opacity-50 cursor-not-allowed'
                                    : isSelected
                                    ? 'border-primary-600 bg-primary-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={!canSelect}
                                    onChange={() => {
                                      if (!canSelect) return
                                      setBurgerDipsChoice((prev) => {
                                        const current = prev[selectedItem.id] || []
                                        if (isSelected) {
                                          // Remove dip
                                          return {
                                            ...prev,
                                            [selectedItem.id]: current.filter(
                                              (id) => id !== option.id
                                            ),
                                          }
                                        } else {
                                          // Add dip (max 2)
                                          return {
                                            ...prev,
                                            [selectedItem.id]: [...current, option.id],
                                          }
                                        }
                                      })
                                    }}
                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                  />
                                  <span className="text-sm text-gray-900">{option.label}</span>
                                </div>
                                <span className="text-sm font-medium text-primary-600">
                                  Free
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Make it a meal - Burgers and Wraps have special fries & drink options */}
              {(selectedItem.category === 'burger' || selectedItem.category === 'wrap') && (
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-3">
                    Make it a meal (Optional):
                  </label>
                  <label
                    className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      burgerMealSelected[selectedItem.id]
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!burgerMealSelected[selectedItem.id]}
                        onChange={() => {
                          const newValue = !burgerMealSelected[selectedItem.id]
                          setBurgerMealSelected((prev) => ({
                            ...prev,
                            [selectedItem.id]: newValue,
                          }))
                          // Reset dips if unchecking meal
                          if (!newValue) {
                            setBurgerDipsChoice((prev) => {
                              const updated = { ...prev }
                              delete updated[selectedItem.id]
                              return updated
                            })
                          }
                        }}
                        className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="font-medium text-gray-900">
                        Make it a meal (includes fries &amp; drink)
                      </span>
                    </div>
                    <span className="text-primary-600 font-semibold">+£2.50</span>
                  </label>

                  {burgerMealSelected[selectedItem.id] && (
                    <div className="mt-4 space-y-4">
                      {/* Fries options */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Fries:</p>
                        <div className="space-y-2">
                          {burgerFriesOptions.map((option) => {
                            const currentChoice = burgerFriesChoice[selectedItem.id] || 'regular'
                            const isSelected = currentChoice === option.id
                            return (
                              <label
                                key={option.id}
                                className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-primary-600 bg-primary-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <input
                                    type="radio"
                                    name={`${selectedItem.category}-fries-${selectedItem.id}`}
                                    checked={isSelected}
                        onChange={() => {
                          const newFriesChoice = option.id as 'regular' | 'loaded-chicken' | 'loaded-angus' | 'loaded-both'
                          setBurgerFriesChoice((prev) => ({
                            ...prev,
                            [selectedItem.id]: newFriesChoice,
                          }))
                          // Don't reset dips - dips are available for all meals
                        }}
                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 flex-shrink-0"
                                  />
                                  <span className="text-sm text-gray-900">{option.label}</span>
                                </div>
                                <span className="text-sm font-medium text-primary-600 ml-2 flex-shrink-0">
                                  {option.price > 0 ? `+£${option.price.toFixed(2)}` : 'Included'}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      {/* Drink options */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Drink:</p>
                        <div className="space-y-2">
                          {burgerDrinkOptions.map((option) => {
                            const currentChoice =
                              burgerDrinkChoice[selectedItem.id] || burgerDrinkOptions[0].id
                            const isSelected = currentChoice === option.id
                            return (
                              <label
                                key={option.id}
                                className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-primary-600 bg-primary-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name={`${selectedItem.category}-drink-${selectedItem.id}`}
                                    checked={isSelected}
                                    onChange={() =>
                                      setBurgerDrinkChoice((prev) => ({
                                        ...prev,
                                        [selectedItem.id]: option.id,
                                      }))
                                    }
                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                  />
                                  <span className="text-sm text-gray-900">{option.label}</span>
                                </div>
                                <span className="text-sm font-medium text-primary-600">
                                  Included
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      {/* Dips options - For all burger meals */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Choice of 2 Dips:
                        </p>
                            <div className="space-y-2">
                              {burgerDipOptions.map((option) => {
                                const selectedDips = burgerDipsChoice[selectedItem.id] || []
                                const isSelected = selectedDips.includes(option.id)
                                const canSelect = selectedDips.length < 2 || isSelected
                                return (
                                  <label
                                    key={option.id}
                                    className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer transition-all ${
                                      !canSelect
                                        ? 'opacity-50 cursor-not-allowed'
                                        : isSelected
                                        ? 'border-primary-600 bg-primary-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        disabled={!canSelect}
                                        onChange={() => {
                                          if (!canSelect) return
                                          setBurgerDipsChoice((prev) => {
                                            const current = prev[selectedItem.id] || []
                                            if (isSelected) {
                                              // Remove dip
                                              return {
                                                ...prev,
                                                [selectedItem.id]: current.filter(
                                                  (id) => id !== option.id
                                                ),
                                              }
                                            } else {
                                              // Add dip (max 2)
                                              return {
                                                ...prev,
                                                [selectedItem.id]: [...current, option.id],
                                              }
                                            }
                                          })
                                        }}
                                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                      />
                                      <span className="text-sm text-gray-900">{option.label}</span>
                                    </div>
                                    <span className="text-sm font-medium text-primary-600">
                                      Free
                                    </span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                    </div>
                  )}
                </div>
              )}

              {/* Make it a meal / add-ons for non-burgers (from admin panel) */}
              {selectedItem.category !== 'burger' &&
                selectedItem.addOns &&
                selectedItem.addOns.length > 0 && (
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Make it a meal - Options (Optional):
                    </label>
                    <div className="space-y-2">
                      {selectedItem.addOns
                        .filter((addOn) => addOn.available)
                        .map((addOn) => {
                          const isSelected = selectedMeal[selectedItem.id] === addOn.id
                          return (
                            <label
                              key={addOn.id}
                              className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-primary-600 bg-primary-50'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name={`meal-${selectedItem.id}`}
                                  checked={isSelected}
                                  onChange={() => selectMeal(selectedItem.id, addOn.id)}
                                  className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                                />
                                <span className="font-medium text-gray-900">{addOn.name}</span>
                              </div>
                              <span className="text-primary-600 font-semibold">
                                +£{addOn.price.toFixed(2)}
                              </span>
                            </label>
                          )
                        })}
                    </div>
                  </div>
                )}

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


                    {/* Add to Cart Button */}
              <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 -mx-4 px-4 pb-4">
                    <button
                  onClick={() => handleAddToCart(selectedItem)}
                  disabled={isBox(selectedItem) && !isBoxSelectionComplete(selectedItem)}
                  className={`w-full py-4 rounded-xl font-semibold transition-all shadow-lg ${
                    isBox(selectedItem) && !isBoxSelectionComplete(selectedItem)
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800'
                  }`}
                >
                  {(() => {
                    if (isBox(selectedItem) && !isBoxSelectionComplete(selectedItem)) {
                      if (isBuddyBox(selectedItem)) {
                        const burgerTotal = Object.values(buddyBoxBurgerQuantities[selectedItem.id] || {}).reduce((sum, q) => sum + q, 0)
                        const drinkTotal = Object.values(buddyBoxDrinkQuantities[selectedItem.id] || {}).reduce((sum, q) => sum + q, 0)
                        const dipTotal = Object.values(buddyBoxDipQuantities[selectedItem.id] || {}).reduce((sum, q) => sum + q, 0)
                        return `Please select ${2 - burgerTotal} more burger(s), ${2 - drinkTotal} more drink(s), ${2 - dipTotal} more dip(s)`
                      }
                      if (isHouseBox(selectedItem)) {
                        const burgerTotal = Object.values(houseBoxBurgerQuantities[selectedItem.id] || {}).reduce((sum, q) => sum + q, 0)
                        const drinkTotal = Object.values(houseBoxDrinkQuantities[selectedItem.id] || {}).reduce((sum, q) => sum + q, 0)
                        const dipTotal = Object.values(houseBoxDipQuantities[selectedItem.id] || {}).reduce((sum, q) => sum + q, 0)
                        return `Please select ${4 - burgerTotal} more burger(s), ${4 - drinkTotal} more drink(s), ${8 - dipTotal} more dip(s)`
                      }
                      if (isClassicBox(selectedItem)) {
                        const burgerSelected = !!boxBurgerChoice[selectedItem.id]
                        const drinkSelected = !!boxDrinkChoice[selectedItem.id]
                        const dipsSelected = (boxDipsChoice[selectedItem.id] || []).length
                        const missing = []
                        if (!burgerSelected) missing.push('1 burger')
                        if (!drinkSelected) missing.push('1 drink')
                        if (dipsSelected < 2) missing.push(`${2 - dipsSelected} more dip(s)`)
                        return `Please select ${missing.join(', ')}`
                      }
                    }
                    const quantity = itemQuantities[selectedItem.id] || 1
                    const totalPrice = getItemTotalPrice(selectedItem)
                    return `Add ${quantity > 1 ? `${quantity}x ` : ''}to Cart - £${totalPrice.toFixed(2)}`
                  })()}
                    </button>
                  </div>
              </div>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
