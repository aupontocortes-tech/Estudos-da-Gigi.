"use client"

import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Note, Subject } from '@/lib/types'

interface NotesProps {
  notes: Note[]
  subjects: Subject[]
  activeSubjectId: string
  onAdd: (subjectId: string, title: string, content: string) => Promise<void> | void
  onUpdate: (id: string, title: string, content: string) => Promise<void> | void
  onDelete: (id: string) => Promise<void> | void
}

export function Notes({ notes, subjects, activeSubjectId, onAdd, onUpdate, onDelete }: NotesProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [readingNote, setReadingNote] = useState<Note | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newSubjectId, setNewSubjectId] = useState(activeSubjectId || subjects[0]?.id || '')
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const getSubjectColor = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.color || '#F48FB1'
  }

  const handleCreate = () => {
    if (newTitle.trim() && newSubjectId) {
      onAdd(newSubjectId, newTitle.trim(), newContent.trim())
      setNewTitle('')
      setNewContent('')
      setIsCreating(false)
    }
  }

  const handleStartEdit = (note: Note) => {
    setReadingNote(null)
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      onUpdate(id, editTitle.trim(), editContent.trim())
      setEditingId(null)
    }
  }

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-4 space-y-4">
      {/* Create new note button */}
      {!isCreating && (
        <Button
          onClick={() => {
            setNewSubjectId(activeSubjectId || subjects[0]?.id || '')
            setIsCreating(true)
          }}
          className="w-full btn-gradient text-white rounded-2xl h-12 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Anotacao ✿
        </Button>
      )}

      {/* Create form */}
      {isCreating && (
        <div className="p-5 rounded-2xl bg-card card-shadow border border-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">Nova Anotacao ✦</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsCreating(false)
                setNewTitle('')
                setNewContent('')
              }}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <Select value={newSubjectId} onValueChange={setNewSubjectId}>
            <SelectTrigger className="bg-input rounded-xl border-border">
              <SelectValue placeholder="Materia" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {subjects.map(subject => (
                <SelectItem key={subject.id} value={subject.id} className="rounded-lg">
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
          
          <Input
            placeholder="Titulo"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="bg-input rounded-xl border-border"
          />
          
          <Textarea
            placeholder="Conteudo da anotacao..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            className="bg-input rounded-xl border-border resize-none"
          />
          
          <Button
            onClick={handleCreate}
            disabled={!newTitle.trim() || !newSubjectId}
            className="w-full btn-gradient text-white rounded-xl h-11 font-semibold"
          >
            <Check className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      )}

      {/* Notes list */}
      {notes.length === 0 && !isCreating ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-card card-shadow flex items-center justify-center mb-4 border border-border">
            <span className="text-3xl">✎</span>
          </div>
          <p className="text-foreground font-semibold">
            Nenhuma anotacao ainda
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Crie uma anotacao para comecar!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => {
            const color = getSubjectColor(note.subjectId)
            const isEditing = editingId === note.id

            if (isEditing) {
              return (
                <div
                  key={note.id}
                  className="p-5 rounded-2xl bg-card card-shadow border border-border space-y-4"
                >
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-input font-semibold rounded-xl border-border"
                  />
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="bg-input rounded-xl border-border resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSaveEdit(note.id)}
                      className="flex-1 btn-gradient text-white rounded-xl"
                      disabled={!editTitle.trim()}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingId(null)}
                      className="flex-1 rounded-xl border-border"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={note.id}
                role="button"
                tabIndex={0}
                onClick={() => setReadingNote(note)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setReadingNote(note)
                  }
                }}
                className="p-4 rounded-2xl bg-card card-shadow border border-border cursor-pointer text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                style={{ borderLeftColor: color, borderLeftWidth: 4 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-muted-foreground truncate font-medium">
                        {note.subjectName}
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground truncate">{note.title}</h3>
                    {note.content ? (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                        {note.content}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/70 mt-1 italic">Sem texto — toque para abrir</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 font-medium">
                      {formatDate(note.updatedAt)}
                    </p>
                    <p className="text-[10px] text-primary/80 font-semibold mt-1.5">Toque para ler tudo ✦</p>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartEdit(note)
                      }}
                      className="w-9 h-9 rounded-full hover:bg-primary/20"
                      aria-label="Editar anotação"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteId(note.id)
                      }}
                      className="w-9 h-9 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                      aria-label="Excluir anotação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Leitura da nota */}
      <Dialog open={!!readingNote} onOpenChange={(open) => !open && setReadingNote(null)}>
        <DialogContent className="max-h-[min(520px,85vh)] overflow-y-auto rounded-2xl sm:max-w-md">
          {readingNote && (
            <>
              <DialogHeader className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: getSubjectColor(readingNote.subjectId) }}
                  />
                  <span className="text-xs text-muted-foreground font-medium">{readingNote.subjectName}</span>
                </div>
                <DialogTitle className="text-xl font-bold leading-tight pr-8">{readingNote.title}</DialogTitle>
                <p className="text-xs text-muted-foreground font-medium pt-1">
                  {formatDate(readingNote.updatedAt)}
                </p>
              </DialogHeader>
              <div className="rounded-xl border border-border bg-secondary/30 px-3.5 py-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words min-h-[4rem]">
                {readingNote.content?.trim()
                  ? readingNote.content
                  : 'Esta anotação não tem texto — só o título.'}
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  type="button"
                  className="w-full btn-gradient text-white rounded-xl font-semibold"
                  onClick={() => handleStartEdit(readingNote)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-border"
                  onClick={() => setReadingNote(null)}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir anotacao?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. A anotacao sera permanentemente excluida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
