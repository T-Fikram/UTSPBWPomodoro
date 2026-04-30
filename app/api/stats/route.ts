import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const date = new Date().toISOString().split('T')[0]
    let stat = await prisma.dailyStat.findUnique({ where: { date } })
    
    if (!stat) {
      stat = { id: '', date, completedSessions: 0, focusedMinutes: 0 }
    }
    return NextResponse.json(stat)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
