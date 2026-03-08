import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const orderId = params.id

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Delete order (OrderItems will be deleted automatically due to onDelete: Cascade)
    await prisma.order.delete({
      where: { id: orderId },
    })

    return NextResponse.json({ 
      success: true,
      message: 'Order deleted successfully' 
    })
  } catch (error: any) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: 'Failed to delete order', details: error.message },
      { status: 500 }
    )
  }
}

