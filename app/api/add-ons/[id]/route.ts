import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// PUT - Update an add-on
export async function PUT(
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

    const addOnId = params.id
    const body = await request.json()
    const { name, price, available, order } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (price !== undefined) updateData.price = parseFloat(price)
    if (available !== undefined) updateData.available = available
    if (order !== undefined) updateData.order = parseInt(order)

    const addOn = await (prisma as any).addOn.update({
      where: { id: addOnId },
      data: updateData,
    })

    return NextResponse.json(addOn)
  } catch (error: any) {
    console.error('Error updating add-on:', error)
    return NextResponse.json(
      { error: 'Failed to update add-on', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete an add-on
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

    const addOnId = params.id

    await (prisma as any).addOn.delete({
      where: { id: addOnId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting add-on:', error)
    return NextResponse.json(
      { error: 'Failed to delete add-on', details: error.message },
      { status: 500 }
    )
  }
}

