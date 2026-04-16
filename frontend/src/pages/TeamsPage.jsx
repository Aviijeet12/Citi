import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users2, Plus, Search, Edit2, Trash2, X, Check, AlertCircle,
  Loader2, MapPin, User, UserPlus, ChevronDown, ChevronUp
} from "lucide-react";
import { useAuth, PERMISSIONS } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const INITIAL_TEAMS = [
  { id: "t1", name: "Alpha Squad", leader: "Jordan Pierce", department: "Engineering", location: "New York", members: 9, memberList: ["Jordan Pierce","Alex Kim","Sam Lee","Dana White","Chris Brown","Pat Jones","Morgan Chen","Taylor Swift","Casey Young"], description:"Core platform engineering team", status:"active", created:"2024-01-10" },
  { id: "t2", name: "Beta Force", leader: "Maria Chen", department: "Product", location: "San Francisco", members: 12, memberList: ["Maria Chen","John Smith","Amy Liu","Bob Davis","Carol Wilson","Dan Martinez","Eve Thompson","Frank Harris","Grace Miller","Henry Ford","Ida Black","Jack Green"], description:"Product strategy and roadmap team", status:"active", created:"2024-01-15" },
  { id: "t3", name: "Gamma Unit", leader: "Casey Morgan", department: "Operations", location: "Chicago", members: 7, memberList: ["Casey Morgan","Leo Zhang","Nina Park","Oscar Gomez","Paula Reed","Quinn Baker","Rita Hall"], description:"Operations and process optimization", status:"active", created:"2024-02-01" },
  { id: "t4", name: "Delta Core", leader: "Riley Zhao", department: "Finance", location: "Houston", members: 11, memberList: ["Riley Zhao","Sam Turner","Tara Evans","Uma Singh","Vera Adams","Walt Clark","Xena Lewis","Yuri Cohen","Zoe Walker","Aaron Hill","Bella Scott"], description:"Financial analysis and compliance", status:"active", created:"2024-02-10" },
  { id: "t5", name: "Epsilon Lab", leader: "Max Johnson", department: "Research", location: "Boston", members: 6, memberList: ["Max Johnson","Nora Adams","Omar Hassan","Penny Lane","Quincy Bell","Rose Tyler"], description:"Research and innovation lab", status:"inactive", created:"2024-03-01" },
];

const EMPTY_FORM = { name:"", leader:"", department:"", location:"", description:"", status:"active" };

