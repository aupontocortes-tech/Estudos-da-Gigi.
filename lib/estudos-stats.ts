import type Database from 'better-sqlite3'
import type { AggregatedRow, MateriaStatRow } from '@/lib/materia-stats'
import { statsFromAggregateRows } from '@/lib/materia-stats'

export type { MateriaStatRow, AggregatedRow } from '@/lib/materia-stats'

/**
 * Agrega tempo por matéria no intervalo [dataInicio, dataFim] (inclusivo, ISO 8601).
 */
export function queryEstudosByPeriod(
  db: Database.Database,
  dataInicio: string,
  dataFim: string,
): AggregatedRow[] {
  const stmt = db.prepare(`
    SELECT materia, SUM(tempo_min) AS total
    FROM estudos
    WHERE data >= ? AND data <= ?
    GROUP BY materia
    HAVING SUM(tempo_min) > 0
    ORDER BY total DESC
  `)
  return stmt.all(dataInicio, dataFim) as AggregatedRow[]
}

export function getEstudosStatsForPeriod(
  db: Database.Database,
  dataInicio: string,
  dataFim: string,
): { items: MateriaStatRow[]; totalMinutos: number } {
  const rows = queryEstudosByPeriod(db, dataInicio, dataFim)
  return statsFromAggregateRows(rows)
}
