import type Database from 'better-sqlite3'

export interface MateriaStatRow {
  materia: string
  tempo: number
  porcentagem: number
}

export interface AggregatedRow {
  materia: string
  total: number
}

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

/**
 * Converte linhas agregadas em saída com porcentagens (total em minutos).
 */
export function processMateriaStats(rows: AggregatedRow[]): MateriaStatRow[] {
  const totalGeral = rows.reduce((acc, r) => acc + r.total, 0)
  if (totalGeral <= 0) {
    return []
  }
  return rows.map((r) => ({
    materia: r.materia,
    tempo: r.total,
    porcentagem: (r.total / totalGeral) * 100,
  }))
}

export function statsFromAggregateRows(rows: AggregatedRow[]): {
  items: MateriaStatRow[]
  totalMinutos: number
} {
  const normalized = rows.map((r) => ({
    materia: r.materia,
    total: Number(r.total),
  }))
  const totalMinutos = normalized.reduce((acc, r) => acc + r.total, 0)
  if (totalMinutos <= 0) {
    return { items: [], totalMinutos: 0 }
  }
  return {
    items: processMateriaStats(normalized),
    totalMinutos,
  }
}

export function getEstudosStatsForPeriod(
  db: Database.Database,
  dataInicio: string,
  dataFim: string,
): { items: MateriaStatRow[]; totalMinutos: number } {
  const rows = queryEstudosByPeriod(db, dataInicio, dataFim)
  return statsFromAggregateRows(rows)
}
