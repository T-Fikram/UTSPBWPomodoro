import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const task = await prisma.task.create({
      data: {
        title: json.title,
        category: json.category || 'General',
        priority: json.priority || 'Medium',
        estimatedPomodoros: parseInt(json.estimatedPomodoros) || 1,
      }
    })
    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
