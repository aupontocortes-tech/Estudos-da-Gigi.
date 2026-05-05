"use client"

import { useState, useEffect, useCallback } from 'react'
import type { StudyData, Subject, StudySession, Note } from '@/lib/types'

const defaultData: StudyData = {
  subjects: [],
  sessions: [],
  notes: [],
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 10000): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      return null
    }
    return (await res.json()) as T
  } catch (error) {
    console.error(`Error fetching ${url}:`, error)
    return null
  } finally {
    clearTimeout(timer)
  }
}

export function useStudyData() {
  const [data, setData] = useState<StudyData>(defaultData)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Carrega dados do servidor
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [subjects, sessions, notes] = await Promise.all([
        fetchJsonWithTimeout<Subject[]>('/api/subjects'),
        fetchJsonWithTimeout<StudySession[]>('/api/sessions'),
        fetchJsonWithTimeout<Note[]>('/api/notes'),
      ])
      setData({
        subjects: subjects ?? [],
        sessions: sessions ?? [],
        notes: notes ?? [],
      })
    } finally {
      setIsLoading(false)
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addSubject = useCallback(async (name: string) => {
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!res.ok) throw new Error('Failed to add subject')

      const newSubject: Subject = await res.json()
      
      setData(prev => ({
        ...prev,
        subjects: [...prev.subjects, newSubject],
      }))
      
      return newSubject
    } catch (error) {
      console.error('Error adding subject:', error)
      return null
    }
  }, [])

  const deleteSubject = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/subjects?id=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete subject')

      setData(prev => ({
        ...prev,
        subjects: prev.subjects.filter(s => s.id !== id),
        sessions: prev.sessions.filter(s => s.subjectId !== id),
        notes: prev.notes.filter(n => n.subjectId !== id),
      }))
    } catch (error) {
      console.error('Error deleting subject:', error)
    }
  }, [])

  const addSession = useCallback(async (subjectId: string, duration: number) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, duration }),
      })

      if (!res.ok) throw new Error('Failed to add session')

      const newSession: StudySession = await res.json()

      setData(prev => ({
        ...prev,
        subjects: prev.subjects.map(s => 
          s.id === subjectId 
            ? { ...s, totalTime: s.totalTime + duration }
            : s
        ),
        sessions: [newSession, ...prev.sessions],
      }))
    } catch (error) {
      console.error('Error adding session:', error)
    }
  }, [])

  const addNote = useCallback(async (subjectId: string, title: string, content: string) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, title, content }),
      })

      if (!res.ok) throw new Error('Failed to add note')

      const newNote: Note = await res.json()

      setData(prev => ({
        ...prev,
        notes: [newNote, ...prev.notes],
      }))
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }, [])

  const updateNote = useCallback(async (id: string, title: string, content: string) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, content }),
      })

      if (!res.ok) throw new Error('Failed to update note')

      const { updatedAt } = await res.json()

      setData(prev => ({
        ...prev,
        notes: prev.notes.map(n => 
          n.id === id 
            ? { ...n, title, content, updatedAt }
            : n
        ),
      }))
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }, [])

  const deleteNote = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/notes?id=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete note')

      setData(prev => ({
        ...prev,
        notes: prev.notes.filter(n => n.id !== id),
      }))
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }, [])

  return {
    data,
    isLoaded,
    isLoading,
    addSubject,
    deleteSubject,
    addSession,
    addNote,
    updateNote,
    deleteNote,
    refreshData: loadData,
  }
}
