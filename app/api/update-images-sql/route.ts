import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Menu items with their image URLs
const menuItemImages: Record<string, string> = {
  'Angus Classic': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
  'The Angus Three': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop',
  'The Holy Angus': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop',
  'The Crispy Bird': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop',
  'The Big Bird': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop',
  'Traditional Cheese ¼ Pounder': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
  'Traditional Cheese ½ Pounder': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
  'The Grilled Bird': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop',
  'The Double Grilled Bird': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop',
  'The Meat Hex': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop',
  'The Crispy Bird Hex': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop',
  'The Grilled Bird Hex': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop',
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
  'The Big Smash Up': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
  'The Dirty Bird': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
  'Chargrill Chicken Loaded Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
  'Spicy Cheese Loaded Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
  'The Classic Box': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
  'The Buddy Box': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
  'The House Box': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
  'The Char-Flame Box': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
  'The HexWrap Box': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
  'Ice Cola (330ml)': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop',
  'Ice Pro Max Diet (330ml)': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop',
  'Water (250ml/500ml)': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=400&fit=crop',
  'Rubicon Mango': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop',
  'Rubicon Passion': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop',
  'Ice Mojito': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop',
  'Signature Sauce': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop',
  'Garlic Mayo': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop',
  'Chilli Sauce': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop',
  'Cheese Sauce': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop',
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SETUP_TOKEN || 'setup-token-12345'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Use: Authorization: Bearer setup-token-12345' },
        { status: 401 }
      )
    }

    console.log('Starting SQL-based image update...')
    let updated = 0

    // Update each menu item using raw SQL
    for (const [name, imageUrl] of Object.entries(menuItemImages)) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "MenuItem" SET "image" = $1 WHERE "name" = $2`,
          imageUrl,
          name
        )
        updated++
        console.log(`✅ Updated ${name}`)
      } catch (error: any) {
        console.error(`❌ Failed to update ${name}:`, error.message)
      }
    }

    // Verify update
    const verifyItem = await prisma.menuItem.findFirst({
      where: { name: 'Angus Classic' },
      select: { name: true, image: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Menu item images updated successfully using SQL!',
      details: {
        updated,
        verification: {
          item: verifyItem?.name,
          image: verifyItem?.image ? 'SET' : 'NULL',
        },
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

