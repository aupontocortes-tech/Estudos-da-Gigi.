import type { DbSubject, DbSession, DbNote } from '@/lib/db-types'
import { SUBJECT_COLORS } from '@/lib/types'
import { getEstudosStatsForPeriod } from '@/lib/estudos-stats'
import { statsFromAggregateRows } from '@/lib/materia-stats'
import { hasPostgres, ensurePgSchema, getNeonSql } from '@/lib/pg'
import { durationSecondsToStatMinutes } from '@/lib/session-date'

async function getSqlite() {
  const { default: db } = await import('@/lib/sqlite')
  return db
}

export async function repoListSubjects(): Promise<DbSubject[]> {
  if (hasPostgres()) {
    await ensurePgSchema()
    const sql = getNeonSql()
    const rows = await sql`SELECT id, name, color, total_time FROM subjects ORDER BY name`
    return rows as DbSubject[]
  }
  const db = await getSqlite()
  return db.prepare('SELECT * FROM subjects ORDER BY name').all() as DbSubject[]
}

export async function repoInsertSubject(name: string): Promise<DbSubject> {
  if (hasPostgres()) {
    await ensurePgSchema()
    const sql = getNeonSql()
    const existing = await sql`SELECT color FROM subjects`
    const usedColors = (existing as { color: string }[]).map((s) => s.color)
    const availableColor =
      SUBJECT_COLORS.find((c) => !usedColors.includes(c)) ||
      SUBJECT_COLORS[usedColors.length % SUBJECT_COLORS.length]
    const id = Date.now().toString()
    await sql`INSERT INTO subjects (id, name, color, total_time) VALUES (${id}, ${name}, ${availableColor}, 0)`
    return { id, name, color: availableColor, total_time: 0 }
  }
  const db = await getSqlite()
  const existingSubjects = db.prepare('SELECT color FROM subjects').all() as { color: string }[]
  const usedColors = existingSubjects.map((s) => s.color)
  const availableColor =
    SUBJECT_COLORS.find((c) => !usedColors.includes(c)) ||
    SUBJECT_COLORS[existingSubjects.length % SUBJECT_COLORS.length]
  const id = Date.now().toString()
  db.prepare('INSERT INTO subjects (id, name, color, total_time) VALUES (?, ?, ?, ?)').run(
    id,
    name,
    availableColor,
    0,
  )
  return { id, name, color: availableColor, total_time: 0 }
}

export async function repoDeleteSubject(id: string): Promise<void> {
  if (hasPostgres()) {
    await ensurePgSchema()
    const sql = getNeonSql()
    await sql`DELETE FROM subjects WHERE id = ${id}`
    return
  }
  const db = await getSqlite()
  db.prepare('DELETE FROM subjects WHERE id = ?').run(id)
}

export async function repoListSessions(): Promise<DbSession[]> {
  if (hasPostgres()) {
    await ensurePgSchema()
    const sql = getNeonSql()
    const rows = await sql`SELECT * FROM sessions ORDER BY date DESC, start_time DESC`
    return rows as DbSession[]
  }
  const db = await getSqlite()
  return db.prepare('SELECT * FROM sessions ORDER BY date DESC, start_time DESC').all() as DbSession[]
}

export async function repoCreateSession(
  subjectId: string,
  duration: number,
): Promise<{
  id: string
  subjectId: string
  subjectName: string
  date: string
  startTime: string
  duration: number
} | null> {
  const now = new Date()
  const id = Date.now().toString()
  const date = now.toLocaleDateString('pt-BR')
  const startTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const iso = now.toISOString()
  const tempoMin = durationSecondsToStatMinutes(duration)

  if (hasPostgres()) {
    await ensurePgSchema()
    const sql = getNeonSql()
    const subj = await sql`SELECT * FROM subjects WHERE id = ${subjectId} LIMIT 1`
    const subject = subj[0] as DbSubject | undefined
    if (!subject) return null
    await sql`INSERT INTO sessions (id, subject_id, subject_name, date, start_time, duration) VALUES (${id}, ${subjectId}, ${subject.name}, ${date}, ${startTime}, ${duration})`
    await sql`INSERT INTO estudos (materia, tempo_min, data) VALUES (${subject.name}, ${tempoMin}, ${iso})`
    await sql`UPDATE subjects SET total_time = total_time + ${duration} WHERE id = ${subjectId}`
    return {
      id,
      subjectId,
      subjectName: subject.name,
      date,
      startTime,
      duration,
    }
  }

  const db = await getSqlite()
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId) as DbSubject | undefined
  if (!subject) return null
  db.prepare(
    'INSERT INTO sessions (id, subject_id, subject_name, date, start_time, duration) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, subjectId, subject.name, date, startTime, duration)
  db.prepare('INSERT INTO estudos (materia, tempo_min, data) VALUES (?, ?, ?)').run(subject.name, tempoMin, iso)
  db.prepare('UPDATE subjects SET total_time = total_time + ? WHERE id = ?').run(duration, subjectId)
  return {
    id,
    subjectId,
    subjectName: subject.name,
    date,
    startTime,
    duration,
  }
}

