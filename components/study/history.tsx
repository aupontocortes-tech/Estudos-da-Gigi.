"use client"

import { Clock, Calendar } from 'lucide-react'
import type { StudySession, Subject } from '@/lib/types'

interface HistoryProps {
  sessions: StudySession[]
  subjects: Subject[]
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}min ${secs}s`
  }
  if (minutes > 0) {
    return `${minutes}min ${secs}s`
  }
  return `${secs}s`
}

export function History({ sessions, subjects }: HistoryProps) {
  const getSubjectColor = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.color || '#F48FB1'
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-card card-shadow flex items-center justify-center mb-4 border border-border">
          <Clock className="w-10 h-10 text-primary" />
        </div>
        <p className="text-foreground font-semibold">
          Nenhuma sessao registrada ainda
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Complete uma sessao de estudo para ve-la aqui!
        </p>
      </div>
    )
  }

  const groupedSessions = sessions.reduce((acc, session) => {
    if (!acc[session.date]) {
      acc[session.date] = []
    }
    acc[session.date].push(session)
    return acc
  }, {} as Record<string, StudySession[]>)

  return (
    <div className="p-4 space-y-5">
      {Object.entries(groupedSessions).map(([date, dateSessions]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">{date}</span>
          </div>
          
          <div className="space-y-2.5">
            {dateSessions.map(session => {
              const color = getSubjectColor(session.subjectId)
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-card card-shadow border border-border"
                  style={{ borderLeftColor: color, borderLeftWidth: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{session.subjectName}</p>
                      <p className="text-xs text-muted-foreground font-medium">
                        Iniciado as {session.startTime}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p 
                      className="font-bold"
                      style={{ color }}
                    >
                      {formatDuration(session.duration)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
