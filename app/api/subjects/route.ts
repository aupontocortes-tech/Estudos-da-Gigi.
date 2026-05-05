import { NextResponse } from 'next/server'
import db, { type DbSubject } from '@/lib/db'
import { SUBJECT_COLORS } from '@/lib/types'

export async function GET() {
  try {
    const subjects = db.prepare('SELECT * FROM subjects ORDER BY name').all() as DbSubject[]
    
    const formattedSubjects = subjects.map(s => ({
      id: s.id,
      name: s.name,
      color: s.color,
      totalTime: s.total_time,
    }))
    
    return NextResponse.json(formattedSubjects)
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Pega cores ja usadas
    const existingSubjects = db.prepare('SELECT color FROM subjects').all() as { color: string }[]
    const usedColors = existingSubjects.map(s => s.color)
    const availableColor = SUBJECT_COLORS.find(c => !usedColors.includes(c)) || SUBJECT_COLORS[existingSubjects.length % SUBJECT_COLORS.length]

    const id = Date.now().toString()
    
    db.prepare('INSERT INTO subjects (id, name, color, total_time) VALUES (?, ?, ?, ?)').run(id, name, availableColor, 0)

    return NextResponse.json({
      id,
      name,
      color: availableColor,
      totalTime: 0,
    })
  } catch (error) {
    console.error('Error creating subject:', error)
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    db.prepare('DELETE FROM subjects WHERE id = ?').run(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subject:', error)
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
  }
}
