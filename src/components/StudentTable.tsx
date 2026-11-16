import { Search } from 'lucide-react'
import type { Student } from '../lib/supabase'
export default function StudentTable({students,query,onQuery}:{students:Student[];query:string;onQuery:(v:string)=>void}) {
 return <section className="panel"><div className="panel-head"><div><h3>Student directory</h3><p>Live academic and placement readiness records</p></div><div className="searchbox"><Search size={16}/><input value={query} onChange={e=>onQuery(e.target.value)} placeholder="Search students"/></div></div>
 <div className="table-wrap"><table><thead><tr><th>Student</th><th>Department</th><th>CGPA</th><th>Attendance</th><th>Coding</th><th>Readiness</th><th>Status</th></tr></thead><tbody>
 {students.map(s=><tr key={s.id}><td><div className="student-name"><span className="avatar">{s.full_name.split(' ').map(x=>x[0]).slice(0,2).join('')}</span><span><b>{s.full_name}</b><small>{s.roll_no}</small></span></div></td><td>{s.department}</td><td>{Number(s.cgpa).toFixed(2)}</td><td>{Number(s.attendance_pct).toFixed(0)}%</td><td>{s.coding_score}</td><td><div className="readiness"><div className="progress"><i style={{width:`${s.readiness_score}%`}}/></div><b>{s.readiness_score}%</b></div></td><td><span className={`status ${s.placement_status==='Placed'?'green':s.placement_status==='At risk'?'amber':'blue'}`}>{s.placement_status}</span></td></tr>)}
 {students.length===0&&<tr><td colSpan={7} className="empty">No matching student records.</td></tr>}
 </tbody></table></div></section>
}