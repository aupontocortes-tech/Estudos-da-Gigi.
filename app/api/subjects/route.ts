import { NextResponse } from 'next/server'
import { repoDeleteSubject, repoInsertSubject, repoListSubjects } from '@/lib/repository'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const subjects = await repoListSubjects()

    const formattedSubjects = subjects.map((s) => ({
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

    const row = await repoInsertSubject(name)

    return NextResponse.json({
      id: row.id,
      name: row.name,
      color: row.color,
      totalTime: row.total_time,
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

    await repoDeleteSubject(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subject:', error)
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
  }
}
