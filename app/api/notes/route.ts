import { NextResponse } from 'next/server'
import { repoDeleteNote, repoInsertNote, repoListNotes, repoUpdateNote } from '@/lib/repository'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const notes = await repoListNotes()

    const formattedNotes = notes.map((n) => ({
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

    const created = await repoInsertNote(subjectId, title, content)

    if (!created) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: created.id,
      subjectId: created.subjectId,
      subjectName: created.subjectName,
      title: created.title,
      content: created.content,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
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

    const { updatedAt } = await repoUpdateNote(id, title, content)

    return NextResponse.json({ success: true, updatedAt })
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

    await repoDeleteNote(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
