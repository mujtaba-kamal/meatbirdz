// Delivery fees for different postcodes
export const deliveryFees: Record<string, number> = {
  'B2': 4.00,
  'B3': 3.50,
  'B4': 3.50,
  'B5': 3.50,
  'B6': 4.00,
  'B7': 2.50,
  'B8': 2.00,
  'B9': 0, // Free delivery (with minimum order)
  'B10': 0, // Free delivery (with minimum order)
  'B11': 2.00,
  'B12': 3.50,
  'B13': 3.50,
  'B14': 4.00,
  'B25': 0, // Free delivery (with minimum order)
  'B26': 2.00,
  'B33': 2.50,
  'B34': 3.50,
  'B35': 4.00,
}

// Postcodes with free delivery that require minimum order value
export const freeDeliveryPostcodes = ['B9', 'B10', 'B25']

// Minimum order value for free delivery (in pounds)
export const MINIMUM_ORDER_FOR_FREE_DELIVERY = 10

// Delivery fee charged if order is below minimum (in pounds)
export const DELIVERY_FEE_BELOW_MINIMUM = 2.00

export const getDeliveryFee = (postalCode: string, orderTotal: number = 0): number => {
  // Extract the postcode prefix (e.g., 'B1' from 'B1 1AA')
  const prefix = postalCode.split(' ')[0].toUpperCase()
  const baseFee = deliveryFees[prefix] || 0
  
  // If it's a free delivery postcode, check minimum order requirement
  if (freeDeliveryPostcodes.includes(prefix)) {
    if (orderTotal >= MINIMUM_ORDER_FOR_FREE_DELIVERY) {
      return 0 // Free delivery
    } else {
      return DELIVERY_FEE_BELOW_MINIMUM // Charge £2 if below minimum
    }
  }
  
  return baseFee
}

export const getDeliveryFeeByPostalCode = (postalCode: string): number => {
  // Legacy function for backward compatibility (without order total)
  const prefix = postalCode.split(' ')[0].toUpperCase()
  return deliveryFees[prefix] || 0
}

