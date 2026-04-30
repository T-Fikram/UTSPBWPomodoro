import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()
    
    const session = await prisma.session.findUnique({ where: { id: sessionId } })
    if (!session || session.status !== 'active') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    // Mark session complete
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'completed' }
    })

    // If it was a focus session, update task and stats
    if (session.type === 'focus') {
      if (session.taskId) {
        const task = await prisma.task.findUnique({ where: { id: session.taskId } })
        if (task) {
          const newCompleted = task.completedPomodoros + 1
          const newStatus = newCompleted >= task.estimatedPomodoros ? 'completed' : 'in_progress'
          
          await prisma.task.update({
            where: { id: session.taskId },
            data: { 
              completedPomodoros: newCompleted,
              status: newStatus
            }
          })
        }
      }

      // Update Daily Stats
      const date = new Date().toISOString().split('T')[0]
      await prisma.dailyStat.upsert({
        where: { date },
        update: {
          completedSessions: { increment: 1 },
          focusedMinutes: { increment: 25 }
        },
        create: {
          date,
          completedSessions: 1,
          focusedMinutes: 25
        }
      })
    }

    return NextResponse.json(updatedSession)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 })
  }
}
