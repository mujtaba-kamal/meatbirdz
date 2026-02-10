import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  // Check if user is authenticated and is an admin
  if (!session?.user || session.user.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  // Build date filter
  const buildWhereClause = () => {
    const whereClause: any = {}
    
    if (fromParam || toParam) {
      whereClause.createdAt = {}
      if (fromParam) {
        whereClause.createdAt.gte = new Date(fromParam)
      }
      if (toParam) {
        whereClause.createdAt.lte = new Date(toParam)
      }
    } else {
      // Default to last 24 hours if no date range specified
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setHours(now.getHours() - 24)
      whereClause.createdAt = {
        gte: yesterday,
        lte: now,
      }
    }
    return whereClause
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      
      const sendData = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Send initial data
      try {
        const orders = await prisma.order.findMany({
          where: buildWhereClause(),
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
        sendData({ type: 'initial', orders })
      } catch (error) {
        sendData({ type: 'error', error: 'Failed to fetch orders' })
        controller.close()
        return
      }

      // Poll for updates every 2 seconds
      const interval = setInterval(async () => {
        try {
          const orders = await prisma.order.findMany({
            where: buildWhereClause(),
            include: {
              items: {
                include: {
                  menuItem: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
          sendData({ type: 'update', orders })
        } catch (error) {
          console.error('Error polling orders:', error)
        }
      }, 2000)

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

