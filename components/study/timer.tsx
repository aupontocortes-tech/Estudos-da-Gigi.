"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Subject } from '@/lib/types'

interface TimerProps {
  subjects: Subject[]
  onSessionComplete: (subjectId: string, duration: number) => Promise<void> | void
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function formatTotalTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`
  }
  return `${minutes}min`
}

export function Timer({ subjects, onSessionComplete }: TimerProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '')
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id)
    }
  }, [subjects, selectedSubjectId])

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - time * 1000
      intervalRef.current = setInterval(() => {
        setTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const handleStart = useCallback(() => {
    if (!selectedSubjectId) return
    setShowSaved(false)
    setIsRunning(true)
  }, [selectedSubjectId])

  const handlePause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const handleSaveSession = useCallback(async () => {
    if (time === 0 || !selectedSubjectId || isSaving) return
    
    setIsSaving(true)
    try {
      await onSessionComplete(selectedSubjectId, time)
      setShowSaved(true)
      setTime(0)
      setTimeout(() => setShowSaved(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }, [time, selectedSubjectId, onSessionComplete, isSaving])

  const handleReset = useCallback(() => {
    setIsRunning(false)
    setTime(0)
    setShowSaved(false)
  }, [])

  const handleToggle = useCallback(() => {
    if (isRunning) {
      handlePause()
    } else {
      handleStart()
    }
  }, [isRunning, handleStart, handlePause])

  const radius = 130
  const circumference = 2 * Math.PI * radius
  const maxTime = 3600
  const progress = Math.min(time / maxTime, 1)
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="flex w-full flex-col items-center gap-5 p-4">
      {/* Subject selector */}
      <div className="w-full max-w-sm md:max-w-xl">
        <Select 
          value={selectedSubjectId} 
          onValueChange={setSelectedSubjectId}
          disabled={isRunning}
        >
          <SelectTrigger className="w-full! bg-card border-border rounded-2xl card-shadow">
            <SelectValue placeholder="Selecione uma materia" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {subjects.map(subject => (
              <SelectItem key={subject.id} value={subject.id} className="rounded-xl">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: subject.color }}
                  />
                  {subject.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timer display with ring */}
      <div className="relative">
        <svg width="300" height="300" className="transform -rotate-90">
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F48FB1" />
              <stop offset="100%" stopColor="#CE93D8" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* Background circle */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="#F8D7E8"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
            filter="url(#glow)"
          />
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-5xl font-bold text-foreground tracking-tight">
            {formatTime(time)}
          </span>
          {selectedSubject && (
            <span className="text-muted-foreground text-sm mt-2 font-medium">
              Total: {formatTotalTime(selectedSubject.totalTime)}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-5">
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          disabled={time === 0 && !isRunning}
          className="w-14 h-14 rounded-full border-border bg-secondary hover:bg-secondary/80"
        >
          <RotateCcw className="w-5 h-5 text-muted-foreground" />
        </Button>
        
        <Button
          onClick={handleToggle}
          disabled={!selectedSubjectId}
          className={`w-20 h-20 rounded-full text-lg font-semibold btn-gradient text-white ${!isRunning && selectedSubjectId ? 'animate-pulse-pink' : ''}`}
        >
          {isRunning ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleSaveSession}
          disabled={time === 0 || isRunning || isSaving}
          className={`w-14 h-14 rounded-full border-border transition-all ${
            time > 0 && !isRunning 
              ? 'bg-primary/20 border-primary text-primary hover:bg-primary/30' 
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Feedback de sessao salva */}
      {showSaved && (
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#80DEEA]/20 text-[#00897B] card-shadow animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4" />
          <span className="text-sm font-semibold">Sessao salva com sucesso!</span>
        </div>
      )}

      {/* Current subject indicator */}
      {selectedSubject && (
        <div 
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-card card-shadow border border-border"
        >
          <div 
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: selectedSubject.color }}
          />
          <span className="text-sm font-semibold text-foreground">{selectedSubject.name}</span>
        </div>
      )}
    </div>
  )
}
