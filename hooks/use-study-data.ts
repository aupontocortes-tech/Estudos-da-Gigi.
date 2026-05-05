"use client"

import { useState, useEffect, useCallback } from 'react'
import type { StudyData, Subject, StudySession, Note } from '@/lib/types'

const defaultData: StudyData = {
  subjects: [],
  sessions: [],
  notes: [],
}

export function useStudyData() {
  const [data, setData] = useState<StudyData>(defaultData)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Carrega dados do servidor
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [subjectsRes, sessionsRes, notesRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/sessions'),
        fetch('/api/notes'),
      ])

      if (!subjectsRes.ok || !sessionsRes.ok || !notesRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [subjects, sessions, notes] = await Promise.all([
        subjectsRes.json(),
        sessionsRes.json(),
        notesRes.json(),
      ])

      setData({ subjects, sessions, notes })
    } catch (error) {
      console.error('Error loading data:', error)
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
