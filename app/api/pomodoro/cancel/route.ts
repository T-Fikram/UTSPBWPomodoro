import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()
    
    const session = await prisma.session.findUnique({ where: { id: sessionId } })
    if (!session || session.status !== 'active') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'interrupted' }
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cancel session' }, { status: 500 })
  }
}
