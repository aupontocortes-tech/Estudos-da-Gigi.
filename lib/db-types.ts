export interface DbSubject {
  id: string
  name: string
  color: string
  total_time: number
}

export interface DbSession {
  id: string
  subject_id: string
  subject_name: string
  date: string
  start_time: string
  duration: number
}

export interface DbNote {
  id: string
  subject_id: string
  subject_name: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface DbEstudo {
  id: number
  materia: string
  tempo_min: number
  data: string
}
