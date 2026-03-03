// Delivery fees for different postcodes
export const deliveryFees: Record<string, number> = {
  'B2': 4.00,
  'B3': 3.50,
  'B4': 3.50,
  'B5': 3.50,
  'B6': 4.00,
  'B7': 2.50,
  'B8': 2.00,
  'B9': 0, // Free delivery
  'B10': 0, // Free delivery
  'B11': 2.00,
  'B12': 3.50,
  'B13': 3.50,
  'B14': 4.00,
  'B25': 0, // Free delivery
  'B26': 2.00,
  'B33': 2.50,
  'B34': 3.50,
  'B35': 4.00,
}

export const getDeliveryFee = (postalCode: string): number => {
  // Extract the postcode prefix (e.g., 'B1' from 'B1 1AA')
  const prefix = postalCode.split(' ')[0].toUpperCase()
  return deliveryFees[prefix] || 0
}