function TeamModal({ team, onSave, onClose }) {
  const [form, setForm] = useState(team ? { name:team.name, leader:team.leader, department:team.department, location:team.location, description:team.description, status:team.status } : { ...EMPTY_FORM });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Team name required";
    if (!form.leader.trim()) e.leader = "Leader name required";
    if (!form.department.trim()) e.department = "Department required";
    if (!form.location.trim()) e.location = "Location required";
    return e;
  };

  const f = (field) => (ev) => { setForm(p => ({ ...p, [field]: ev.target.value })); setErrors(p => { const n={...p}; delete n[field]; return n; }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onSave({ ...form, id: team?.id || crypto.randomUUID(), members: team?.members || 0, memberList: team?.memberList || [], created: team?.created || new Date().toISOString().split("T")[0] });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal-content" initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}>
        <div className="modal-header">
          <h3>{team ? "Edit Team" : "New Team"}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Team Name <span className="required">*</span></label>
              <input className="form-input" placeholder="e.g. Alpha Squad" value={form.name} onChange={f("name")}/>
              {errors.name && <p className="form-error"><AlertCircle size={12}/>{errors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Team Leader <span className="required">*</span></label>
              <input className="form-input" placeholder="Leader full name" value={form.leader} onChange={f("leader")}/>
              {errors.leader && <p className="form-error"><AlertCircle size={12}/>{errors.leader}</p>}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Department <span className="required">*</span></label>
                <input className="form-input" placeholder="e.g. Engineering" value={form.department} onChange={f("department")}/>
                {errors.department && <p className="form-error"><AlertCircle size={12}/>{errors.department}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Location <span className="required">*</span></label>
                <input className="form-input" placeholder="e.g. New York" value={form.location} onChange={f("location")}/>
                {errors.location && <p className="form-error"><AlertCircle size={12}/>{errors.location}</p>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={2} placeholder="Team purpose…" value={form.description} onChange={f("description")} style={{resize:"vertical"}}/>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={f("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="btn-team-save">
              {loading ? <Loader2 size={15} style={{animation:"spin 0.8s linear infinite"}}/> : <Check size={15}/>}
              {loading ? "Saving…" : team ? "Update Team" : "Create Team"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function TeamCard({ team, canWrite, canDelete, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div className="glass-card" layout>
      <div style={{padding:"20px 24px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <div style={{width:36,height:36,borderRadius:"var(--radius-sm)",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:14}}>
                {team.name[0]}
              </div>
              <div>
                <h3 style={{fontSize:15,fontWeight:700,color:"var(--color-text-primary)",lineHeight:1}}>{team.name}</h3>
                <p style={{fontSize:11,color:"var(--color-text-muted)"}}>{team.department}</p>
              </div>
              <span className={`tag ${team.status==="active"?"tag-success":"tag-default"}`} style={{marginLeft:"auto"}}>{team.status}</span>
            </div>
            <p style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:10}}>{team.description}</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:12,fontSize:12,color:"var(--color-text-muted)"}}>
              <span style={{display:"flex",alignItems:"center",gap:4}}><User size={12}/>{team.leader}</span>
              <span style={{display:"flex",alignItems:"center",gap:4}}><MapPin size={12}/>{team.location}</span>
              <span style={{display:"flex",alignItems:"center",gap:4}}><Users2 size={12}/>{team.members} members</span>
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            {canWrite && <button className="btn btn-ghost btn-icon" onClick={() => onEdit(team)} title="Edit"><Edit2 size={14}/></button>}
            {canDelete && <button className="btn btn-danger btn-icon" onClick={() => onDelete(team)} title="Delete"><Trash2 size={14}/></button>}
            <button className="btn btn-ghost btn-icon" onClick={() => setExpanded(v=>!v)}>
              {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden"}}>
              <div style={{borderTop:"1px solid var(--color-border)",marginTop:16,paddingTop:16}}>
                <p style={{fontSize:11,fontWeight:600,color:"var(--color-text-muted)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Team Members</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {team.memberList.map(m => (
                    <span key={m} style={{padding:"4px 10px",borderRadius:"var(--radius-full)",background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.15)",fontSize:12,color:"var(--color-text-secondary)"}}>
                      {m}
                    </span>
                  ))}
                  {canWrite && (
                    <button className="btn btn-ghost btn-sm" style={{borderStyle:"dashed"}}>
                      <UserPlus size={12}/> Add
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function TeamsPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.TEAMS_WRITE);
  const canDelete = hasPermission(PERMISSIONS.TEAMS_DELETE);

  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const showNotif = useToast();

  const filtered = useMemo(() => teams.filter(t => {
    const q = search.toLowerCase();
    return !q || t.name.toLowerCase().includes(q) || t.leader.toLowerCase().includes(q) || t.department.toLowerCase().includes(q) || t.location.toLowerCase().includes(q);
  }), [teams, search]);

  const handleSave = useCallback(data => {
    setTeams(prev => {
      const idx = prev.findIndex(t => t.id === data.id);
      if (idx >= 0) { const n=[...prev]; n[idx]=data; return n; }
      return [...prev, data];
    });
    setModal(null);
    showNotif(data.id && teams.find(t=>t.id===data.id) ? "Team updated" : "Team created");
  },[teams,showNotif]);

  const handleDelete = useCallback(id => {
    setTeams(prev => prev.filter(t => t.id !== id));
    setDeleteTarget(null);
    showNotif("Team deleted","error");
  },[showNotif]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Teams</h1>
          <p>Manage team structures, leaders, and member assignments</p>
        </div>
        <div className="page-header-right">
          {canWrite && (
            <button className="btn btn-primary" onClick={() => setModal("add")} id="btn-add-team">
              <Plus size={16}/> New Team
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        {[
          {label:"Total Teams",value:teams.length,color:"#6366f1"},
          {label:"Active",value:teams.filter(t=>t.status==="active").length,color:"#10b981"},
          {label:"Total Members",value:teams.reduce((s,t)=>s+t.members,0),color:"#8b5cf6"},
          {label:"Departments",value:new Set(teams.map(t=>t.department)).size,color:"#06b6d4"},
        ].map((s,i) => (
          <motion.div key={s.label} className="metric-card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}>
            <div className="metric-value" style={{color:s.color}}>{s.value}</div>
            <div className="metric-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="search-bar" style={{marginBottom:20}}>
        <div className="search-input-wrapper" style={{maxWidth:400}}>
          <Search size={16} className="search-icon"/>
          <input className="form-input" placeholder="Search teams…" value={search} onChange={e=>setSearch(e.target.value)} id="input-team-search"/>
        </div>
      </div>

      {/* Teams Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(420px,1fr))",gap:20}}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{gridColumn:"1/-1"}}>
            <div className="empty-state-icon"><Users2 size={28}/></div>
            <h3>No teams found</h3>
            <p>Try adjusting your search or create a new team</p>
          </div>
        ) : filtered.map(t => (
          <TeamCard key={t.id} team={t} canWrite={canWrite} canDelete={canDelete} onEdit={setModal} onDelete={setDeleteTarget}/>
        ))}
      </div>

      <AnimatePresence>
        {modal && <TeamModal team={modal==="add"?null:modal} onSave={handleSave} onClose={()=>setModal(null)}/>}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <div className="modal-overlay">
            <motion.div className="modal-content" style={{maxWidth:400}} initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}>
              <div className="modal-header"><h3>Delete Team?</h3><button className="btn btn-ghost btn-icon" onClick={()=>setDeleteTarget(null)}><X size={18}/></button></div>
              <div className="modal-body">
                <div className="alert alert-error">
                  <AlertCircle size={16} style={{flexShrink:0}}/>
                  <span>Delete team <strong>{deleteTarget.name}</strong>? This will also remove all member assignments.</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={()=>setDeleteTarget(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={()=>handleDelete(deleteTarget.id)} id="btn-confirm-delete-team"><Trash2 size={14}/> Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
