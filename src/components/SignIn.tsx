import { GraduationCap, ShieldCheck, Users, BriefcaseBusiness, BookOpen } from 'lucide-react'
import type { Role } from '../lib/supabase'

const roles: { role: Role; title: string; description: string; icon: typeof ShieldCheck }[] = [
  { role: 'admin', title: 'Admin', description: 'Institution overview and analytics', icon: ShieldCheck },
  { role: 'placement_officer', title: 'Placement Officer', description: 'Companies and recruitment pipeline', icon: BriefcaseBusiness },
  { role: 'faculty', title: 'Faculty', description: 'Student progress and development', icon: BookOpen },
  { role: 'student', title: 'Student', description: 'Personal readiness and applications', icon: Users },
]
export default function SignIn() {
  function enter(role: Role) { localStorage.setItem('sspt-demo-role', role); window.location.reload() }
  return <div className="auth-shell"><div className="auth-card demo-auth">
    <div className="brand-mark large"><GraduationCap size={26}/></div>
    <p className="eyebrow">STUDENT SKILL & PLACEMENT TRACKER</p><h1>Welcome to SSPT</h1>
    <p className="muted">Choose a demo workspace to explore the platform. No account or password is required.</p>
    <div className="demo-role-list">{roles.map(({role,title,description,icon:Icon})=><button className="demo-role" key={role} onClick={()=>enter(role)}><span className="demo-role-icon"><Icon size={19}/></span><span><b>{title}</b><small>{description}</small></span><span className="demo-arrow">→</span></button>)}</div>
    <p className="tiny muted">Demonstration environment · Sample data only · Changes are stored in this browser</p>
  </div></div>
}
