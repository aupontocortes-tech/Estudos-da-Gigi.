export interface Subject {
  id: string
  name: string
  color: string
  totalTime: number // in seconds
}

export interface StudySession {
  id: string
  subjectId: string
  subjectName: string
  date: string
  startTime: string
  duration: number // in seconds
}

export interface Note {
  id: string
  subjectId: string
  subjectName: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface StudyData {
  subjects: Subject[]
  sessions: StudySession[]
  notes: Note[]
}

export const SUBJECT_COLORS = [
  '#22d3ee', // cyan
  '#f472b6', // pink
  '#34d399', // emerald
  '#fbbf24', // amber
  '#a78bfa', // violet
  '#fb7185', // rose
  '#60a5fa', // blue
  '#4ade80', // green
  '#f97316', // orange
  '#e879f9', // fuchsia
]
