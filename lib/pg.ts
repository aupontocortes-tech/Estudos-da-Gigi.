import { neon } from '@neondatabase/serverless'
import { sessionBrDateToIso, durationSecondsToStatMinutes } from '@/lib/session-date'

let sqlInstance: ReturnType<typeof neon> | null = null
let schemaPromise: Promise<void> | null = null

export function getNeonSql() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) throw new Error('DATABASE_URL não definido')
  if (!sqlInstance) sqlInstance = neon(url)
  return sqlInstance
}

export function hasPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}

export async function ensurePgSchema(): Promise<void> {
  if (schemaPromise) return schemaPromise
  const sql = getNeonSql()
  schemaPromise = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        total_time INTEGER DEFAULT 0
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        subject_name TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        duration INTEGER NOT NULL
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        subject_name TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS estudos (
        id BIGSERIAL PRIMARY KEY,
        materia TEXT NOT NULL,
        tempo_min INTEGER NOT NULL,
        data TEXT NOT NULL
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_estudos_data ON estudos(data)`

    const subj = await sql`SELECT COUNT(*)::int AS c FROM subjects`
    const sc = Number((subj[0] as { c: number }).c)
    if (sc === 0) {
      await sql`INSERT INTO subjects (id, name, color, total_time) VALUES ('1', 'Matematica', '#F48FB1', 0)`
      await sql`INSERT INTO subjects (id, name, color, total_time) VALUES ('2', 'Portugues', '#CE93D8', 0)`
      await sql`INSERT INTO subjects (id, name, color, total_time) VALUES ('3', 'Historia', '#80DEEA', 0)`
    }

    const est = await sql`SELECT COUNT(*)::int AS c FROM estudos`
    if (Number((est[0] as { c: number }).c) === 0) {
      const sessions = await sql`
        SELECT subject_name, date, start_time, duration FROM sessions
      `
      for (const row of sessions as Array<{
        subject_name: string
        date: string
        start_time: string
        duration: number
      }>) {
        const tempoMin = durationSecondsToStatMinutes(row.duration)
        const iso = sessionBrDateToIso(row.date, row.start_time)
        await sql`INSERT INTO estudos (materia, tempo_min, data) VALUES (${row.subject_name}, ${tempoMin}, ${iso})`
      }
    }
  })().catch((e) => {
    schemaPromise = null
    throw e
  })
  return schemaPromise
}
