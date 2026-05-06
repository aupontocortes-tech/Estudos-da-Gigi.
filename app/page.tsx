"use client"

import { useState, useEffect } from 'react'
import { Timer as TimerIcon, PieChart as ChartIcon, History as HistoryIcon, StickyNote, BookOpen } from 'lucide-react'
import { useStudyData } from '@/hooks/use-study-data'
import { Timer } from '@/components/study/timer'
import { PieChart } from '@/components/study/pie-chart'
import { History } from '@/components/study/history'
import { Notes } from '@/components/study/notes'
import { Subjects } from '@/components/study/subjects'
import { InstallHintBanner } from '@/components/study/install-hint-banner'
import { cn } from '@/lib/utils'

type Tab = 'timer' | 'stats' | 'history' | 'notes' | 'subjects'

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'timer', label: 'Timer', icon: TimerIcon },
  { id: 'stats', label: 'Estatisticas', icon: ChartIcon },
  { id: 'history', label: 'Historico', icon: HistoryIcon },
  { id: 'notes', label: 'Notas', icon: StickyNote },
  { id: 'subjects', label: 'Materias', icon: BookOpen },
]

export default function StudyApp() {
  const [activeTab, setActiveTab] = useState<Tab>('timer')
  const [activeSubjectId, setActiveSubjectId] = useState<string>('')
  const [deployCommit, setDeployCommit] = useState<string | null>(null)
  const {
    data,
    isLoaded,
    isLoading,
    addSubject,
    deleteSubject,
    addSession,
    addNote,
    updateNote,
    deleteNote,
  } = useStudyData()

  useEffect(() => {
    fetch('/api/version')
      .then((r) => r.json())
      .then((body: { sha?: string | null }) => setDeployCommit(body.sha ?? null))
      .catch(() => setDeployCommit(null))
  }, [])

  useEffect(() => {
    if (data.subjects.length > 0 && !activeSubjectId) {
      setActiveSubjectId(data.subjects[0].id)
    }
  }, [data.subjects, activeSubjectId])

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-primary font-semibold animate-pulse">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 sm:px-6 md:max-w-3xl lg:max-w-5xl xl:max-w-6xl">
        {/* Header */}
        <header className="p-5 pb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-wide">
              Estudos da Gigi
            </h1>
            <span className="text-lg">✿</span>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Bons estudos! ✦</p>
        </header>

        <InstallHintBanner />

        {/* Tab Navigation */}
        <nav className="sticky top-0 z-10 bg-background border-b border-border mx-4 rounded-2xl card-shadow mb-2">
          <div className="flex overflow-x-auto scrollbar-hide p-1">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 min-w-[68px] flex flex-col items-center gap-1 py-2.5 px-2 transition-all duration-200 rounded-xl',
                    isActive 
                      ? 'bg-primary/15 text-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      isActive ? "bg-primary text-white" : "bg-secondary"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold",
                    isActive && "text-primary"
                  )}>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="animate-in fade-in duration-300">
            {activeTab === 'timer' && (
              <Timer 
                subjects={data.subjects} 
                onSessionComplete={async (subjectId, duration) => {
                  await addSession(subjectId, duration)
                  setActiveSubjectId(subjectId)
                }}
              />
            )}
            
            {activeTab === 'stats' && (
              <PieChart subjects={data.subjects} statsRefreshKey={data.sessions.length} />
            )}
            
            {activeTab === 'history' && (
              <History sessions={data.sessions} subjects={data.subjects} />
            )}
            
            {activeTab === 'notes' && (
              <Notes
                notes={data.notes}
                subjects={data.subjects}
                activeSubjectId={activeSubjectId}
                onAdd={addNote}
                onUpdate={updateNote}
                onDelete={deleteNote}
              />
            )}
            
            {activeTab === 'subjects' && (
              <Subjects
                subjects={data.subjects}
                onAdd={addSubject}
                onDelete={deleteSubject}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="p-4 text-center space-y-1">
          <p className="text-xs text-muted-foreground font-medium">
            ✿ {data.subjects.length} materias • {data.sessions.length} sessoes ✿
          </p>
          {deployCommit && (
            <p className="text-[10px] text-muted-foreground/70 font-mono" title="Commit deployado (Vercel)">
              deploy: {deployCommit}
            </p>
          )}
        </footer>
      </div>
    </main>
  )
}
