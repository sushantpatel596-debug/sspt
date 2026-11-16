import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowUpRight, Bell, BriefcaseBusiness, Building2, CalendarDays, CircleHelp, Code2, GraduationCap, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Sparkles, Target, Users, X } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from 'recharts'
import { supabase, type Profile, type Role, type Student } from './lib/supabase'
import { useSession } from './hooks/useSession'
import SignIn from './components/SignIn'
import StatCard from './components/StatCard'
import StudentTable from './components/StudentTable'

const nav = [
 {label:'Overview',icon:LayoutDashboard,roles:['admin','placement_officer','faculty','student']},
 {label:'Students',icon:Users,roles:['admin','placement_officer','faculty']},
 {label:'Companies',icon:Building2,roles:['admin','placement_officer']},
 {label:'Applications',icon:BriefcaseBusiness,roles:['admin','placement_officer','student']},
 {label:'Skills & courses',icon:Code2,roles:['admin','faculty','student']},
 {label:'Analytics',icon:Activity,roles:['admin','placement_officer','faculty']},
 {label:'Settings',icon:Settings,roles:['admin','placement_officer','faculty','student']}
] as const
const roleTitle:Record<Role,string>={admin:'Admin workspace',placement_officer:'Placement office',faculty:'Faculty workspace',student:'Student workspace'}

const demoStudents: Student[] = [
 {id:'s1',profile_id:'demo-student',roll_no:'CSE2022001',full_name:'Ananya Meitei',department:'Computer Science',program:'B.Tech',cgpa:8.7,attendance_pct:94,coding_score:86,readiness_score:87,placement_status:'Ready',graduation_year:2026},
 {id:'s2',profile_id:null,roll_no:'CSE2022002',full_name:'Rahul Sharma',department:'Computer Science',program:'B.Tech',cgpa:8.2,attendance_pct:89,coding_score:78,readiness_score:81,placement_status:'Ready',graduation_year:2026},
 {id:'s3',profile_id:null,roll_no:'ECE2022014',full_name:'Nisha Devi',department:'Electronics',program:'B.Tech',cgpa:7.9,attendance_pct:92,coding_score:69,readiness_score:74,placement_status:'In progress',graduation_year:2026},
 {id:'s4',profile_id:null,roll_no:'IT2022018',full_name:'Arjun Kumar',department:'Information Technology',program:'B.Tech',cgpa:7.1,attendance_pct:81,coding_score:58,readiness_score:64,placement_status:'In progress',graduation_year:2026},
 {id:'s5',profile_id:null,roll_no:'CSE2022027',full_name:'Maryam Khan',department:'Computer Science',program:'B.Tech',cgpa:8.9,attendance_pct:97,coding_score:93,readiness_score:94,placement_status:'Ready',graduation_year:2026},
 {id:'s6',profile_id:null,roll_no:'ME2022031',full_name:'Bikash Singh',department:'Mechanical',program:'B.Tech',cgpa:6.8,attendance_pct:76,coding_score:49,readiness_score:56,placement_status:'Needs support',graduation_year:2026},
 {id:'s7',profile_id:null,roll_no:'CSE2022040',full_name:'Isha Patel',department:'Computer Science',program:'B.Tech',cgpa:8.1,attendance_pct:91,coding_score:82,readiness_score:83,placement_status:'Ready',graduation_year:2026},
 {id:'s8',profile_id:null,roll_no:'ECE2022044',full_name:'Dev Raj',department:'Electronics',program:'B.Tech',cgpa:7.4,attendance_pct:84,coding_score:62,readiness_score:68,placement_status:'In progress',graduation_year:2026},
]
const demoCompanies = [
 {id:'c1',name:'Infosys',industry:'Information Technology',website:'https://www.infosys.com'},
 {id:'c2',name:'Tata Consultancy Services',industry:'IT Services & Consulting',website:'https://www.tcs.com'},
 {id:'c3',name:'Wipro',industry:'Information Technology',website:'https://www.wipro.com'},
 {id:'c4',name:'Microsoft',industry:'Software & Cloud',website:'https://www.microsoft.com'},
]
const demoAlerts = [
 {id:'a1',title:'Placement drive announced',message:'Infosys campus recruitment registration is open.',created_at:new Date().toISOString()},
 {id:'a2',title:'Skill development reminder',message:'Complete the data structures practice assessment this week.',created_at:new Date(Date.now()-86400000).toISOString()},
]
const demoApplications = [
 {id:'ap1',status:'shortlisted',created_at:new Date().toISOString(),students:{full_name:'Ananya Meitei'},jobs:{title:'Graduate Engineer Trainee',companies:{name:'Infosys'}}},
 {id:'ap2',status:'interview',created_at:new Date(Date.now()-86400000*2).toISOString(),students:{full_name:'Rahul Sharma'},jobs:{title:'Systems Engineer',companies:{name:'TCS'}}},
 {id:'ap3',status:'applied',created_at:new Date(Date.now()-86400000*5).toISOString(),students:{full_name:'Nisha Devi'},jobs:{title:'Project Engineer',companies:{name:'Wipro'}}},
 {id:'ap4',status:'selected',created_at:new Date(Date.now()-86400000*9).toISOString(),students:{full_name:'Maryam Khan'},jobs:{title:'Software Engineer',companies:{name:'Microsoft'}}},
]

