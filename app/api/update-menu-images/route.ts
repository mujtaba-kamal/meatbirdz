import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Menu items with their image URLs
const menuItemImages: Record<string, string> = {
  // BURGERS
  'Angus Classic': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
  'The Angus Three': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop',
  'The Holy Angus': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop',
  'The Crispy Bird': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop',
  'The Big Bird': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop',
  'Traditional Cheese ¼ Pounder': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
  'Traditional Cheese ½ Pounder': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
  'The Grilled Bird': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop',
  'The Double Grilled Bird': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop',
  // WRAPS
  'The Meat Hex': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop',
  'The Crispy Bird Hex': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop',
  'The Grilled Bird Hex': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop',
  // FRIES
  'Skin Fries - Regular': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
  'Skin Fries - Large': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
  'Piri Fries - Regular': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
  'Piri Fries - Large': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
  'Crispy Chicken Tenders - 3pc': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop',
  'Crispy Chicken Tenders - 6pc': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop',
  'Crispy Chicken Tenders - 9pc': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop',
  'Crispy Chicken Tenders - 12pc': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop',
  'Chargrilled Tenders - 3pc': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop',
  'Chargrilled Tenders - 6pc': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop',
  'Chargrilled Tenders - 9pc': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop',
  'Chargrilled Tenders - 12pc': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop',
  // LOADED FRIES
  'The Big Smash Up': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
  'The Dirty Bird': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
  'Chargrill Chicken Loaded Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
  'Spicy Cheese Loaded Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
  // BOXES
  'The Classic Box': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
  'The Buddy Box': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
  'The House Box': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
  'The Char-Flame Box': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
  'The HexWrap Box': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
  // DRINKS
  'Ice Cola (330ml)': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop',
  'Ice Pro Max Diet (330ml)': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop',
  'Water (250ml/500ml)': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=400&fit=crop',
  'Rubicon Mango': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop',
  'Rubicon Passion': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop',
  'Ice Mojito': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop',
  // DIPS
  'Signature Sauce': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop',
  'Garlic Mayo': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop',
  'Chilli Sauce': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop',
  'Cheese Sauce': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop',
}

export async function POST(request: Request) {
  try {
    // Simple security check
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SETUP_TOKEN || 'setup-token-12345'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Use: Authorization: Bearer setup-token-12345' },
        { status: 401 }
      )
    }

    console.log('Starting image update...')

    // Get all menu items
    const allMenuItems = await prisma.menuItem.findMany()
    console.log(`Found ${allMenuItems.length} menu items to update`)

    let updated = 0
    let notFound = 0

    // Update each menu item with its image
    for (const item of allMenuItems) {
      const imageUrl = menuItemImages[item.name]
      if (imageUrl) {
        await prisma.menuItem.update({
          where: { id: item.id },
          data: { image: imageUrl },
        })
        updated++
        console.log(`✅ Updated ${item.name}`)
      } else {
        notFound++
        console.log(`⚠️ No image found for: ${item.name}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Menu item images updated successfully!',
      details: {
        totalItems: allMenuItems.length,
        updated,
        notFound,
      },
    })
  } catch (error: any) {
    console.error('Update error:', error)
    return NextResponse.json(
      { error: 'Update failed', details: error.message },
      { status: 500 }
    )
  }
}

