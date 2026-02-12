import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`📋 Fetching order: ${params.id}`)
    
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            selectedAddOns: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          } as any, // Type assertion to include selectedAddOns
        },
      },
    })

    if (!order) {
      console.log(`❌ Order not found: ${params.id}`)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    console.log(`✅ Order found: ${order.id}, items: ${order.items.length}`)
    return NextResponse.json(order)
  } catch (error: any) {
    console.error('❌ Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