export default function App() {
 const {session,profile,loading}=useSession()
 const [active,setActive]=useState('Overview')
 const [students,setStudents]=useState<Student[]>([])
 const [query,setQuery]=useState('')
 const [alerts,setAlerts]=useState<any[]>([])
 const [companies,setCompanies]=useState<any[]>([])
 const [applications,setApplications]=useState<any[]>([])
 const [busy,setBusy]=useState(false)
 const [mobileOpen,setMobileOpen]=useState(false)
 const [loadError,setLoadError]=useState('')
 const role=profile?.role ?? 'student'
 const visibleNav=nav.filter(n=>(n.roles as readonly string[]).includes(role))
 const load=async()=>{
   if(!profile)return
   if(!supabase){setStudents(demoStudents);setAlerts(demoAlerts);setCompanies(demoCompanies);setApplications(demoApplications);setBusy(false);setLoadError('');return}
   setBusy(true);setLoadError('')
   const [st,al,co,ap]=await Promise.all([
     supabase.from('student_overview').select('*').order('readiness_score',{ascending:false}).limit(100),
     supabase.from('alerts').select('*').order('created_at',{ascending:false}).limit(8),
     supabase.from('companies').select('id,name,industry,website,created_at').order('name'),
     supabase.from('applications').select('id,status,created_at,students(full_name),jobs(title,companies(name))').order('created_at',{ascending:false}).limit(30)
   ])
   if(st.error) setLoadError(st.error.message)
   else setStudents((st.data??[]) as Student[])
   if(!al.error)setAlerts(al.data??[])
   if(!co.error)setCompanies(co.data??[])
   if(!ap.error)setApplications(ap.data??[])
   setBusy(false)
 }
 useEffect(()=>{void load()},[profile?.id])
 useEffect(()=>{
   if(!supabase||!profile)return
   const channel=supabase.channel('sspt-live')
     .on('postgres_changes',{event:'*',schema:'public',table:'students'},()=>void load())
     .on('postgres_changes',{event:'*',schema:'public',table:'alerts'},()=>void load())
     .on('postgres_changes',{event:'*',schema:'public',table:'applications'},()=>void load())
     .subscribe()
   return()=>{void supabase.removeChannel(channel)}
 },[profile?.id])
 const filtered=useMemo(()=>students.filter(s=>`${s.full_name} ${s.roll_no} ${s.department}`.toLowerCase().includes(query.toLowerCase())),[students,query])
 const avg=students.length?students.reduce((a,s)=>a+Number(s.cgpa),0)/students.length:0
 const ready=students.filter(s=>s.readiness_score>=70).length
 const signOut=async()=>{if(!supabase){localStorage.removeItem('sspt-demo-role');window.location.reload();return}await supabase.auth.signOut()}
 if(loading)return <div className="loading">Loading your secure workspace…</div>
 if(!session)return <SignIn/>
 if(!profile)return <div className="loading"><div className="auth-card"><ShieldCheck size={30}/><h2>Profile setup required</h2><p>Your account is authenticated, but no role profile exists. Ask your administrator to assign your role in the profiles table.</p><button className="primary-btn" onClick={signOut}>Sign out</button></div></div>

 return <div className="app-shell">
  {mobileOpen&&<div className="scrim" onClick={()=>setMobileOpen(false)}/>}
  <aside className={`sidebar ${mobileOpen?'open':''}`}>
   <div className="brand"><div className="brand-mark"><GraduationCap size={22}/></div><div><b>SSPT</b><small>STUDENT SUCCESS</small></div><button className="icon-btn mobile-close" onClick={()=>setMobileOpen(false)}><X/></button></div>
   <div className="workspace-label">WORKSPACE</div><nav>{visibleNav.map(n=><button key={n.label} onClick={()=>{setActive(n.label);setMobileOpen(false)}} className={`nav-item ${active===n.label?'active':''}`}><n.icon size={18}/>{n.label}{n.label==='Applications'&&<span className="nav-count">{applications.length}</span>}</button>)}</nav>
   <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={18}/></div><b>Need a hand?</b><p>Explore the SSPT help center.</p><button onClick={()=>setActive('Help center')}>Get support <ArrowUpRight size={14}/></button></div><div className="profile-mini"><div className="avatar">{profile.full_name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div><b>{profile.full_name}</b><small>{role.replace('_',' ')}</small></div><button className="icon-btn" title="Sign out" onClick={signOut}><LogOut size={17}/></button></div></div>
  </aside>
  <main className="main">
   <header className="topbar"><div className="top-left"><button className="icon-btn mobile-menu" onClick={()=>setMobileOpen(true)}><Menu/></button><div className="crumb">Workspace <span>/</span> <b>{active}</b></div></div><div className="top-actions"><div className="date-pill"><CalendarDays size={15}/> Demo · Academic year 2025–26</div><button className="icon-btn notification" title="Notifications"><Bell size={19}/>{alerts.length>0&&<i/>}</button><div className="top-avatar">{profile.full_name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div></div></header>
   <div className="content">
    <div className="welcome-row"><div><p className="eyebrow">{roleTitle[role].toUpperCase()}</p><h1>{active==='Overview'?'Good to see you, '+profile.full_name.split(' ')[0]+' 👋':active}</h1><p className="muted">{active==='Overview'?'Here’s what’s happening across your student success journey.':'Manage and review your institution’s placement ecosystem.'}</p></div><button className="secondary-btn" onClick={()=>void load()}><Activity size={16}/>{busy?'Refreshing…':'Refresh data'}</button></div>
    {loadError&&<div className="notice error"><X size={17}/>{loadError}</div>}
    {active==='Overview'&&<Overview role={role} students={students} avg={avg} ready={ready} alerts={alerts} companies={companies} applications={applications} profile={profile}/>}
    {active==='Students'&&<><div className="section-intro"><h2>Student performance</h2><p>Academic indicators, technical skills and placement readiness from live records.</p></div><StudentTable students={filtered} query={query} onQuery={setQuery}/></>}
    {active==='Companies'&&<Companies companies={companies} onRefresh={()=>void load()} role={role}/>}
    {active==='Applications'&&<Applications apps={applications}/>}
    {active==='Skills & courses'&&<Skills students={students} role={role}/>}
    {active==='Analytics'&&<Analytics students={students}/>}
    {active==='Settings'&&<SettingsPanel profile={profile}/>}
    {active==='Help center'&&<div className="panel"><h3>SSPT help center</h3><p className="muted">For access, role assignment or data corrections, contact your institution’s SSPT administrator.</p></div>}
    <footer>© 2026 SSPT · Student Skill & Placement Tracker <span>Demo environment · sample data</span></footer>
   </div>
  </main>
 </div>
}

function Overview({role,students,avg,ready,alerts,companies,applications,profile}:{role:Role;students:Student[];avg:number;ready:number;alerts:any[];companies:any[];applications:any[];profile:Profile}){
 const trend = Array.from({length:6},(_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-(5-i));const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;return {month:d.toLocaleString('en',{month:'short'}),applications:applications.filter(a=>String(a.created_at).slice(0,7)===key).length}})
 const own=students.find(s=>s.profile_id===profile.id)
 const cards=role==='student'?[['Your CGPA',own?.cgpa?.toFixed(2)??'—','Academic performance'],['Attendance',own?`${own.attendance_pct}%`:'—','Class attendance'],['Coding score',own?.coding_score??'—','Assessment score'],['Readiness',own?`${own.readiness_score}%`:'—','Placement readiness']]:[['Total students',students.length,'Across all departments'],['Placement ready',ready,`${students.length?Math.round(ready/students.length*100):0}% of tracked students`],['Average CGPA',avg.toFixed(2),'Institution-wide average'],['Companies',companies.length,'Partner organizations']]
 return <><div className="stats-grid">{cards.map((c,i)=><StatCard key={c[0]} label={c[0]} value={c[1]} detail={c[2]} icon={[<Users/>,<Target/>,<GraduationCap/>,<Building2/>][i]} tone={['blue','violet','cyan','orange'][i]}/>)}</div>
 <div className="dashboard-grid"><section className="panel chart-panel"><div className="panel-head"><div><h3>Application activity</h3><p>Applications created per month from live records</p></div><span className="period-select">Last 6 months</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><defs><linearGradient id="placedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#315efb" stopOpacity={.2}/><stop offset="100%" stopColor="#315efb" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#edf1f8" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#8a96aa',fontSize:12}}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill:'#8a96aa',fontSize:12}}/><Tooltip/><Area type="monotone" dataKey="applications" stroke="#315efb" strokeWidth={2.5} fill="url(#placedFill)" name="Applications"/></AreaChart></ResponsiveContainer></div></section>
 <section className="panel"><div className="panel-head"><div><h3>Readiness distribution</h3><p>Students by readiness band</p></div><Target size={19} className="muted"/></div><div className="readiness-total"><strong>{students.length?Math.round(ready/students.length*100):0}%</strong><span>meeting readiness target</span></div><div className="band-list"><Band label="Placement ready" count={ready} total={students.length} color="blue"/><Band label="In progress" count={students.filter(s=>s.readiness_score>=40&&s.readiness_score<70).length} total={students.length} color="violet"/><Band label="Needs support" count={students.filter(s=>s.readiness_score<40).length} total={students.length} color="orange"/></div><div className="ai-tip"><Sparkles size={17}/><p><b>Placement insight</b><br/>Focus skill-building plans on students below the 70% readiness threshold.</p></div></section></div>
 <div className="lower-grid"><section className="panel"><div className="panel-head"><div><h3>Recent student activity</h3><p>Highest readiness scores</p></div><span className="linkish">View all</span></div><StudentTableCompact students={students.slice(0,5)}/></section><section className="panel"><div className="panel-head"><div><h3>Live alerts</h3><p>Latest system notifications</p></div><span className="alert-dot"/></div><div className="alerts-list">{alerts.length?alerts.slice(0,5).map(a=><div className="alert-row" key={a.id}><span className="alert-icon"><Bell size={15}/></span><div><b>{a.title}</b><p>{a.message}</p><small>{new Date(a.created_at).toLocaleString()}</small></div></div>):<div className="empty">No alerts at the moment.</div>}</div></section></div></>}
function Band({label,count,total,color}:{label:string;count:number;total:number;color:string}){return <div className="band"><div><span>{label}</span><b>{count}</b></div><div className="progress"><i className={color} style={{width:`${total?count/total*100:0}%`}}/></div></div>}
function StudentTableCompact({students}:{students:Student[]}){return <div className="compact-list">{students.map(s=><div className="compact-row" key={s.id}><span className="avatar">{s.full_name.split(' ').map(x=>x[0]).slice(0,2).join('')}</span><div><b>{s.full_name}</b><small>{s.roll_no} · {s.department}</small></div><strong>{s.readiness_score}%</strong></div>)}{!students.length&&<div className="empty">No student data available yet.</div>}</div>}
function Companies({companies,onRefresh,role}:{companies:any[];onRefresh:()=>void;role:Role}){const [name,setName]=useState('');const [industry,setIndustry]=useState('');const [website,setWebsite]=useState('');const [error,setError]=useState('');async function add(e:React.FormEvent){e.preventDefault();if(!supabase)return;setError('');const {error}=await supabase.from('companies').insert({name,industry,website:website||null});if(error)setError(error.message);else{name&&setName('');setIndustry('');setWebsite('');onRefresh()}}return <><div className="section-intro"><h2>Company partners</h2><p>Manage organizations participating in campus recruitment.</p></div>{role!=='student'&&supabase&&<form className="panel add-company" onSubmit={add}><h3>Add a company</h3><div className="inline-fields"><input required placeholder="Company name" value={name} onChange={e=>setName(e.target.value)}/><input placeholder="Industry" value={industry} onChange={e=>setIndustry(e.target.value)}/><input placeholder="Website (https://…)" value={website} onChange={e=>setWebsite(e.target.value)}/><button className="primary-btn">Add company</button></div>{error&&<p className="error">{error}</p>}</form>}<div className="company-grid">{companies.map(c=><div className="panel company-card" key={c.id}><div className="company-logo"><Building2/></div><h3>{c.name}</h3><p>{c.industry||'Industry not specified'}</p>{c.website&&<a href={c.website} target="_blank" rel="noreferrer">{c.website}</a>}</div>)}{!companies.length&&<div className="panel empty">No companies have been added yet.</div>}</div></>}
function Applications({apps}:{apps:any[]}){return <><div className="section-intro"><h2>Job applications</h2><p>Application pipeline and current outcomes.</p></div><div className="panel"><div className="table-wrap"><table><thead><tr><th>Student</th><th>Role</th><th>Company</th><th>Applied</th><th>Status</th></tr></thead><tbody>{apps.map(a=><tr key={a.id}><td>{a.students?.full_name??'—'}</td><td>{a.jobs?.title??'—'}</td><td>{a.jobs?.companies?.name??'—'}</td><td>{new Date(a.created_at).toLocaleDateString()}</td><td><span className="status blue">{a.status}</span></td></tr>)}{!apps.length&&<tr><td colSpan={5} className="empty">No applications recorded.</td></tr>}</tbody></table></div></div></>}
function Skills({students,role}:{students:Student[];role:Role}){const skillData=Object.values(students.reduce((acc,s)=>{const k=s.department||'Unassigned';acc[k]??={skill:k,score:0,count:0};acc[k].score+=Number(s.coding_score);acc[k].count++;return acc},{} as Record<string,{skill:string;score:number;count:number}>)).map(x=>({skill:x.skill,score:x.count?Math.round(x.score/x.count):0}));return <><div className="section-intro"><h2>Skills & development</h2><p>Technical assessment signals from student records.</p></div><div className="dashboard-grid"><section className="panel"><div className="panel-head"><div><h3>Average coding score by department</h3><p>Calculated from live student coding scores</p></div></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={skillData} layout="vertical"><CartesianGrid stroke="#edf1f8" horizontal={false}/><XAxis type="number" domain={[0,100]} axisLine={false} tickLine={false}/><YAxis dataKey="skill" type="category" axisLine={false} tickLine={false} width={110}/><Tooltip/><Bar dataKey="score" fill="#315efb" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div></section><section className="panel"><div className="panel-head"><div><h3>Development checklist</h3><p>Suggested skill-building focus</p></div><Sparkles className="brand-text"/></div>{['Data structures & algorithms','Full-stack project portfolio','SQL and database fundamentals','Communication and aptitude'].map((s,i)=><div className="task-row" key={s}><span className="task-number">0{i+1}</span><b>{s}</b><span className="task-tag">{i===0?'Technical':'Growth'}</span></div>)}</section></div>{role==='student'&&<div className="panel"><h3>Your cohort benchmark</h3><p className="muted">Your individual assessment records can be reviewed with faculty. Detailed skill evidence and certification uploads are stored in the student profile.</p></div>}</>}
function Analytics({students}:{students:Student[]}){const avg=students.length?students.reduce((a,s)=>a+Number(s.cgpa),0)/students.length:0;return <><div className="section-intro"><h2>Institution analytics</h2><p>Live summary calculated from the current student dataset.</p></div><div className="stats-grid"><StatCard label="Students tracked" value={students.length} detail="Rows visible to your role" icon={<Users/>}/><StatCard label="Mean CGPA" value={avg.toFixed(2)} detail="Current cohort average" icon={<GraduationCap/>}/><StatCard label="Mean attendance" value={`${students.length?(students.reduce((a,s)=>a+Number(s.attendance_pct),0)/students.length).toFixed(1):'0.0'}%`} detail="Current cohort average" icon={<CalendarDays/>}/><StatCard label="Mean coding score" value={students.length?(students.reduce((a,s)=>a+Number(s.coding_score),0)/students.length).toFixed(1):'0.0'} detail="Current cohort average" icon={<Code2/>}/></div><div className="panel"><h3>Readiness by student</h3><div className="chart-area tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={students.slice(0,18).map(s=>({name:s.roll_no,score:s.readiness_score}))}><CartesianGrid stroke="#edf1f8" vertical={false}/><XAxis dataKey="name" axisLine={false} tickLine={false}/><YAxis domain={[0,100]} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="score" fill="#315efb" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></div></>}
function SettingsPanel({profile}:{profile:Profile}){return <div className="panel settings-panel"><div className="panel-head"><div><h3>Account & access</h3><p>Identity and permission information</p></div><ShieldCheck className="brand-text"/></div><div className="setting-row"><span>Name</span><b>{profile.full_name}</b></div><div className="setting-row"><span>Role</span><b>{profile.role.replace('_',' ')}</b></div><div className="setting-row"><span>Department</span><b>{profile.department??'Not assigned'}</b></div><p className="tiny muted">This demonstration uses sample data in your browser. A production deployment should connect a shared database and enforce role permissions on the server.</p></div>}
