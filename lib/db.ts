import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

/**
 * Na Vercel (serverless), só `/tmp` é gravável. Em disco local usamos `./data`.
 */
function getDataDir(): string {
  if (process.env.VERCEL === '1') {
    return path.join('/tmp', 'estudos-da-gigi')
  }
  return path.join(process.cwd(), 'data')
}

const dataDir = getDataDir()
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
} catch (err) {
  console.error('[db] Falha ao criar pasta de dados:', dataDir, err)
  throw err
}

const dbPath = path.join(dataDir, 'estudos.db')
const db = new Database(dbPath)

// Na Vercel, WAL gera ficheiros extra; DELETE evita problemas em FS efémero
if (process.env.VERCEL === '1') {
  db.pragma('journal_mode = DELETE')
} else {
  db.pragma('journal_mode = WAL')
}
db.pragma('foreign_keys = ON')

// Cria as tabelas se nao existirem
db.exec(`
  CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    total_time INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS estudos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    materia TEXT NOT NULL,
    tempo_min INTEGER NOT NULL,
    data TEXT NOT NULL
  );
`)

db.exec(`CREATE INDEX IF NOT EXISTS idx_data ON estudos(data);`)

// Insere materias padrao se a tabela estiver vazia
const subjectCount = db.prepare('SELECT COUNT(*) as count FROM subjects').get() as { count: number }
if (subjectCount.count === 0) {
  const insertSubject = db.prepare('INSERT INTO subjects (id, name, color, total_time) VALUES (?, ?, ?, ?)')
  insertSubject.run('1', 'Matematica', '#F48FB1', 0)
  insertSubject.run('2', 'Portugues', '#CE93D8', 0)
  insertSubject.run('3', 'Historia', '#80DEEA', 0)
}

/** Converte data pt-BR (dd/mm/aaaa) + hora opcional em ISO UTC para filtros SQL. */
export function sessionBrDateToIso(dateStr: string, startTime?: string): string {
  const m = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) {
    return new Date().toISOString()
  }
  const d = parseInt(m[1], 10)
  const mo = parseInt(m[2], 10) - 1
  const y = parseInt(m[3], 10)
  let hours = 12
  let minutes = 0
  if (startTime) {
    const tm = startTime.match(/(\d{1,2}):(\d{2})/)
    if (tm) {
      hours = parseInt(tm[1], 10)
      minutes = parseInt(tm[2], 10)
    }
  }
  return new Date(y, mo, d, hours, minutes, 0, 0).toISOString()
}

function backfillEstudosFromSessionsIfEmpty() {
  const estudosCount = (db.prepare('SELECT COUNT(*) as c FROM estudos').get() as { c: number }).c
  if (estudosCount > 0) return

  const sessions = db.prepare('SELECT * FROM sessions').all() as Array<{
    subject_name: string
    date: string
    start_time: string
    duration: number
  }>

  const insert = db.prepare(
    'INSERT INTO estudos (materia, tempo_min, data) VALUES (?, ?, ?)',
  )

  const insertMany = db.transaction(() => {
    for (const s of sessions) {
      const tempoMin = Math.max(0, Math.round(s.duration / 60))
      const iso = sessionBrDateToIso(s.date, s.start_time)
      insert.run(s.subject_name, tempoMin, iso)
    }
  })

  insertMany()
}

backfillEstudosFromSessionsIfEmpty()

export default db

// Helper types
export interface DbSubject {
  id: string
  name: string
  color: string
  total_time: number
}

export interface DbSession {
  id: string
  subject_id: string
  subject_name: string
  date: string
  start_time: string
  duration: number
}

export interface DbNote {
  id: string
  subject_id: string
  subject_name: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface DbEstudo {
  id: number
  materia: string
  tempo_min: number
  data: string
}
