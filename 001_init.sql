-- SSPT schema: run in Supabase SQL Editor or with `supabase db push`.
-- SECURITY: browser clients use only the anon key. Authorization is enforced with RLS.
create extension if not exists pgcrypto;

create type public.app_role as enum ('admin','placement_officer','faculty','student');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'student',
  department text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  roll_no text not null unique,
  full_name text not null,
  department text not null,
  program text not null,
  cgpa numeric(4,2) not null default 0 check (cgpa between 0 and 10),
  attendance_pct numeric(5,2) not null default 0 check (attendance_pct between 0 and 100),
  coding_score numeric(5,2) not null default 0 check (coding_score between 0 and 100),
  graduation_year integer not null,
  placement_status text not null default 'Seeking' check (placement_status in ('Seeking','In process','Placed','At risk')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  name text not null,
  proficiency integer not null check (proficiency between 0 and 100),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  name text not null,
  issuer text,
  credential_url text,
  issued_at date,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  description text,
  repository_url text,
  technologies text[] not null default '{}',
  status text not null default 'In progress',
  created_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  industry text,
  website text,
  description text,
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  min_cgpa numeric(4,2) not null default 0,
  min_attendance numeric(5,2) not null default 0,
  min_coding_score numeric(5,2) not null default 0,
  eligible_departments text[] not null default '{}',
  graduation_years integer[] not null default '{}',
  deadline timestamptz,
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null default 'Applied' check (status in ('Applied','Shortlisted','Interview','Offered','Rejected','Withdrawn')),
  applied_at timestamptz not null default now(),
  unique(job_id, student_id)
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_date date not null,
  present boolean not null,
  subject text,
  created_at timestamptz not null default now(),
  unique(student_id,class_date,subject)
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  category text not null,
  score numeric(5,2) not null check(score between 0 and 100),
  max_score numeric(5,2) not null default 100,
  assessed_at timestamptz not null default now()
);

create table public.readiness_assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  score integer not null check(score between 0 and 100),
  factors jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now()
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  category text not null,
  title text not null,
  rationale text not null,
  action_url text,
  status text not null default 'open' check(status in ('open','completed','dismissed')),
  generated_by text not null default 'rules',
  created_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  severity text not null default 'info' check(severity in ('info','warning','critical','success')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.current_role()
returns public.app_role language sql stable security definer set search_path=public
as $$ select role from public.profiles where id=auth.uid() $$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path=public
as $$ select coalesce(public.current_role() in ('admin','placement_officer','faculty'),false) $$;

create or replace function public.owns_student(target uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.students s where s.id=target and s.profile_id=auth.uid()) $$;

-- A view computes readiness from stored academic indicators; it is not an AI prediction.
create or replace view public.student_overview with (security_invoker=true) as
select s.id,s.profile_id,s.roll_no,s.full_name,s.department,s.program,s.cgpa,s.attendance_pct,s.coding_score,
s.graduation_year,s.placement_status,
round(least(100,greatest(0,(s.cgpa/10*30)+(s.attendance_pct*.20)+(s.coding_score*.50))))::integer as readiness_score
from public.students s;

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.skills enable row level security;
alter table public.certifications enable row level security;
alter table public.projects enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.attendance_records enable row level security;
alter table public.assessments enable row level security;
alter table public.readiness_assessments enable row level security;
alter table public.recommendations enable row level security;
alter table public.alerts enable row level security;

create policy "profiles self or admin read" on public.profiles for select using (id=auth.uid() or public.current_role()='admin');
create policy "admin manages profiles" on public.profiles for all using(public.current_role()='admin') with check(public.current_role()='admin');

create policy "staff read students, students read self" on public.students for select using(public.is_staff() or profile_id=auth.uid());
create policy "admin and placement manage students" on public.students for all using(public.current_role() in ('admin','placement_officer')) with check(public.current_role() in ('admin','placement_officer'));
create policy "faculty updates student academics" on public.students for update using(public.current_role()='faculty') with check(public.current_role()='faculty');

create policy "skills read own or staff" on public.skills for select using(public.is_staff() or public.owns_student(student_id));
create policy "students and staff manage skills" on public.skills for all using(public.is_staff() or public.owns_student(student_id)) with check(public.is_staff() or public.owns_student(student_id));
create policy "certifications read own or staff" on public.certifications for select using(public.is_staff() or public.owns_student(student_id));
create policy "certifications manage own or staff" on public.certifications for all using(public.is_staff() or public.owns_student(student_id)) with check(public.is_staff() or public.owns_student(student_id));
create policy "projects read own or staff" on public.projects for select using(public.is_staff() or public.owns_student(student_id));
create policy "projects manage own or staff" on public.projects for all using(public.is_staff() or public.owns_student(student_id)) with check(public.is_staff() or public.owns_student(student_id));

create policy "authenticated company read" on public.companies for select to authenticated using(true);
create policy "admin placement manage companies" on public.companies for all using(public.current_role() in ('admin','placement_officer')) with check(public.current_role() in ('admin','placement_officer'));
create policy "authenticated job read" on public.jobs for select to authenticated using(true);
create policy "admin placement manage jobs" on public.jobs for all using(public.current_role() in ('admin','placement_officer')) with check(public.current_role() in ('admin','placement_officer'));

create policy "applications own or staff read" on public.applications for select using(public.is_staff() or public.owns_student(student_id));
create policy "students apply own" on public.applications for insert with check(public.owns_student(student_id));
create policy "staff update applications" on public.applications for update using(public.current_role() in ('admin','placement_officer')) with check(public.current_role() in ('admin','placement_officer'));

create policy "attendance read own or staff" on public.attendance_records for select using(public.is_staff() or public.owns_student(student_id));
create policy "faculty staff attendance write" on public.attendance_records for all using(public.current_role() in ('admin','faculty')) with check(public.current_role() in ('admin','faculty'));
create policy "assessments read own or staff" on public.assessments for select using(public.is_staff() or public.owns_student(student_id));
create policy "faculty assessment write" on public.assessments for all using(public.current_role() in ('admin','faculty')) with check(public.current_role() in ('admin','faculty'));
create policy "readiness own or staff read" on public.readiness_assessments for select using(public.is_staff() or public.owns_student(student_id));
create policy "staff readiness write" on public.readiness_assessments for all using(public.current_role() in ('admin','placement_officer','faculty')) with check(public.current_role() in ('admin','placement_officer','faculty'));
create policy "recommendations own or staff read" on public.recommendations for select using(public.is_staff() or public.owns_student(student_id));
create policy "staff recommendations manage" on public.recommendations for all using(public.current_role() in ('admin','placement_officer','faculty')) with check(public.current_role() in ('admin','placement_officer','faculty'));
create policy "alerts recipient or staff read" on public.alerts for select using(recipient_id=auth.uid() or public.current_role() in ('admin','placement_officer'));
create policy "staff create alerts" on public.alerts for insert with check(public.current_role() in ('admin','placement_officer','faculty'));
create policy "recipient marks alert read" on public.alerts for update using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());

-- Realtime publication: clients subscribe only to rows their RLS policies allow.
alter publication supabase_realtime add table public.students;
alter publication supabase_realtime add table public.alerts;
alter publication supabase_realtime add table public.applications;

grant select on public.student_overview to authenticated;
