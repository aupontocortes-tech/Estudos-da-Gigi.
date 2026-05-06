'use client'

import type { MateriaStatRow } from '@/lib/materia-stats'
import { statsFromAggregateRows } from '@/lib/materia-stats'
import type { Note, StudyData, StudySession, Subject } from '@/lib/types'
import { SUBJECT_COLORS } from '@/lib/types'
import { durationSecondsToStatMinutes, sessionBrDateToIso } from '@/lib/session-date'

const IDB_NAME = 'estudos-da-gigi-sqlite-v1'
const IDB_STORE = 'file'
const IDB_KEY = 'estudos.db'

type SqlJsDatabase = import('sql.js').Database

let dbInstance: SqlJsDatabase | null = null
let initPromise: Promise<SqlJsDatabase> | null = null

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onerror = () => reject(req.error)
    req.onupgradeneeded = () => {
      const idb = req.result
      if (!idb.objectStoreNames.contains(IDB_STORE)) idb.createObjectStore(IDB_STORE)
    }
    req.onsuccess = () => resolve(req.result)
  })
}

async function idbGet(): Promise<Uint8Array | null> {
  const idb = await openIdb()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readonly')
    const get = tx.objectStore(IDB_STORE).get(IDB_KEY)
    get.onerror = () => reject(get.error)
    get.onsuccess = () => resolve((get.result as Uint8Array | undefined) ?? null)
  })
}

async function idbSet(data: Uint8Array): Promise<void> {
  const idb = await openIdb()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite')
    tx.onerror = () => reject(tx.error)
    tx.oncomplete = () => resolve()
    tx.objectStore(IDB_STORE).put(data, IDB_KEY)
  })
}

export function persistBrowserDb(db: SqlJsDatabase) {
  try {
    void idbSet(db.export())
  } catch (e) {
    console.error('[browser-sqlite] Falha ao gravar no IndexedDB:', e)
  }
}

async function initSqlModule() {
  const initSqlJs = (await import('sql.js')).default
  return initSqlJs({
    locateFile: (file) => `/${file}`,
  })
}

const SCHEMA = `
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
CREATE INDEX IF NOT EXISTS idx_data ON estudos(data);
`

function runSchema(db: SqlJsDatabase) {
  db.run('PRAGMA foreign_keys = ON')
  db.exec(SCHEMA)
}

function subjectCount(db: SqlJsDatabase): number {
  const r = db.exec('SELECT COUNT(*) AS c FROM subjects')
  if (!r.length || !r[0].values.length) return 0
  return Number(r[0].values[0][0])
}

function estudosCount(db: SqlJsDatabase): number {
  const r = db.exec('SELECT COUNT(*) AS c FROM estudos')
  if (!r.length || !r[0].values.length) return 0
  return Number(r[0].values[0][0])
}

function seedDefaults(db: SqlJsDatabase) {
  const ins =
    'INSERT INTO subjects (id, name, color, total_time) VALUES (?, ?, ?, ?)'
  db.run(ins, ['1', 'Matematica', '#F48FB1', 0])
  db.run(ins, ['2', 'Portugues', '#CE93D8', 0])
  db.run(ins, ['3', 'Historia', '#80DEEA', 0])
}

function backfillEstudosFromSessions(db: SqlJsDatabase) {
  if (estudosCount(db) > 0) return
  const sel = db.prepare(
    'SELECT subject_name, date, start_time, duration FROM sessions',
  )
  while (sel.step()) {
    const o = sel.getAsObject() as {
      subject_name: string
      date: string
      start_time: string
      duration: number
    }
    const tempoMin = durationSecondsToStatMinutes(Number(o.duration))
    const iso = sessionBrDateToIso(o.date, o.start_time)
    db.run('INSERT INTO estudos (materia, tempo_min, data) VALUES (?, ?, ?)', [
      o.subject_name,
      tempoMin,
      iso,
    ])
  }
  sel.free()
}

