/** Agregação de estatísticas por matéria (cliente e servidor, sem better-sqlite3). */

export interface MateriaStatRow {
  materia: string
  tempo: number
  porcentagem: number
}

export interface AggregatedRow {
  materia: string
  total: number
}

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
