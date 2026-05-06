import { NextResponse } from 'next/server'
import { repoCreateSession, repoListSessions } from '@/lib/repository'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const sessions = await repoListSessions()

    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      subjectId: s.subject_id,
      subjectName: s.subject_name,
      date: s.date,
      startTime: s.start_time,
      duration: s.duration,
    }))

    return NextResponse.json(formattedSessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { subjectId, duration } = await request.json()

    if (!subjectId || typeof duration !== 'number') {
      return NextResponse.json({ error: 'SubjectId and duration are required' }, { status: 400 })
    }

    const created = await repoCreateSession(subjectId, duration)

    if (!created) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: created.id,
      subjectId: created.subjectId,
      subjectName: created.subjectName,
      date: created.date,
      startTime: created.startTime,
      duration: created.duration,
    })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
