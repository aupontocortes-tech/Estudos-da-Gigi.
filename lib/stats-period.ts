export type PeriodPreset = 'today' | '7d' | '30d' | '3m' | '1y' | 'custom'

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

/** Intervalo inclusivo [startIso, endIso] em ISO 8601, usando fuso local do cliente. */
export function getPeriodRange(
  preset: PeriodPreset,
  customStart?: string,
  customEnd?: string,
): { startIso: string; endIso: string } {
  const now = new Date()

  if (preset === 'custom') {
    if (!customStart || !customEnd) {
      const s = startOfDay(now)
      const e = endOfDay(now)
      return { startIso: s.toISOString(), endIso: e.toISOString() }
    }
    const [ys, ms, ds] = customStart.split('-').map(Number)
    const [ye, me, de] = customEnd.split('-').map(Number)
    const start = startOfDay(new Date(ys, ms - 1, ds))
    const end = endOfDay(new Date(ye, me - 1, de))
    if (start > end) {
      return { startIso: end.toISOString(), endIso: start.toISOString() }
    }
    return { startIso: start.toISOString(), endIso: end.toISOString() }
  }

  const end = endOfDay(now)

  if (preset === 'today') {
    const start = startOfDay(now)
    return { startIso: start.toISOString(), endIso: end.toISOString() }
  }

  if (preset === '7d') {
    const start = startOfDay(now)
    start.setDate(start.getDate() - 6)
    return { startIso: start.toISOString(), endIso: end.toISOString() }
  }

  if (preset === '30d') {
    const start = startOfDay(now)
    start.setDate(start.getDate() - 29)
    return { startIso: start.toISOString(), endIso: end.toISOString() }
  }

  if (preset === '3m') {
    const start = startOfDay(now)
    start.setMonth(start.getMonth() - 3)
    return { startIso: start.toISOString(), endIso: end.toISOString() }
  }

  if (preset === '1y') {
    const start = startOfDay(now)
    start.setFullYear(start.getFullYear() - 1)
    return { startIso: start.toISOString(), endIso: end.toISOString() }
  }

  const start = startOfDay(now)
  return { startIso: start.toISOString(), endIso: end.toISOString() }
}
