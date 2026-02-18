// Delivery fees for different postcodes
// Random fees between £1-5 as requested
export const deliveryFees: Record<string, number> = {
  'B1': 2.50,
  'B2': 3.00,
  'B3': 1.50,
  'B4': 2.00,
  'B5': 4.00,
  'B15': 3.50,
  'B16': 4.50,
  'B17': 2.50,
  'B18': 1.00,
  'B19': 5.00,
}

export const getDeliveryFee = (postalCode: string): number => {
  // Extract the postcode prefix (e.g., 'B1' from 'B1 1AA')
  const prefix = postalCode.split(' ')[0].toUpperCase()
  return deliveryFees[prefix] || 0
}

