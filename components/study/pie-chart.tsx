"use client"

import { useCallback, useEffect, useId, useState } from 'react'
import type { Subject } from '@/lib/types'
import { SUBJECT_COLORS } from '@/lib/types'
import { getPeriodRange, type PeriodPreset } from '@/lib/stats-period'
import type { MateriaStatRow } from '@/lib/materia-stats'
import { browserGetStats } from '@/lib/browser-sqlite'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PieChartProps {
  subjects: Subject[]
  /** Incrementa quando novas sessões são salvas para recarregar estatísticas. */
  statsRefreshKey?: number
}

function formatMinutes(totalMin: number): string {
  if (totalMin <= 0) return '0 min'
  const hours = Math.floor(totalMin / 60)
  const minutes = totalMin % 60
  if (hours > 0) {
    return `${hours}h ${minutes}min`
  }
  return `${minutes}min`
}

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function colorForMateria(materia: string, subjectList: Subject[]): string {
  const sub = subjectList.find((s) => s.name === materia)
  if (sub) return sub.color
  let h = 0
  for (let i = 0; i < materia.length; i++) {
    h = materia.charCodeAt(i) + ((h << 5) - h)
  }
  return SUBJECT_COLORS[Math.abs(h) % SUBJECT_COLORS.length]
}

const PRESET_LABELS: { value: PeriodPreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '1y', label: 'Último ano' },
  { value: 'custom', label: 'Intervalo personalizado' },
]

export function PieChart({ subjects, statsRefreshKey = 0 }: PieChartProps) {
  const glowId = useId().replace(/:/g, '')
  const [preset, setPreset] = useState<PeriodPreset>('30d')
  const [customStart, setCustomStart] = useState(() => toYMD(new Date()))
  const [customEnd, setCustomEnd] = useState(() => toYMD(new Date()))
  const [items, setItems] = useState<MateriaStatRow[]>([])
  const [totalMinutos, setTotalMinutos] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    const { startIso, endIso } = getPeriodRange(preset, customStart, customEnd)
    setLoading(true)
    try {
      const { items: rows, totalMinutos: total } = await browserGetStats(startIso, endIso)
      setItems(rows ?? [])
      setTotalMinutos(typeof total === 'number' ? total : 0)
    } catch (e) {
      console.error(e)
      setItems([])
      setTotalMinutos(0)
    } finally {
      setLoading(false)
    }
  }, [preset, customStart, customEnd])

  useEffect(() => {
    loadStats()
  }, [loadStats, statsRefreshKey])

  const sortedItems = [...items].sort((a, b) => b.tempo - a.tempo)

  const slices: {
    materia: string
    color: string
    percentage: number
    startAngle: number
    endAngle: number
  }[] = []

  if (totalMinutos > 0) {
    let currentAngle = -90
    sortedItems.forEach((row) => {
      const pct = (row.tempo / totalMinutos) * 100
      const angle = (row.tempo / totalMinutos) * 360
      slices.push({
        materia: row.materia,
        color: colorForMateria(row.materia, subjects),
        percentage: pct,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
      })
      currentAngle += angle
    })
  }

  const getArcPath = (startAngle: number, endAngle: number, radius: number, innerRadius: number) => {
    const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
      const rad = (angle * Math.PI) / 180
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
      }
    }
    const start = polarToCartesian(150, 150, radius, endAngle)
    const end = polarToCartesian(150, 150, radius, startAngle)
    const innerStart = polarToCartesian(150, 150, innerRadius, endAngle)
    const innerEnd = polarToCartesian(150, 150, innerRadius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

    return [
      'M',
      start.x,
      start.y,
      'A',
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      'L',
      innerEnd.x,
      innerEnd.y,
      'A',
      innerRadius,
      innerRadius,
      0,
      largeArcFlag,
      1,
      innerStart.x,
      innerStart.y,
      'Z',
    ].join(' ')
  }

  const labelRadius = (115 + 65) / 2

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 p-4">
      <div className="w-full max-w-sm space-y-3 md:max-w-2xl">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-medium">Período</Label>
          <Select
            value={preset}
            onValueChange={(v) => {
              setPreset(v as PeriodPreset)
              if (v === 'custom') {
                const t = toYMD(new Date())
                setCustomStart(t)
                setCustomEnd(t)
              }
            }}
          >
            <SelectTrigger className="w-full rounded-2xl border-border bg-card card-shadow">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESET_LABELS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {preset === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Início</Label>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-xl text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Fim</Label>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-xl text-xs h-9"
              />
            </div>
          </div>
        )}
      </div>

      <div className="relative min-h-[280px] flex items-center justify-center">
        {loading ? (
          <div className="w-32 h-32 rounded-full border-4 border-primary border-t-transparent animate-spin opacity-60" />
        ) : (
          <svg width="280" height="280" viewBox="0 0 300 300" className="drop-shadow-lg">
            <defs>
              <filter id={`pieGlow-${glowId}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {totalMinutos > 0 ? (
              slices.map((slice) => (
                <path
                  key={slice.materia}
                  d={getArcPath(slice.startAngle, slice.endAngle, 115, 65)}
                  fill={slice.color}
                  className="transition-all duration-300 hover:opacity-80"
                  filter={`url(#pieGlow-${glowId})`}
                >
                  <title>{`${slice.materia}: ${slice.percentage.toFixed(1)}%`}</title>
                </path>
              ))
            ) : (
              <path
                d={getArcPath(-90, 270, 115, 65)}
                className="fill-muted/30"
              />
            )}
            {totalMinutos > 0 &&
              slices.map((slice) => {
                const span = slice.endAngle - slice.startAngle
                const mid = (slice.startAngle + slice.endAngle) / 2
                const { x, y } = polarToCartesian(150, 150, labelRadius, mid)
                const fontSize =
                  span < 18 ? 8 : span < 30 ? 9 : span < 55 ? 10 : span < 100 ? 11 : 12
                return (
                  <text
                    key={`pct-${slice.materia}-${slice.startAngle}`}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    stroke="rgba(0,0,0,0.22)"
                    strokeWidth={0.6}
                    paintOrder="stroke fill"
                    className="pointer-events-none font-bold select-none"
                    style={{ fontSize, fontFamily: 'var(--font-mono)' }}
                  >
                    {`${slice.percentage.toFixed(1)}%`}
                  </text>
                )
              })}
            <circle cx="150" cy="150" r="55" fill="white" />
            <text
              x="150"
              y="145"
              textAnchor="middle"
              className="fill-foreground text-lg font-bold"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {formatMinutes(totalMinutos)}
            </text>
            <text
              x="150"
              y="168"
              textAnchor="middle"
              className="fill-muted-foreground text-xs font-medium"
            >
              total ✿
            </text>
          </svg>
        )}
      </div>

      <div className="w-full max-w-sm space-y-2.5 md:max-w-2xl">
        {!loading && sortedItems.length === 0 && (
          <p className="text-center text-sm text-muted-foreground font-medium px-2">
            Nenhum estudo neste período
          </p>
        )}
        {sortedItems.map((row, index) => {
          const pct = totalMinutos > 0 ? (row.tempo / totalMinutos) * 100 : 0
          const color = colorForMateria(row.materia, subjects)
          return (
            <div
              key={row.materia}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-card card-shadow border border-border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex shrink-0 items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {index + 1}
                </div>
                <span className="font-semibold text-foreground truncate">{row.materia}</span>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold" style={{ color }}>
                  {pct.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {formatMinutes(row.tempo)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
