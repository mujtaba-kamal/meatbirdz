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
  { id: 'signature-sauce', label: 'Signature sauce' },
  { id: 'garlic', label: 'Garlic' },
  { id: 'mayo', label: 'Mayo' },
  { id: 'cajun', label: 'Cajun' },
  { id: 'tomato', label: 'Tomato' },
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
  { id: 'loaded-angus-jalapeno', label: 'Skin loaded fries topped with fresh Angus, melted cheese, jalapenos & drizzled with house sauce.', price: 2.99 },
  { id: 'loaded-both-jalapeno', label: 'Skin loaded fries topped with crispy chicken and fresh Angus, melted cheese, jalapenos & drizzled with house sauce.', price: 4.99 },
]

// HexWrap Box wrap options
const hexWrapBoxOptions = [
  { id: 'crispy-bird-hex', label: 'The Crispy Bird Hex', price: 0 },
  { id: 'grilled-bird-hex', label: 'The Grilled Bird Hex', price: 0 },
  { id: 'meat-hex', label: 'The Meat Hex', price: 0 },
]

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
  // Buddy Box state (2 burgers, 2 drinks)
  const [buddyBoxFirstBurger, setBuddyBoxFirstBurger] = useState<Record<string, string>>({}) // menuItemId -> first burger option id
  const [buddyBoxSecondBurger, setBuddyBoxSecondBurger] = useState<Record<string, string>>({}) // menuItemId -> second burger option id
  const [buddyBoxFirstDrink, setBuddyBoxFirstDrink] = useState<Record<string, string>>({}) // menuItemId -> first drink option id
  const [buddyBoxSecondDrink, setBuddyBoxSecondDrink] = useState<Record<string, string>>({}) // menuItemId -> second drink option id
  // House Box state (4 burgers, 4 drinks, 8 dips)
  const [houseBoxFirstBurger, setHouseBoxFirstBurger] = useState<Record<string, string>>({}) // menuItemId -> first burger option id
  const [houseBoxSecondBurger, setHouseBoxSecondBurger] = useState<Record<string, string>>({}) // menuItemId -> second burger option id
  const [houseBoxThirdBurger, setHouseBoxThirdBurger] = useState<Record<string, string>>({}) // menuItemId -> third burger option id
  const [houseBoxFourthBurger, setHouseBoxFourthBurger] = useState<Record<string, string>>({}) // menuItemId -> fourth burger option id
  const [houseBoxFirstDrink, setHouseBoxFirstDrink] = useState<Record<string, string>>({}) // menuItemId -> first drink option id
  const [houseBoxSecondDrink, setHouseBoxSecondDrink] = useState<Record<string, string>>({}) // menuItemId -> second drink option id
  const [houseBoxThirdDrink, setHouseBoxThirdDrink] = useState<Record<string, string>>({}) // menuItemId -> third drink option id
  const [houseBoxFourthDrink, setHouseBoxFourthDrink] = useState<Record<string, string>>({}) // menuItemId -> fourth drink option id
  const [houseBoxFirstDip, setHouseBoxFirstDip] = useState<Record<string, string>>({}) // menuItemId -> first dip option id
  const [houseBoxSecondDip, setHouseBoxSecondDip] = useState<Record<string, string>>({}) // menuItemId -> second dip option id
  const [houseBoxThirdDip, setHouseBoxThirdDip] = useState<Record<string, string>>({}) // menuItemId -> third dip option id
  const [houseBoxFourthDip, setHouseBoxFourthDip] = useState<Record<string, string>>({}) // menuItemId -> fourth dip option id
  const [houseBoxFifthDip, setHouseBoxFifthDip] = useState<Record<string, string>>({}) // menuItemId -> fifth dip option id
  const [houseBoxSixthDip, setHouseBoxSixthDip] = useState<Record<string, string>>({}) // menuItemId -> sixth dip option id
  const [houseBoxSeventhDip, setHouseBoxSeventhDip] = useState<Record<string, string>>({}) // menuItemId -> seventh dip option id
  const [houseBoxEighthDip, setHouseBoxEighthDip] = useState<Record<string, string>>({}) // menuItemId -> eighth dip option id
  // Char-Flame Box state
  const [charFlameBoxDoubleBurger, setCharFlameBoxDoubleBurger] = useState<Record<string, boolean>>({}) // menuItemId -> double burger selected
  const [charFlameBoxDrinkChoice, setCharFlameBoxDrinkChoice] = useState<Record<string, string>>({}) // menuItemId -> selected drink option id
  const [charFlameBoxDipsChoice, setCharFlameBoxDipsChoice] = useState<Record<string, string[]>>({}) // menuItemId -> selected dips (max 2)
  // HexWrap Box state
  const [hexWrapBoxWrapChoice, setHexWrapBoxWrapChoice] = useState<Record<string, string>>({}) // menuItemId -> selected wrap option id
  const [hexWrapBoxFriesChoice, setHexWrapBoxFriesChoice] = useState<Record<string, string>>({}) // menuItemId -> selected fries option id
  const [hexWrapBoxDrinkChoice, setHexWrapBoxDrinkChoice] = useState<Record<string, string>>({}) // menuItemId -> selected drink option id
  const [hexWrapBoxDipsChoice, setHexWrapBoxDipsChoice] = useState<Record<string, string[]>>({}) // menuItemId -> selected dips (max 2)
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
      if (buddyBoxFirstBurger[item.id] === undefined) {
        setBuddyBoxFirstBurger((prev) => ({ ...prev, [item.id]: classicBoxBurgerOptions[0].id }))
      }
      if (buddyBoxSecondBurger[item.id] === undefined) {
        setBuddyBoxSecondBurger((prev) => ({ ...prev, [item.id]: classicBoxBurgerOptions[0].id }))
      }
      if (boxFriesChoice[item.id] === undefined) {
        setBoxFriesChoice((prev) => ({ ...prev, [item.id]: classicBoxFriesOptions[0].id }))
      }
      if (buddyBoxFirstDrink[item.id] === undefined) {
        setBuddyBoxFirstDrink((prev) => ({ ...prev, [item.id]: burgerDrinkOptions[0].id }))
      }
      if (buddyBoxSecondDrink[item.id] === undefined) {
        setBuddyBoxSecondDrink((prev) => ({ ...prev, [item.id]: burgerDrinkOptions[0].id }))
      }
    }
    // Initialize House Box customization if not set
    if (isHouseBox(item)) {
      if (houseBoxFirstBurger[item.id] === undefined) {
        setHouseBoxFirstBurger((prev) => ({ ...prev, [item.id]: classicBoxBurgerOptions[0].id }))
      }
      if (houseBoxSecondBurger[item.id] === undefined) {
        setHouseBoxSecondBurger((prev) => ({ ...prev, [item.id]: classicBoxBurgerOptions[0].id }))
      }
      if (houseBoxThirdBurger[item.id] === undefined) {
        setHouseBoxThirdBurger((prev) => ({ ...prev, [item.id]: classicBoxBurgerOptions[0].id }))
      }
      if (houseBoxFourthBurger[item.id] === undefined) {
        setHouseBoxFourthBurger((prev) => ({ ...prev, [item.id]: classicBoxBurgerOptions[0].id }))
      }
      if (boxFriesChoice[item.id] === undefined) {
        setBoxFriesChoice((prev) => ({ ...prev, [item.id]: classicBoxFriesOptions[0].id }))
      }
      if (houseBoxFirstDrink[item.id] === undefined) {
        setHouseBoxFirstDrink((prev) => ({ ...prev, [item.id]: burgerDrinkOptions[0].id }))
      }
      if (houseBoxSecondDrink[item.id] === undefined) {
        setHouseBoxSecondDrink((prev) => ({ ...prev, [item.id]: burgerDrinkOptions[0].id }))
      }
      if (houseBoxThirdDrink[item.id] === undefined) {
        setHouseBoxThirdDrink((prev) => ({ ...prev, [item.id]: burgerDrinkOptions[0].id }))
      }
      if (houseBoxFourthDrink[item.id] === undefined) {
        setHouseBoxFourthDrink((prev) => ({ ...prev, [item.id]: burgerDrinkOptions[0].id }))
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
        totalPrice += 2 // Base meal price (+£2)
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
        // Base meal price (+£2)
        unitPrice += 2

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
        // Base tender meal (+£2)
        itemTotalPrice += 2
        selectedAddOnsData.push({
          addOnId: 'tender-meal',
          name: 'Make it a meal (Fries + Drink)',
          price: 2,
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
      const firstBurgerId = buddyBoxFirstBurger[item.id] || classicBoxBurgerOptions[0].id
      const firstBurger = classicBoxBurgerOptions.find((opt) => opt.id === firstBurgerId) || classicBoxBurgerOptions[0]
      
      const secondBurgerId = buddyBoxSecondBurger[item.id] || classicBoxBurgerOptions[0].id
      const secondBurger = classicBoxBurgerOptions.find((opt) => opt.id === secondBurgerId) || classicBoxBurgerOptions[0]
      
      const selectedFriesId = boxFriesChoice[item.id] || classicBoxFriesOptions[0].id
      const selectedFries = classicBoxFriesOptions.find((opt) => opt.id === selectedFriesId) || classicBoxFriesOptions[0]
      
      const firstDrinkId = buddyBoxFirstDrink[item.id] || burgerDrinkOptions[0].id
      const firstDrink = burgerDrinkOptions.find((opt) => opt.id === firstDrinkId) || burgerDrinkOptions[0]
      
      const secondDrinkId = buddyBoxSecondDrink[item.id] || burgerDrinkOptions[0].id
      const secondDrink = burgerDrinkOptions.find((opt) => opt.id === secondDrinkId) || burgerDrinkOptions[0]
      
      const selectedDips = boxDipsChoice[item.id] || []
      
      // Add box selections to add-ons
      selectedAddOnsData.push({
        addOnId: `box-burger-first-${firstBurger.id}`,
        name: `First Burger: ${firstBurger.label}`,
        price: firstBurger.price,
      })
      
      selectedAddOnsData.push({
        addOnId: `box-burger-second-${secondBurger.id}`,
        name: `Second Burger: ${secondBurger.label}`,
        price: secondBurger.price,
      })
      
      selectedAddOnsData.push({
        addOnId: `box-fries-${selectedFries.id}`,
        name: `Fries: ${selectedFries.label}`,
        price: selectedFries.price,
      })
      
      selectedAddOnsData.push({
        addOnId: `box-drink-first-${firstDrink.id}`,
        name: `First Drink: ${firstDrink.label}`,
        price: 0,
      })
      
      selectedAddOnsData.push({
        addOnId: `box-drink-second-${secondDrink.id}`,
        name: `Second Drink: ${secondDrink.label}`,
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
      setBuddyBoxFirstBurger((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBuddyBoxSecondBurger((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBoxFriesChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBuddyBoxFirstDrink((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBuddyBoxSecondDrink((prev) => {
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

    // Special handling for House Box
    if (isHouseBox(item)) {
      const firstBurgerId = houseBoxFirstBurger[item.id] || classicBoxBurgerOptions[0].id
      const firstBurger = classicBoxBurgerOptions.find((opt) => opt.id === firstBurgerId) || classicBoxBurgerOptions[0]
      
      const secondBurgerId = houseBoxSecondBurger[item.id] || classicBoxBurgerOptions[0].id
      const secondBurger = classicBoxBurgerOptions.find((opt) => opt.id === secondBurgerId) || classicBoxBurgerOptions[0]
      
      const thirdBurgerId = houseBoxThirdBurger[item.id] || classicBoxBurgerOptions[0].id
      const thirdBurger = classicBoxBurgerOptions.find((opt) => opt.id === thirdBurgerId) || classicBoxBurgerOptions[0]
      
      const fourthBurgerId = houseBoxFourthBurger[item.id] || classicBoxBurgerOptions[0].id
      const fourthBurger = classicBoxBurgerOptions.find((opt) => opt.id === fourthBurgerId) || classicBoxBurgerOptions[0]
      
      const selectedFriesId = boxFriesChoice[item.id] || classicBoxFriesOptions[0].id
      const selectedFries = classicBoxFriesOptions.find((opt) => opt.id === selectedFriesId) || classicBoxFriesOptions[0]
      
      const firstDrinkId = houseBoxFirstDrink[item.id] || burgerDrinkOptions[0].id
      const firstDrink = burgerDrinkOptions.find((opt) => opt.id === firstDrinkId) || burgerDrinkOptions[0]
      
      const secondDrinkId = houseBoxSecondDrink[item.id] || burgerDrinkOptions[0].id
      const secondDrink = burgerDrinkOptions.find((opt) => opt.id === secondDrinkId) || burgerDrinkOptions[0]
      
      const thirdDrinkId = houseBoxThirdDrink[item.id] || burgerDrinkOptions[0].id
      const thirdDrink = burgerDrinkOptions.find((opt) => opt.id === thirdDrinkId) || burgerDrinkOptions[0]
      
      const fourthDrinkId = houseBoxFourthDrink[item.id] || burgerDrinkOptions[0].id
      const fourthDrink = burgerDrinkOptions.find((opt) => opt.id === fourthDrinkId) || burgerDrinkOptions[0]
      
      // Add box selections to add-ons
      selectedAddOnsData.push({
        addOnId: `box-burger-first-${firstBurger.id}`,
        name: `First Burger: ${firstBurger.label}`,
        price: firstBurger.price,
      })
      
      selectedAddOnsData.push({
        addOnId: `box-burger-second-${secondBurger.id}`,
        name: `Second Burger: ${secondBurger.label}`,
        price: secondBurger.price,
      })
      
      selectedAddOnsData.push({
        addOnId: `box-burger-third-${thirdBurger.id}`,
        name: `Third Burger: ${thirdBurger.label}`,
        price: thirdBurger.price,
      })
      
      selectedAddOnsData.push({
        addOnId: `box-burger-fourth-${fourthBurger.id}`,
        name: `Fourth Burger: ${fourthBurger.label}`,
        price: fourthBurger.price,
      })
      
      selectedAddOnsData.push({
        addOnId: `box-fries-${selectedFries.id}`,
        name: `Fries: ${selectedFries.label}`,
        price: selectedFries.price,
      })
      
      selectedAddOnsData.push({
        addOnId: `box-drink-first-${firstDrink.id}`,
        name: `First Drink: ${firstDrink.label}`,
        price: 0,
      })
      
      selectedAddOnsData.push({
        addOnId: `box-drink-second-${secondDrink.id}`,
        name: `Second Drink: ${secondDrink.label}`,
        price: 0,
      })
      
      selectedAddOnsData.push({
        addOnId: `box-drink-third-${thirdDrink.id}`,
        name: `Third Drink: ${thirdDrink.label}`,
        price: 0,
      })
      
      selectedAddOnsData.push({
        addOnId: `box-drink-fourth-${fourthDrink.id}`,
        name: `Fourth Drink: ${fourthDrink.label}`,
        price: 0,
      })
      
      // Add dips
      const dipSelections = [
        { id: houseBoxFirstDip[item.id], label: '1st' },
        { id: houseBoxSecondDip[item.id], label: '2nd' },
        { id: houseBoxThirdDip[item.id], label: '3rd' },
        { id: houseBoxFourthDip[item.id], label: '4th' },
        { id: houseBoxFifthDip[item.id], label: '5th' },
        { id: houseBoxSixthDip[item.id], label: '6th' },
        { id: houseBoxSeventhDip[item.id], label: '7th' },
        { id: houseBoxEighthDip[item.id], label: '8th' },
      ]
      
      dipSelections.forEach((dip, index) => {
        if (dip.id) {
          const dipOption = burgerDipOptions.find((d) => d.id === dip.id)
          if (dipOption) {
            selectedAddOnsData.push({
              addOnId: `box-dip-${dipOption.id}-${index}`,
              name: `${dip.label} Dip: ${dipOption.label}`,
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
      setHouseBoxFirstBurger((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxSecondBurger((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxThirdBurger((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxFourthBurger((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setBoxFriesChoice((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxFirstDrink((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxSecondDrink((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxThirdDrink((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxFourthDrink((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxFirstDip((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxSecondDip((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxThirdDip((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxFourthDip((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxFifthDip((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxSixthDip((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxSeventhDip((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
      setHouseBoxEighthDip((prev) => {
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
      selectedAddOnsData.push({
        addOnId: `hexwrap-wrap-${selectedWrap.id}`,
        name: `Wrap: ${selectedWrap.label}`,
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
      closeDrawer()
      return
    }

    const quantity = itemQuantities[item.id] || 1

    // Special meal handling for burgers and wraps
    if (item.category === 'burger' || item.category === 'wrap') {
      const isMeal = burgerMealSelected[item.id]
      let unitPrice = item.price

      if (isMeal) {
        // Base burger meal (+£2)
        unitPrice += 2
        selectedAddOnsData.push({
          addOnId: item.category === 'burger' ? 'burger-meal' : 'wrap-meal',
          name: 'Make it a meal (Fries + Drink)',
          price: 2,
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

        // Dips for all burgers and wraps with loaded fries
        const hasLoadedFries = friesChoice !== 'regular'
        if (hasLoadedFries) {
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
                  {/* Choose First Burger */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose First Burger:
                    </label>
                    <div className="space-y-2">
                      {classicBoxBurgerOptions.map((option) => {
                        const currentChoice = buddyBoxFirstBurger[selectedItem.id] || classicBoxBurgerOptions[0].id
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
                                name={`buddy-box-first-burger-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setBuddyBoxFirstBurger((prev) => ({
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

                  {/* Choose Second Burger */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Second Burger:
                    </label>
                    <div className="space-y-2">
                      {classicBoxBurgerOptions.map((option) => {
                        const currentChoice = buddyBoxSecondBurger[selectedItem.id] || classicBoxBurgerOptions[0].id
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
                                name={`buddy-box-second-burger-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setBuddyBoxSecondBurger((prev) => ({
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

                  {/* Choose First Drink */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose First Drink:
                    </label>
                    <div className="space-y-2">
                      {burgerDrinkOptions.map((option) => {
                        const currentChoice = buddyBoxFirstDrink[selectedItem.id] || burgerDrinkOptions[0].id
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
                                name={`buddy-box-first-drink-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setBuddyBoxFirstDrink((prev) => ({
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

                  {/* Choose Second Drink */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Second Drink:
                    </label>
                    <div className="space-y-2">
                      {burgerDrinkOptions.map((option) => {
                        const currentChoice = buddyBoxSecondDrink[selectedItem.id] || burgerDrinkOptions[0].id
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
                                name={`buddy-box-second-drink-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setBuddyBoxSecondDrink((prev) => ({
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

              {/* Box Customization - For House Box */}
              {isHouseBox(selectedItem) && (
                <div className="space-y-6">
                  {/* Choose First Burger */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose First Burger:
                    </label>
                    <div className="space-y-2">
                      {classicBoxBurgerOptions.map((option) => {
                        const currentChoice = houseBoxFirstBurger[selectedItem.id] || classicBoxBurgerOptions[0].id
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
                                name={`house-box-first-burger-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxFirstBurger((prev) => ({
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

                  {/* Choose Second Burger */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Second Burger:
                    </label>
                    <div className="space-y-2">
                      {classicBoxBurgerOptions.map((option) => {
                        const currentChoice = houseBoxSecondBurger[selectedItem.id] || classicBoxBurgerOptions[0].id
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
                                name={`house-box-second-burger-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxSecondBurger((prev) => ({
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

                  {/* Choose Third Burger */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Third Burger:
                    </label>
                    <div className="space-y-2">
                      {classicBoxBurgerOptions.map((option) => {
                        const currentChoice = houseBoxThirdBurger[selectedItem.id] || classicBoxBurgerOptions[0].id
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
                                name={`house-box-third-burger-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxThirdBurger((prev) => ({
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

                  {/* Choose Fourth Burger */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Fourth Burger:
                    </label>
                    <div className="space-y-2">
                      {classicBoxBurgerOptions.map((option) => {
                        const currentChoice = houseBoxFourthBurger[selectedItem.id] || classicBoxBurgerOptions[0].id
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
                                name={`house-box-fourth-burger-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxFourthBurger((prev) => ({
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

                  {/* Choose First Drink */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose First Drink:
                    </label>
                    <div className="space-y-2">
                      {burgerDrinkOptions.map((option) => {
                        const currentChoice = houseBoxFirstDrink[selectedItem.id] || burgerDrinkOptions[0].id
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
                                name={`house-box-first-drink-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxFirstDrink((prev) => ({
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

                  {/* Choose Second Drink */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Second Drink:
                    </label>
                    <div className="space-y-2">
                      {burgerDrinkOptions.map((option) => {
                        const currentChoice = houseBoxSecondDrink[selectedItem.id] || burgerDrinkOptions[0].id
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
                                name={`house-box-second-drink-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxSecondDrink((prev) => ({
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

                  {/* Choose Third Drink */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Third Drink:
                    </label>
                    <div className="space-y-2">
                      {burgerDrinkOptions.map((option) => {
                        const currentChoice = houseBoxThirdDrink[selectedItem.id] || burgerDrinkOptions[0].id
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
                                name={`house-box-third-drink-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxThirdDrink((prev) => ({
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

                  {/* Choose Fourth Drink */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose Fourth Drink:
                    </label>
                    <div className="space-y-2">
                      {burgerDrinkOptions.map((option) => {
                        const currentChoice = houseBoxFourthDrink[selectedItem.id] || burgerDrinkOptions[0].id
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
                                name={`house-box-fourth-drink-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxFourthDrink((prev) => ({
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

                  {/* Choose 1st Dip */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose 1st Dip:
                    </label>
                    <div className="space-y-2">
                      {burgerDipOptions.map((option) => {
                        const currentChoice = houseBoxFirstDip[selectedItem.id] || ''
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
                                name={`house-box-1st-dip-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxFirstDip((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
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

                  {/* Choose 2nd Dip */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose 2nd Dip:
                    </label>
                    <div className="space-y-2">
                      {burgerDipOptions.map((option) => {
                        const currentChoice = houseBoxSecondDip[selectedItem.id] || ''
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
                                name={`house-box-2nd-dip-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxSecondDip((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
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

                  {/* Choose 3rd Dip */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose 3rd Dip:
                    </label>
                    <div className="space-y-2">
                      {burgerDipOptions.map((option) => {
                        const currentChoice = houseBoxThirdDip[selectedItem.id] || ''
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
                                name={`house-box-3rd-dip-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxThirdDip((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
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

                  {/* Choose 4th Dip */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose 4th Dip:
                    </label>
                    <div className="space-y-2">
                      {burgerDipOptions.map((option) => {
                        const currentChoice = houseBoxFourthDip[selectedItem.id] || ''
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
                                name={`house-box-4th-dip-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxFourthDip((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
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

                  {/* Choose 5th Dip */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose 5th Dip:
                    </label>
                    <div className="space-y-2">
                      {burgerDipOptions.map((option) => {
                        const currentChoice = houseBoxFifthDip[selectedItem.id] || ''
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
                                name={`house-box-5th-dip-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxFifthDip((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
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

                  {/* Choose 6th Dip */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose 6th Dip:
                    </label>
                    <div className="space-y-2">
                      {burgerDipOptions.map((option) => {
                        const currentChoice = houseBoxSixthDip[selectedItem.id] || ''
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
                                name={`house-box-6th-dip-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxSixthDip((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
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

                  {/* Choose 7th Dip */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose 7th Dip:
                    </label>
                    <div className="space-y-2">
                      {burgerDipOptions.map((option) => {
                        const currentChoice = houseBoxSeventhDip[selectedItem.id] || ''
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
                                name={`house-box-7th-dip-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxSeventhDip((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
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

                  {/* Choose 8th Dip */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Choose 8th Dip:
                    </label>
                    <div className="space-y-2">
                      {burgerDipOptions.map((option) => {
                        const currentChoice = houseBoxEighthDip[selectedItem.id] || ''
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
                                name={`house-box-8th-dip-${selectedItem.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setHouseBoxEighthDip((prev) => ({
                                    ...prev,
                                    [selectedItem.id]: option.id,
                                  }))
                                }
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
                                onChange={() =>
                                  setHexWrapBoxWrapChoice((prev) => ({
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
                          setBurgerMealSelected((prev) => ({
                            ...prev,
                            [selectedItem.id]: !prev[selectedItem.id],
                          }))
                        }}
                        className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="font-medium text-gray-900">
                        Make it a meal (includes fries &amp; drink)
                      </span>
                    </div>
                    <span className="text-primary-600 font-semibold">+£2.00</span>
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
                    <span className="text-primary-600 font-semibold">+£2.00</span>
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
                                      // Reset dips if changing back to regular fries
                                      if (newFriesChoice === 'regular') {
                                        setBurgerDipsChoice((prev) => {
                                          const updated = { ...prev }
                                          delete updated[selectedItem.id]
                                          return updated
                                        })
                                      }
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

                      {/* Dips options - For all burgers with loaded fries */}
                      {burgerFriesChoice[selectedItem.id] !== 'regular' &&
                        burgerFriesChoice[selectedItem.id] !== undefined && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">
                              Dips (Select up to 2):
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
                        )}
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
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg"
                >
                  {(() => {
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
  )
}
