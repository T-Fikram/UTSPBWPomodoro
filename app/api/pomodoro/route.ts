import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Start a new Pomodoro session
export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { taskId, type } = json // type: 'focus', 'short_break', 'long_break'
    
    // Duration in minutes
    const durationMap: Record<string, number> = {
      focus: 25,
      short_break: 5,
      long_break: 15
    }
    const duration = durationMap[type] || 25

    // Cancel any existing active sessions
    await prisma.session.updateMany({
      where: { status: 'active' },
      data: { status: 'cancelled' }
    })

    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + duration * 60000)

    const session = await prisma.session.create({
      data: {
        taskId: taskId || null,
        type,
        startTime,
        endTime,
        status: 'active'
      }
    })

    return NextResponse.json(session)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start session' }, { status: 500 })
  }
}

// Get current active session
export async function GET() {
  try {
    const activeSession = await prisma.session.findFirst({
      where: { status: 'active' }
    })
    return NextResponse.json(activeSession || null)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}
