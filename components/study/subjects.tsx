"use client"

import { useState } from 'react'
import { Plus, Trash2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Subject } from '@/lib/types'

interface SubjectsProps {
  subjects: Subject[]
  onAdd: (name: string) => Promise<Subject | null> | void
  onDelete: (id: string) => Promise<void> | void
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`
  }
  if (minutes > 0) {
    return `${minutes}min`
  }
  return '0min'
}

export function Subjects({ subjects, onAdd, onDelete }: SubjectsProps) {
  const [newSubjectName, setNewSubjectName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = () => {
    if (newSubjectName.trim()) {
      onAdd(newSubjectName.trim())
      setNewSubjectName('')
      setIsAdding(false)
    }
  }

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  const subjectToDelete = subjects.find(s => s.id === deleteId)

  return (
    <div className="p-4 space-y-4">
      {/* Add new subject */}
      {!isAdding ? (
        <Button
          onClick={() => setIsAdding(true)}
          className="w-full btn-gradient text-white rounded-2xl h-12 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Materia ✿
        </Button>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="Nome da materia"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="bg-input rounded-xl border-border"
            autoFocus
          />
          <Button onClick={handleAdd} disabled={!newSubjectName.trim()} className="btn-gradient text-white rounded-xl">
            Adicionar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsAdding(false)
              setNewSubjectName('')
            }}
            className="rounded-xl border-border"
          >
            Cancelar
          </Button>
        </div>
      )}

      {/* Subjects list */}
      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-card card-shadow flex items-center justify-center mb-4 border border-border">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <p className="text-foreground font-semibold">
            Nenhuma materia cadastrada
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Adicione uma materia para comecar!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {subjects.map(subject => (
            <div
              key={subject.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-card card-shadow border border-border"
              style={{ borderLeftColor: subject.color, borderLeftWidth: 4 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${subject.color}20` }}
                >
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                </div>
                <div>
                  <p className="font-bold text-foreground">{subject.name}</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {formatTime(subject.totalTime)} estudados
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(subject.id)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/20 rounded-full"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir materia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. A materia &quot;{subjectToDelete?.name}&quot; 
              e todo o historico de sessoes e anotacoes relacionadas serao permanentemente excluidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
