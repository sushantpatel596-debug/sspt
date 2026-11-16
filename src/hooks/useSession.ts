import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isConfigured, supabase, type Profile, type Role } from '../lib/supabase'

const demoKey = 'sspt-demo-role'
const demoProfiles: Record<Role, Profile> = {
  admin: { id: 'demo-admin', full_name: 'Aarav Sharma', role: 'admin', department: 'Administration', avatar_url: null },
  placement_officer: { id: 'demo-placement', full_name: 'Priya Singh', role: 'placement_officer', department: 'Training & Placement', avatar_url: null },
  faculty: { id: 'demo-faculty', full_name: 'Dr. Rohan Das', role: 'faculty', department: 'Computer Science', avatar_url: null },
  student: { id: 'demo-student', full_name: 'Ananya Meitei', role: 'student', department: 'Computer Science', avatar_url: null },
}
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isConfigured)
  useEffect(() => {
    const client = supabase
    if (!client) {
      const role = localStorage.getItem(demoKey) as Role | null
      if (role && demoProfiles[role]) {
        setProfile(demoProfiles[role])
        setSession({ user: { id: demoProfiles[role].id } } as Session)
      }
      setLoading(false)
      return
    }
    let alive = true
    const load = async (s: Session | null) => {
      if (!alive) return
      setSession(s)
      if (!s) { setProfile(null); setLoading(false); return }
      const { data, error } = await client.from('profiles').select('*').eq('id', s.user.id).single()
      if (!alive) return
      if (error) console.error('Profile load failed:', error.message)
      setProfile(data as Profile | null)
      setLoading(false)
    }
    client.auth.getSession().then(({ data }) => load(data.session))
    const { data: listener } = client.auth.onAuthStateChange((_event, s) => { void load(s) })
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [])
  return { session, profile, loading, configured: true }
}
