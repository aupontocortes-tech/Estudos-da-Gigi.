import { NextResponse } from 'next/server'
import db, { type DbNote, type DbSubject } from '@/lib/db'

export async function GET() {
  try {
    const notes = db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all() as DbNote[]
    
    const formattedNotes = notes.map(n => ({
      id: n.id,
      subjectId: n.subject_id,
      subjectName: n.subject_name,
      title: n.title,
      content: n.content,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    }))
    
    return NextResponse.json(formattedNotes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { subjectId, title, content } = await request.json()
    
    if (!subjectId || !title) {
      return NextResponse.json({ error: 'SubjectId and title are required' }, { status: 400 })
    }

    // Busca a materia
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId) as DbSubject | undefined
    
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const id = Date.now().toString()

    db.prepare('INSERT INTO notes (id, subject_id, subject_name, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, subjectId, subject.name, title, content || '', now, now)

    return NextResponse.json({
      id,
      subjectId,
      subjectName: subject.name,
      title,
      content: content || '',
      createdAt: now,
      updatedAt: now,
    })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, title, content } = await request.json()
    
    if (!id || !title) {
      return NextResponse.json({ error: 'ID and title are required' }, { status: 400 })
    }

    const now = new Date().toISOString()

    db.prepare('UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?').run(title, content || '', now, id)

    return NextResponse.json({ success: true, updatedAt: now })
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    db.prepare('DELETE FROM notes WHERE id = ?').run(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
