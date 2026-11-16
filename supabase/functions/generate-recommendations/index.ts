// Deterministic, explainable recommendations. Replace/augment with a vetted model provider
// from this server-side function only; never expose provider secrets in the browser.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const auth = req.headers.get('Authorization')
  if (!auth) return new Response('Unauthorized', { status: 401 })
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const { data: { user } } = await db.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { student_id } = await req.json()
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  const { data: student } = await db.from('student_overview').select('*').eq('id', student_id).single()
  if (!student) return new Response('Student not found or not permitted', { status: 404 })
  if (profile?.role === 'student') {
    const { data: own } = await db.from('students').select('id').eq('profile_id', user.id).single()
    if (own?.id !== student_id) return new Response('Forbidden', { status: 403 })
  } else if (!['admin','placement_officer','faculty'].includes(profile?.role ?? '')) return new Response('Forbidden', { status: 403 })
  const suggestions = []
  if (Number(student.cgpa) < 7) suggestions.push({ student_id, category:'academics', title:'Strengthen core academics', rationale:`Current CGPA is ${student.cgpa}; prioritize foundational subjects and faculty office hours.` })
  if (Number(student.attendance_pct) < 80) suggestions.push({ student_id, category:'attendance', title:'Improve attendance consistency', rationale:`Attendance is ${student.attendance_pct}%; build a weekly attendance plan to reach the institution's target.` })
  if (Number(student.coding_score) < 70) suggestions.push({ student_id, category:'technical', title:'Practice coding assessments', rationale:`Coding assessment score is ${student.coding_score}; complete timed DSA practice and review missed problems.` })
  if (!suggestions.length) suggestions.push({ student_id, category:'career', title:'Prepare for technical interviews', rationale:'Current tracked indicators are strong. Focus on mock interviews, project walkthroughs and role-specific preparation.' })
  const { data, error } = await db.from('recommendations').insert(suggestions).select()
  if (error) return Response.json({ error:error.message }, { status:400 })
  return Response.json({ recommendations:data, generated_by:'transparent-rules' })
})
