import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getEstudosStatsForPeriod } from '@/lib/estudos-stats'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (!start || !end) {
      return NextResponse.json({ error: 'Parameters start and end (ISO 8601) are required' }, { status: 400 })
    }

    const { items, totalMinutos } = getEstudosStatsForPeriod(db, start, end)

    return NextResponse.json({
      items,
      totalMinutos,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
