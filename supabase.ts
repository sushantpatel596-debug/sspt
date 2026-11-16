import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(url && anon && !url.includes('YOUR_PROJECT'))
export const supabase = isConfigured
  ? createClient(url!, anon!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      realtime: { params: { eventsPerSecond: 10 } }
    })
  : null

export type Role = 'admin' | 'placement_officer' | 'faculty' | 'student'
export type Profile = { id: string; full_name: string; role: Role; department: string | null; avatar_url: string | null }
export type Student = {
  id: string; profile_id: string | null; roll_no: string; full_name: string; department: string; program: string;
  cgpa: number; attendance_pct: number; coding_score: number; readiness_score: number;
  placement_status: string; graduation_year: number
}

export function readiness(s: Pick<Student, 'cgpa'|'attendance_pct'|'coding_score'>) {
  return Math.round(Math.max(0, Math.min(100, s.cgpa / 10 * 30 + s.attendance_pct * .2 + s.coding_score * .5)))
}
