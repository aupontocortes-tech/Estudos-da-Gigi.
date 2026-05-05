import { NextResponse } from 'next/server'
import db, { type DbSession, type DbSubject } from '@/lib/db'

export async function GET() {
  try {
    const sessions = db.prepare('SELECT * FROM sessions ORDER BY date DESC, start_time DESC').all() as DbSession[]
    
    const formattedSessions = sessions.map(s => ({
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

    // Busca a materia
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId) as DbSubject | undefined
    
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    const now = new Date()
    const id = Date.now().toString()
    const date = now.toLocaleDateString('pt-BR')
    const startTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    // Insere a sessao
    db.prepare('INSERT INTO sessions (id, subject_id, subject_name, date, start_time, duration) VALUES (?, ?, ?, ?, ?, ?)').run(id, subjectId, subject.name, date, startTime, duration)

    const tempoMin = Math.max(0, Math.round(duration / 60))
    db.prepare('INSERT INTO estudos (materia, tempo_min, data) VALUES (?, ?, ?)').run(
      subject.name,
      tempoMin,
      now.toISOString(),
    )

    // Atualiza o tempo total da materia
    db.prepare('UPDATE subjects SET total_time = total_time + ? WHERE id = ?').run(duration, subjectId)

    return NextResponse.json({
      id,
      subjectId,
      subjectName: subject.name,
      date,
      startTime,
      duration,
    })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