export async function repoListNotes(): Promise<DbNote[]> {
  if (hasPostgres()) {
    await ensurePgSchema()
    const sql = getNeonSql()
    const rows = await sql`SELECT * FROM notes ORDER BY updated_at DESC`
    return rows as DbNote[]
  }
  const db = await getSqlite()
  return db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all() as DbNote[]
}

export async function repoInsertNote(
  subjectId: string,
  title: string,
  content: string,
): Promise<{
  id: string
  subjectId: string
  subjectName: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
} | null> {
  const now = new Date().toISOString()
  const id = Date.now().toString()

  if (hasPostgres()) {
    await ensurePgSchema()
    const sql = getNeonSql()
    const subj = await sql`SELECT * FROM subjects WHERE id = ${subjectId} LIMIT 1`
    const subject = subj[0] as DbSubject | undefined
    if (!subject) return null
    await sql`INSERT INTO notes (id, subject_id, subject_name, title, content, created_at, updated_at) VALUES (${id}, ${subjectId}, ${subject.name}, ${title}, ${content || ''}, ${now}, ${now})`
    return {
      id,
      subjectId,
      subjectName: subject.name,
      title,
      content: content || '',
      createdAt: now,
      updatedAt: now,
    }
  }

  const db = await getSqlite()
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId) as DbSubject | undefined
  if (!subject) return null
  db.prepare(
    'INSERT INTO notes (id, subject_id, subject_name, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, subjectId, subject.name, title, content || '', now, now)
  return {
    id,
    subjectId,
    subjectName: subject.name,
    title,
    content: content || '',
    createdAt: now,
    updatedAt: now,
  }
}

export async function repoUpdateNote(id: string, title: string, content: string): Promise<{ updatedAt: string } | null> {
  const now = new Date().toISOString()
  if (hasPostgres()) {
    await ensurePgSchema()
    const sql = getNeonSql()
    await sql`UPDATE notes SET title = ${title}, content = ${content || ''}, updated_at = ${now} WHERE id = ${id}`
    return { updatedAt: now }
  }
  const db = await getSqlite()
  db.prepare('UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?').run(
    title,
    content || '',
    now,
    id,
  )
  return { updatedAt: now }
}

export async function repoDeleteNote(id: string): Promise<void> {
  if (hasPostgres()) {
    await ensurePgSchema()
    const sql = getNeonSql()
    await sql`DELETE FROM notes WHERE id = ${id}`
    return
  }
  const db = await getSqlite()
  db.prepare('DELETE FROM notes WHERE id = ?').run(id)
}

export async function repoGetStats(
  start: string,
  end: string,
): Promise<{ items: { materia: string; tempo: number; porcentagem: number }[]; totalMinutos: number }> {
  if (hasPostgres()) {
    await ensurePgSchema()
    const sql = getNeonSql()
    const rows = await sql`
      SELECT materia, SUM(tempo_min)::int AS total
      FROM estudos
      WHERE data >= ${start} AND data <= ${end}
      GROUP BY materia
      HAVING SUM(tempo_min) > 0
      ORDER BY total DESC
    `
    return statsFromAggregateRows(
      (rows as { materia: string; total: number }[]).map((r) => ({
        materia: r.materia,
        total: Number(r.total),
      })),
    )
  }
  const db = await getSqlite()
  return getEstudosStatsForPeriod(db, start, end)
}