async function tryBootstrapFromServer(db: SqlJsDatabase) {
  try {
    const [subjectsRes, sessionsRes, notesRes] = await Promise.all([
      fetch('/api/subjects'),
      fetch('/api/sessions'),
      fetch('/api/notes'),
    ])
    if (!subjectsRes.ok) return
    const subjects = (await subjectsRes.json()) as Subject[]
    const sessions = sessionsRes.ok ? ((await sessionsRes.json()) as StudySession[]) : []
    const notes = notesRes.ok ? ((await notesRes.json()) as Note[]) : []
    if (!Array.isArray(subjects) || subjects.length === 0) return

    db.run('BEGIN')
    try {
      for (const s of subjects) {
        db.run(
          'INSERT OR REPLACE INTO subjects (id, name, color, total_time) VALUES (?, ?, ?, ?)',
          [s.id, s.name, s.color, s.totalTime],
        )
      }
      for (const x of sessions) {
        db.run(
          `INSERT OR REPLACE INTO sessions (id, subject_id, subject_name, date, start_time, duration) VALUES (?, ?, ?, ?, ?, ?)`,
          [x.id, x.subjectId, x.subjectName, x.date, x.startTime, x.duration],
        )
      }
      for (const n of notes) {
        db.run(
          `INSERT OR REPLACE INTO notes (id, subject_id, subject_name, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            n.id,
            n.subjectId,
            n.subjectName,
            n.title,
            n.content,
            n.createdAt,
            n.updatedAt,
          ],
        )
      }
      db.run('COMMIT')
    } catch {
      db.run('ROLLBACK')
    }
    backfillEstudosFromSessions(db)
  } catch {
    /* sem rede ou API vazia */
  }
}

export async function getBrowserDb(): Promise<SqlJsDatabase> {
  if (typeof window === 'undefined') {
    throw new Error('SQLite do navegador só está disponível no cliente')
  }
  if (dbInstance) return dbInstance
  if (!initPromise) {
    initPromise = (async () => {
      const SQL = await initSqlModule()
      const existing = await idbGet()
      const db =
        existing && existing.byteLength > 0 ? new SQL.Database(existing) : new SQL.Database()
      runSchema(db)

      if (subjectCount(db) === 0) {
        if (!existing || existing.byteLength === 0) {
          await tryBootstrapFromServer(db)
        }
        if (subjectCount(db) === 0) seedDefaults(db)
      }

      backfillEstudosFromSessions(db)
      dbInstance = db
      persistBrowserDb(db)
      return db
    })().catch((e) => {
      initPromise = null
      throw e
    })
  }
  return initPromise
}

function rowToSubject(o: Record<string, unknown>): Subject {
  return {
    id: String(o.id),
    name: String(o.name),
    color: String(o.color),
    totalTime: Number(o.total_time),
  }
}

function rowToSession(o: Record<string, unknown>): StudySession {
  return {
    id: String(o.id),
    subjectId: String(o.subject_id),
    subjectName: String(o.subject_name),
    date: String(o.date),
    startTime: String(o.start_time),
    duration: Number(o.duration),
  }
}

function rowToNote(o: Record<string, unknown>): Note {
  return {
    id: String(o.id),
    subjectId: String(o.subject_id),
    subjectName: String(o.subject_name),
    title: String(o.title),
    content: String(o.content ?? ''),
    createdAt: String(o.created_at),
    updatedAt: String(o.updated_at),
  }
}

function execObjects(db: SqlJsDatabase, sql: string): Record<string, unknown>[] {
  const res = db.exec(sql)
  if (!res.length) return []
  const { columns, values } = res[0]
  return values.map((v) => {
    const o: Record<string, unknown> = {}
    columns.forEach((c, i) => {
      o[c] = v[i]
    })
    return o
  })
}

export async function browserLoadStudyData(): Promise<StudyData> {
  const db = await getBrowserDb()
  const subjects = execObjects(db, 'SELECT * FROM subjects ORDER BY name').map(rowToSubject)
  const sessions = execObjects(
    db,
    'SELECT * FROM sessions ORDER BY date DESC, start_time DESC',
  ).map(rowToSession)
  const notes = execObjects(db, 'SELECT * FROM notes ORDER BY updated_at DESC').map(rowToNote)
  return { subjects, sessions, notes }
}

export async function browserGetStats(
  startIso: string,
  endIso: string,
): Promise<{ items: MateriaStatRow[]; totalMinutos: number }> {
  const db = await getBrowserDb()
  const stmt = db.prepare(`
    SELECT materia, SUM(tempo_min) AS total
    FROM estudos
    WHERE data >= ? AND data <= ?
    GROUP BY materia
    HAVING SUM(tempo_min) > 0
    ORDER BY total DESC
  `)
  stmt.bind([startIso, endIso])
  const rows: { materia: string; total: number }[] = []
  while (stmt.step()) {
    const o = stmt.getAsObject() as { materia: string; total: number | string }
    rows.push({ materia: o.materia, total: Number(o.total) })
  }
  stmt.free()
  return statsFromAggregateRows(rows)
}

export async function browserAddSubject(name: string): Promise<Subject | null> {
  const db = await getBrowserDb()
  const used = execObjects(db, 'SELECT color FROM subjects').map(
    (r) => String(r.color),
  )
  const color =
    SUBJECT_COLORS.find((c) => !used.includes(c)) ||
    SUBJECT_COLORS[used.length % SUBJECT_COLORS.length]
  const id = Date.now().toString()
  db.run('INSERT INTO subjects (id, name, color, total_time) VALUES (?, ?, ?, ?)', [
    id,
    name,
    color,
    0,
  ])
  persistBrowserDb(db)
  return { id, name, color, totalTime: 0 }
}

export async function browserDeleteSubject(id: string): Promise<void> {
  const db = await getBrowserDb()
  db.run('DELETE FROM subjects WHERE id = ?', [id])
  persistBrowserDb(db)
}

export async function browserAddSession(
  subjectId: string,
  duration: number,
): Promise<StudySession | null> {
  const db = await getBrowserDb()
  const subStmt = db.prepare('SELECT * FROM subjects WHERE id = ?')
  subStmt.bind([subjectId])
  if (!subStmt.step()) {
    subStmt.free()
    return null
  }
  const subject = subStmt.getAsObject() as Record<string, unknown>
  subStmt.free()

  const now = new Date()
  const id = Date.now().toString()
  const date = now.toLocaleDateString('pt-BR')
  const startTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const iso = now.toISOString()
  const tempoMin = durationSecondsToStatMinutes(duration)
  const subjectName = String(subject.name)

  db.run(
    'INSERT INTO sessions (id, subject_id, subject_name, date, start_time, duration) VALUES (?, ?, ?, ?, ?, ?)',
    [id, subjectId, subjectName, date, startTime, duration],
  )
  db.run('INSERT INTO estudos (materia, tempo_min, data) VALUES (?, ?, ?)', [
    subjectName,
    tempoMin,
    iso,
  ])
  db.run('UPDATE subjects SET total_time = total_time + ? WHERE id = ?', [duration, subjectId])
  persistBrowserDb(db)

  return {
    id,
    subjectId,
    subjectName,
    date,
    startTime,
    duration,
  }
}

export async function browserAddNote(
  subjectId: string,
  title: string,
  content: string,
): Promise<Note | null> {
  const db = await getBrowserDb()
  const subStmt = db.prepare('SELECT * FROM subjects WHERE id = ?')
  subStmt.bind([subjectId])
  if (!subStmt.step()) {
    subStmt.free()
    return null
  }
  const subject = subStmt.getAsObject() as Record<string, unknown>
  subStmt.free()

  const now = new Date().toISOString()
  const id = Date.now().toString()
  const subjectName = String(subject.name)

  db.run(
    'INSERT INTO notes (id, subject_id, subject_name, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, subjectId, subjectName, title, content || '', now, now],
  )
  persistBrowserDb(db)

  return {
    id,
    subjectId,
    subjectName,
    title,
    content: content || '',
    createdAt: now,
    updatedAt: now,
  }
}

export async function browserUpdateNote(
  id: string,
  title: string,
  content: string,
): Promise<{ updatedAt: string }> {
  const db = await getBrowserDb()
  const now = new Date().toISOString()
  db.run('UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?', [
    title,
    content || '',
    now,
    id,
  ])
  persistBrowserDb(db)
  return { updatedAt: now }
}

export async function browserDeleteNote(id: string): Promise<void> {
  const db = await getBrowserDb()
  db.run('DELETE FROM notes WHERE id = ?', [id])
  persistBrowserDb(db)
}
