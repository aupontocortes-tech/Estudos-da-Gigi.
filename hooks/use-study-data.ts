"use client"

import { useState, useEffect, useCallback } from 'react'
import type { StudyData } from '@/lib/types'
import {
  browserLoadStudyData,
  browserAddSubject,
  browserDeleteSubject,
  browserAddSession,
  browserAddNote,
  browserUpdateNote,
  browserDeleteNote,
} from '@/lib/browser-sqlite'

const defaultData: StudyData = {
  subjects: [],
  sessions: [],
  notes: [],
}

export function useStudyData() {
  const [data, setData] = useState<StudyData>(defaultData)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const loaded = await browserLoadStudyData()
      setData(loaded)
    } catch (e) {
      console.error('[useStudyData] Falha ao carregar SQLite local:', e)
      const msg =
        e instanceof Error
          ? e.message
          : 'Não foi possível abrir o banco no aparelho. Verifique conexão e espaço.'
      setLoadError(msg)
      setData(defaultData)
    } finally {
      setIsLoading(false)
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const addSubject = useCallback(async (name: string) => {
    try {
      const newSubject = await browserAddSubject(name)
      if (!newSubject) return null
      setData((prev) => ({
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
      await browserDeleteSubject(id)
      setData((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((s) => s.id !== id),
        sessions: prev.sessions.filter((s) => s.subjectId !== id),
        notes: prev.notes.filter((n) => n.subjectId !== id),
      }))
    } catch (error) {
      console.error('Error deleting subject:', error)
    }
  }, [])

  const addSession = useCallback(async (subjectId: string, duration: number) => {
    try {
      const newSession = await browserAddSession(subjectId, duration)
      if (!newSession) throw new Error('Subject not found')

      setData((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) =>
          s.id === subjectId ? { ...s, totalTime: s.totalTime + duration } : s,
        ),
        sessions: [newSession, ...prev.sessions],
      }))
    } catch (error) {
      console.error('Error adding session:', error)
    }
  }, [])

  const addNote = useCallback(async (subjectId: string, title: string, content: string) => {
    try {
      const newNote = await browserAddNote(subjectId, title, content)
      if (!newNote) throw new Error('Subject not found')

      setData((prev) => ({
        ...prev,
        notes: [newNote, ...prev.notes],
      }))
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }, [])

  const updateNote = useCallback(async (id: string, title: string, content: string) => {
    try {
      const { updatedAt } = await browserUpdateNote(id, title, content)

      setData((prev) => ({
        ...prev,
        notes: prev.notes.map((n) =>
          n.id === id ? { ...n, title, content, updatedAt } : n,
        ),
      }))
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }, [])

  const deleteNote = useCallback(async (id: string) => {
    try {
      await browserDeleteNote(id)

      setData((prev) => ({
        ...prev,
        notes: prev.notes.filter((n) => n.id !== id),
      }))
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }, [])

  return {
    data,
    isLoaded,
    isLoading,
    loadError,
    addSubject,
    deleteSubject,
    addSession,
    addNote,
    updateNote,
    deleteNote,
    refreshData: loadData,
  }
}
