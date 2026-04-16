import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Plus, Search, Edit2, Trash2, X, Check, AlertCircle,
  Loader2, Calendar, Users2, Star, Award, Target
} from "lucide-react";
import { useAuth, PERMISSIONS } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { achievementsApi } from "../services/workshopApi";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CATEGORIES = ["Revenue","Customer","Innovation","Operational","People","Compliance","Technology","Strategy"];

const INITIAL_ACHIEVEMENTS = [
  { id:"a1", title:"Q1 Revenue Target", team:"Alpha Squad", month:"March", year:2024, category:"Revenue", description:"Exceeded Q1 revenue target by 18% through cross-functional collaboration.", status:"completed", score:94, owner:"Jordan Pierce" },
  { id:"a2", title:"Platform Migration", team:"Beta Force", month:"March", year:2024, category:"Technology", description:"Successfully migrated 200+ microservices to new cloud infrastructure with zero downtime.", status:"completed", score:98, owner:"Maria Chen" },
  { id:"a3", title:"Customer NPS +15", team:"Gamma Unit", month:"February", year:2024, category:"Customer", description:"Improved NPS from 32 to 47 through targeted CX initiatives.", status:"completed", score:88, owner:"Casey Morgan" },
  { id:"a4", title:"Cost Reduction 12%", team:"Delta Core", month:"March", year:2024, category:"Operational", description:"Reduced operational costs by 12% in Q1 via process automation.", status:"in-progress", score:75, owner:"Riley Zhao" },
  { id:"a5", title:"AI Innovation Award", team:"Epsilon Lab", month:"January", year:2024, category:"Innovation", description:"Built internal AI tool that saves 240hrs/month for the operations team.", status:"completed", score:96, owner:"Max Johnson" },
  { id:"a6", title:"Zero Incident Month", team:"Alpha Squad", month:"February", year:2024, category:"Operational", description:"Achieved full month of zero production incidents.", status:"completed", score:100, owner:"Jordan Pierce" },
  { id:"a7", title:"Compliance Training", team:"Delta Core", month:"January", year:2024, category:"Compliance", description:"100% team completion of mandatory compliance modules ahead of schedule.", status:"completed", score:82, owner:"Riley Zhao" },
  { id:"a8", title:"Hiring Surge +20", team:"Beta Force", month:"March", year:2024, category:"People", description:"Hired 20 senior engineers in 45 days, 30% under recruitment budget.", status:"in-progress", score:60, owner:"Maria Chen" },
];

const EMPTY_FORM = { title:"", team:"", month:"January", year:new Date().getFullYear(), category:"Revenue", description:"", status:"in-progress", score:"", owner:"" };

const STATUS_TAG = { completed:"tag-success", "in-progress":"tag-info", cancelled:"tag-danger" };

function AchievementModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ? { title:item.title, team:item.team, month:item.month, year:item.year, category:item.category, description:item.description, status:item.status, score:String(item.score), owner:item.owner } : {...EMPTY_FORM});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title required";
    if (!form.team.trim()) e.team = "Team required";
    if (!form.owner.trim()) e.owner = "Owner required";
    const sc = Number(form.score);
    if (form.score && (isNaN(sc) || sc<0 || sc>100)) e.score = "Score must be 0-100";
    return e;
  };

  const f = (field) => (ev) => { setForm(p=>({...p,[field]:ev.target.value})); setErrors(p=>{const n={...p};delete n[field];return n;}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length){setErrors(errs);return;}
    setLoading(true);
    await new Promise(r=>setTimeout(r,600));
    onSave({...form, id:item?.id||crypto.randomUUID(), score:Number(form.score)||0});
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div className="modal-content" style={{maxWidth:600}} initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}>
        <div className="modal-header">
          <h3>{item?"Edit Achievement":"Log Achievement"}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title <span className="required">*</span></label>
              <input className="form-input" placeholder="Achievement title" value={form.title} onChange={f("title")}/>
              {errors.title&&<p className="form-error"><AlertCircle size={12}/>{errors.title}</p>}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Team <span className="required">*</span></label>
                <input className="form-input" placeholder="Team name" value={form.team} onChange={f("team")}/>
                {errors.team&&<p className="form-error"><AlertCircle size={12}/>{errors.team}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Owner <span className="required">*</span></label>
                <input className="form-input" placeholder="Responsible person" value={form.owner} onChange={f("owner")}/>
                {errors.owner&&<p className="form-error"><AlertCircle size={12}/>{errors.owner}</p>}
              </div>
            </div>
            <div className="form-grid" style={{gridTemplateColumns:"1fr 1fr 1fr 1fr"}}>
              <div className="form-group">
                <label className="form-label">Month</label>
                <select className="form-select" value={form.month} onChange={f("month")}>
                  {MONTHS.map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="form-input" type="number" value={form.year} onChange={f("year")} min={2020} max={2030}/>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={f("category")}>
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Score (0-100)</label>
                <input className="form-input" type="number" min={0} max={100} placeholder="e.g. 85" value={form.score} onChange={f("score")}/>
                {errors.score&&<p className="form-error"><AlertCircle size={12}/>{errors.score}</p>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={f("status")}>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={3} placeholder="Describe the achievement…" value={form.description} onChange={f("description")} style={{resize:"vertical"}}/>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="btn-achievement-save">
              {loading?<Loader2 size={15} style={{animation:"spin 0.8s linear infinite"}}/>:<Check size={15}/>}
              {loading?"Saving…":item?"Update":"Log Achievement"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function AchievementsPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.ACHIEVEMENTS_WRITE);
  const canDelete = hasPermission(PERMISSIONS.ACHIEVEMENTS_DELETE);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const showNotif = useToast();

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const data = await achievementsApi.list();
      const items = data?.items || data || [];
      setItems(Array.isArray(items) && items.length > 0 ? items : INITIAL_ACHIEVEMENTS);
    } catch (err) {
      setItems(INITIAL_ACHIEVEMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const filtered = useMemo(()=>items.filter(a=>{
    const q=search.toLowerCase();
    const matchQ=!q||a.title.toLowerCase().includes(q)||a.team.toLowerCase().includes(q)||a.owner.toLowerCase().includes(q);
    const matchM=monthFilter==="all"||a.month===monthFilter;
    const matchC=categoryFilter==="all"||a.category===categoryFilter;
    return matchQ&&matchM&&matchC;
  }),[items,search,monthFilter,categoryFilter]);

  const handleSave = useCallback(data=>{
    setItems(prev=>{
      const idx=prev.findIndex(a=>a.id===data.id);
      if(idx>=0){const n=[...prev];n[idx]=data;return n;}
      return [...prev,data];
    });
    setModal(null);
    showNotif("Achievement saved");
    fetchAchievements();
  },[showNotif]);

  const handleDelete = useCallback(id=>{
    setItems(prev=>prev.filter(a=>a.id!==id));
    setDeleteTarget(null);
    showNotif("Achievement deleted","error");
    fetchAchievements();
  },[showNotif]);

  const stats = useMemo(()=>({
    total:items.length,
    completed:items.filter(a=>a.status==="completed").length,
    avgScore:Math.round(items.reduce((s,a)=>s+a.score,0)/items.length)||0,
    thisMonth:items.filter(a=>a.month===MONTHS[new Date().getMonth()]).length,
  }),[items]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Achievements</h1>
          <p>Track and manage monthly team achievements across all departments</p>
        </div>
        <div className="page-header-right">
          {canWrite&&<button className="btn btn-primary" onClick={()=>setModal("add")} id="btn-add-achievement"><Plus size={16}/> Log Achievement</button>}
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        {[
          {label:"Total Logged",value:stats.total,color:"#6366f1",icon:<Trophy size={18}/>},
          {label:"Completed",value:stats.completed,color:"#10b981",icon:<Check size={18}/>},
          {label:"Avg Score",value:`${stats.avgScore}%`,color:"#f59e0b",icon:<Star size={18}/>},
          {label:"This Month",value:stats.thisMonth,color:"#8b5cf6",icon:<Calendar size={18}/>},
        ].map((s,i)=>(
          <motion.div key={s.label} className="metric-card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}>
            <div className="metric-icon" style={{background:`${s.color}18`}}><span style={{color:s.color}}>{s.icon}</span></div>
            <div className="metric-value">{s.value}</div>
            <div className="metric-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="search-bar" style={{marginBottom:20}}>
        <div className="search-input-wrapper" style={{maxWidth:300}}>
          <Search size={16} className="search-icon"/>
          <input className="form-input" placeholder="Search achievements…" value={search} onChange={e=>setSearch(e.target.value)} id="input-achievement-search"/>
        </div>
        <select className="form-select" style={{width:150}} value={monthFilter} onChange={e=>setMonthFilter(e.target.value)}>
          <option value="all">All Months</option>
          {MONTHS.map(m=><option key={m}>{m}</option>)}
        </select>
        <select className="form-select" style={{width:160}} value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <motion.div className="glass-card" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
        <div className="card-header">
          <div className="card-title"><h2>Achievement Log</h2><p>{filtered.length} records</p></div>
        </div>
        <div className="table-container" style={{padding:"0 24px 24px"}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Achievement</th>
                <th>Team</th>
                <th>Period</th>
                <th>Category</th>
                <th>Score</th>
                <th>Status</th>
                {(canWrite||canDelete)&&<th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0?(
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Trophy size={28}/></div>
                    <h3>No achievements found</h3>
                    <p>Try adjusting the filters</p>
                  </div>
                </td></tr>
              ):filtered.map(a=>(
                <tr key={a.id}>
                  <td>
                    <div>
                      <p style={{fontWeight:600,color:"var(--color-text-primary)",fontSize:13}}>{a.title}</p>
                      <p style={{fontSize:11,color:"var(--color-text-muted)"}}>by {a.owner}</p>
                    </div>
                  </td>
                  <td style={{fontSize:13}}>
                    <span style={{display:"flex",alignItems:"center",gap:6}}><Users2 size={12}/>{a.team}</span>
                  </td>
                  <td style={{fontSize:13}}>{a.month} {a.year}</td>
                  <td><span className="tag tag-info">{a.category}</span></td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:8,minWidth:80}}>
                      <div style={{flex:1}}>
                        <div className="progress-bar"><div className="progress-fill" style={{width:`${a.score}%`}}/></div>
                      </div>
                      <span style={{fontSize:12,fontWeight:700,color:"var(--color-text-primary)",width:28}}>{a.score}</span>
                    </div>
                  </td>
                  <td><span className={`tag ${STATUS_TAG[a.status]||"tag-default"}`}>{a.status}</span></td>
                  {(canWrite||canDelete)&&(
                    <td>
                      <div style={{display:"flex",gap:6}}>
                        {canWrite&&<button className="btn btn-ghost btn-icon" onClick={()=>setModal(a)} title="Edit"><Edit2 size={14}/></button>}
                        {canDelete&&<button className="btn btn-danger btn-icon" onClick={()=>setDeleteTarget(a)} title="Delete"><Trash2 size={14}/></button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {modal&&<AchievementModal item={modal==="add"?null:modal} onSave={handleSave} onClose={()=>setModal(null)}/>}
      </AnimatePresence>
      <AnimatePresence>
        {deleteTarget&&(
          <div className="modal-overlay">
            <motion.div className="modal-content" style={{maxWidth:400}} initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}>
              <div className="modal-header"><h3>Delete Achievement?</h3><button className="btn btn-ghost btn-icon" onClick={()=>setDeleteTarget(null)}><X size={18}/></button></div>
              <div className="modal-body"><div className="alert alert-error"><AlertCircle size={16} style={{flexShrink:0}}/><span>Delete <strong>{deleteTarget.title}</strong>? This cannot be undone.</span></div></div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={()=>setDeleteTarget(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={()=>handleDelete(deleteTarget.id)} id="btn-confirm-delete-achievement"><Trash2 size={14}/>Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
