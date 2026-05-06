/**
 * Tipos e SQLite local. Em produção na Vercel, defina DATABASE_URL (Postgres Neon)
 * para dados persistentes — ver `lib/repository.ts`.
 */
export type { DbSubject, DbSession, DbNote, DbEstudo } from './db-types'
export { sessionBrDateToIso } from './session-date'
export { default } from './sqlite'
