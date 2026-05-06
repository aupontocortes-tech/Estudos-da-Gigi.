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

/** Duração em segundos → minutos para agregação (nunca 0 se houve estudo). */
export function durationSecondsToStatMinutes(durationSec: number): number {
  if (durationSec <= 0) return 0
  return Math.max(1, Math.ceil(durationSec / 60))
}
