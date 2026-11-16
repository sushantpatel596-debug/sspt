// Deploy: supabase functions deploy match-eligibility
// Authenticated staff can match all open jobs; a student can only match their own profile.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const auth = req.headers.get('Authorization')
  if (!auth) return new Response('Unauthorized', { status: 401 })
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError || !user) return new Response('Unauthorized', { status: 401 })
  const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).single()
  const { student_id } = await req.json().catch(() => ({}))
  let studentQuery = client.from('student_overview').select('*')
  if (profile?.role === 'student') {
    const { data: own } = await client.from('students').select('id').eq('profile_id', user.id).single()
    if (!own || (student_id && student_id !== own.id)) return new Response('Forbidden', { status: 403 })
    studentQuery = studentQuery.eq('id', own.id) as typeof studentQuery
  } else if (!['admin','placement_officer','faculty'].includes(profile?.role ?? '')) return new Response('Forbidden', { status: 403 })
  else if (student_id) studentQuery = studentQuery.eq('id', student_id) as typeof studentQuery

  const [{ data: students, error: se }, { data: jobs, error: je }] = await Promise.all([
    studentQuery, client.from('jobs').select('id,title,min_cgpa,min_attendance,min_coding_score,eligible_departments,graduation_years,companies(name)')
  ])
  if (se || je) return Response.json({ error: se?.message ?? je?.message }, { status: 400 })
  const matches = (students ?? []).flatMap((s: any) => (jobs ?? []).map((j: any) => ({
    student_id: s.id, job_id: j.id, job_title: j.title, company: j.companies?.name,
    eligible: Number(s.cgpa) >= Number(j.min_cgpa) && Number(s.attendance_pct) >= Number(j.min_attendance) &&
      Number(s.coding_score) >= Number(j.min_coding_score) &&
      (!j.eligible_departments?.length || j.eligible_departments.includes(s.department)) &&
      (!j.graduation_years?.length || j.graduation_years.includes(s.graduation_year))
  })))
  return Response.json({ matches })
})
