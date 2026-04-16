import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Plus, Search, Edit2, Trash2, X, Check, AlertCircle, Loader2, Database, Hash, FileText } from "lucide-react";
import { useAuth, PERMISSIONS } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { metadataApi } from "../services/workshopApi";

const INITIAL_DEFS = [
  { id:"md1", key:"team_size_limit", type:"integer", description:"Maximum number of members allowed in a team", required:true, defaultValue:"15", scope:"team" },
  { id:"md2", key:"performance_cycle", type:"string", description:"Performance review cycle frequency", required:true, defaultValue:"quarterly", scope:"global" },
  { id:"md3", key:"cost_center", type:"string", description:"Financial cost center code for the entity", required:false, defaultValue:"", scope:"team" },
  { id:"md4", key:"is_remote_eligible", type:"boolean", description:"Whether the team/user is eligible for remote work", required:false, defaultValue:"false", scope:"user" },
  { id:"md5", key:"skill_matrix_version", type:"string", description:"Version of skill matrix assessment applied", required:false, defaultValue:"v2.1", scope:"global" },
  { id:"md6", key:"budget_limit_usd", type:"number", description:"Annual budget ceiling in USD", required:false, defaultValue:"100000", scope:"team" },
];

const INITIAL_VALUES = [
  { id:"mv1", defKey:"team_size_limit", entity:"Alpha Squad", entityType:"team", value:"12", updatedBy:"Maria Manager", updatedAt:"2024-03-15" },
  { id:"mv2", defKey:"cost_center", entity:"Alpha Squad", entityType:"team", value:"CC-1042", updatedBy:"Maria Manager", updatedAt:"2024-03-15" },
  { id:"mv3", defKey:"performance_cycle", entity:"global", entityType:"global", value:"quarterly", updatedBy:"Alex Admin", updatedAt:"2024-01-01" },
  { id:"mv4", defKey:"is_remote_eligible", entity:"Chris Contrib", entityType:"user", value:"true", updatedBy:"Alex Admin", updatedAt:"2024-02-20" },
  { id:"mv5", defKey:"budget_limit_usd", entity:"Beta Force", entityType:"team", value:"250000", updatedBy:"Maria Chen", updatedAt:"2024-02-28" },
  { id:"mv6", defKey:"skill_matrix_version", entity:"global", entityType:"global", value:"v2.3", updatedBy:"Alex Admin", updatedAt:"2024-03-01" },
];

const TYPE_TAG = { integer:"tag-info", string:"tag-default", boolean:"tag-warning", number:"tag-success" };
const SCOPE_TAG = { team:"tag-info", user:"tag-success", global:"tag-warning" };

function DefModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ? { key:item.key, type:item.type, description:item.description, required:item.required, defaultValue:item.defaultValue, scope:item.scope } : { key:"", type:"string", description:"", required:false, defaultValue:"", scope:"global" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const f = (field) => (ev) => { setForm(p=>({...p,[field]:ev.target.type==="checkbox"?ev.target.checked:ev.target.value})); setErrors(p=>{const n={...p};delete n[field];return n;}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.key.trim()) errs.key = "Key required";
    if (!/^[a-z_][a-z0-9_]*$/.test(form.key)) errs.key = "Key must be snake_case";
    if (!form.description.trim()) errs.description = "Description required";
    if (Object.keys(errs).length){setErrors(errs);return;}
    setLoading(true);
    await new Promise(r=>setTimeout(r,600));
    onSave({...form,id:item?.id||crypto.randomUUID()});
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div className="modal-content" initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}>
        <div className="modal-header">
          <h3>{item?"Edit Definition":"Add Metadata Key"}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Key <span className="required">*</span></label>
              <div style={{position:"relative"}}>
                <Hash size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--color-text-muted)"}}/>
                <input className="form-input" style={{paddingLeft:34}} placeholder="snake_case_key" value={form.key} onChange={f("key")} disabled={!!item}/>
              </div>
              {errors.key&&<p className="form-error"><AlertCircle size={12}/>{errors.key}</p>}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={f("type")}>
                  {["string","integer","number","boolean"].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Scope</label>
                <select className="form-select" value={form.scope} onChange={f("scope")}>
                  <option value="global">Global</option>
                  <option value="team">Team</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description <span className="required">*</span></label>
              <textarea className="form-textarea" rows={2} placeholder="What does this key represent?" value={form.description} onChange={f("description")} style={{resize:"vertical"}}/>
              {errors.description&&<p className="form-error"><AlertCircle size={12}/>{errors.description}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Default Value</label>
              <input className="form-input" placeholder="Optional default" value={form.defaultValue} onChange={f("defaultValue")}/>
            </div>
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:14}}>
              <input type="checkbox" checked={form.required} onChange={f("required")} style={{width:16,height:16,accentColor:"var(--color-accent-primary)"}}/>
              <span style={{color:"var(--color-text-secondary)"}}>This field is required when applying</span>
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="btn-def-save">
              {loading?<Loader2 size={15} style={{animation:"spin 0.8s linear infinite"}}/>:<Check size={15}/>}
              {loading?"Saving…":item?"Update":"Add Key"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ValueModal({ defs, item, onSave, onClose }) {
  const [form, setForm] = useState(item ? { defKey:item.defKey, entity:item.entity, entityType:item.entityType, value:item.value } : { defKey:defs[0]?.key||"", entity:"", entityType:"team", value:"" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const f = (field) => (ev) => { setForm(p=>({...p,[field]:ev.target.value})); setErrors(p=>{const n={...p};delete n[field];return n;}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.entity.trim()) errs.entity = "Entity required";
    if (!form.value.trim()) errs.value = "Value required";
    if (Object.keys(errs).length){setErrors(errs);return;}
    setLoading(true);
    await new Promise(r=>setTimeout(r,600));
    onSave({...form, id:item?.id||crypto.randomUUID(), updatedBy:"Current User", updatedAt:new Date().toISOString().split("T")[0]});
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div className="modal-content" initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}>
        <div className="modal-header">
          <h3>{item?"Edit Value":"Set Metadata Value"}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Metadata Key</label>
              <select className="form-select" value={form.defKey} onChange={f("defKey")} disabled={!!item}>
                {defs.map(d=><option key={d.key} value={d.key}>{d.key}</option>)}
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Entity <span className="required">*</span></label>
                <input className="form-input" placeholder="Team/user name or 'global'" value={form.entity} onChange={f("entity")}/>
                {errors.entity&&<p className="form-error"><AlertCircle size={12}/>{errors.entity}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Entity Type</label>
                <select className="form-select" value={form.entityType} onChange={f("entityType")}>
                  <option value="team">Team</option>
                  <option value="user">User</option>
                  <option value="global">Global</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Value <span className="required">*</span></label>
              <input className="form-input" placeholder="Value for this entity" value={form.value} onChange={f("value")}/>
              {errors.value&&<p className="form-error"><AlertCircle size={12}/>{errors.value}</p>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="btn-value-save">
              {loading?<Loader2 size={15} style={{animation:"spin 0.8s linear infinite"}}/>:<Check size={15}/>}
              {loading?"Saving…":item?"Update":"Set Value"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function MetadataPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.METADATA_WRITE);
  const canDelete = hasPermission(PERMISSIONS.METADATA_DELETE);

  const [activeTab, setActiveTab] = useState("definitions");
  const [defs, setDefs] = useState([]);
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // {type:"def"|"val", item:...}
  const [deleteTarget, setDeleteTarget] = useState(null);
  const showNotif = useToast();

  const fetchMetadata = async () => {
    try {
      setLoading(true);
      const [defsData, valsData] = await Promise.all([
        metadataApi.listDefinitions(),
        metadataApi.listValues()
      ]);
      
      const defItems = defsData?.items || defsData || [];
      const valItems = valsData?.items || valsData || [];
      
      setDefs(Array.isArray(defItems) && defItems.length > 0 ? defItems : INITIAL_DEFS);
      setValues(Array.isArray(valItems) && valItems.length > 0 ? valItems : INITIAL_VALUES);
    } catch (err) {
      setDefs(INITIAL_DEFS);
      setValues(INITIAL_VALUES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  const filteredDefs = useMemo(()=>defs.filter(d=>{
    const q=search.toLowerCase();
    return !q||d.key.toLowerCase().includes(q)||d.description.toLowerCase().includes(q);
  }),[defs,search]);

  const filteredVals = useMemo(()=>values.filter(v=>{
    const q=search.toLowerCase();
    return !q||v.defKey.toLowerCase().includes(q)||v.entity.toLowerCase().includes(q)||v.value.toLowerCase().includes(q);
  }),[values,search]);

  const handleSaveDef = useCallback(data=>{
    setDefs(prev=>{const idx=prev.findIndex(d=>d.id===data.id);if(idx>=0){const n=[...prev];n[idx]=data;return n;}return [...prev,data];});
    setModal(null);showNotif("Definition saved");
    fetchMetadata();
  },[showNotif]);

  const handleSaveVal = useCallback(data=>{
    setValues(prev=>{const idx=prev.findIndex(v=>v.id===data.id);if(idx>=0){const n=[...prev];n[idx]=data;return n;}return [...prev,data];});
    setModal(null);showNotif("Value saved");
    fetchMetadata();
  },[showNotif]);

  const handleDelete = useCallback(()=>{
    if(deleteTarget.defType==="def") setDefs(prev=>prev.filter(d=>d.id!==deleteTarget.id));
    else setValues(prev=>prev.filter(v=>v.id!==deleteTarget.id));
    setDeleteTarget(null);showNotif("Record deleted","error");
  },[deleteTarget,showNotif]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Metadata</h1>
          <p>Manage metadata schema definitions and entity-level value assignments</p>
        </div>
        <div className="page-header-right">
          {canWrite&&activeTab==="definitions"&&<button className="btn btn-primary" onClick={()=>setModal({type:"def",item:null})} id="btn-add-def"><Plus size={16}/> Add Key</button>}
          {canWrite&&activeTab==="values"&&<button className="btn btn-primary" onClick={()=>setModal({type:"val",item:null})} id="btn-add-val"><Plus size={16}/> Set Value</button>}
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        {[
          {label:"Schema Keys",value:defs.length,color:"#6366f1"},
          {label:"Required Keys",value:defs.filter(d=>d.required).length,color:"#f43f5e"},
          {label:"Values Set",value:values.length,color:"#10b981"},
          {label:"Global Scope",value:defs.filter(d=>d.scope==="global").length,color:"#06b6d4"},
        ].map((s,i)=>(
          <motion.div key={s.label} className="metric-card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}>
            <div className="metric-value" style={{color:s.color}}>{s.value}</div>
            <div className="metric-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs & Search */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <div className="tabs" style={{marginBottom:0}}>
          <button className={`tab ${activeTab==="definitions"?"active":""}`} onClick={()=>{setActiveTab("definitions");setSearch("");}}>Schema Definitions</button>
          <button className={`tab ${activeTab==="values"?"active":""}`} onClick={()=>{setActiveTab("values");setSearch("");}}>Entity Values</button>
        </div>
        <div className="search-input-wrapper" style={{maxWidth:280}}>
          <Search size={16} className="search-icon"/>
          <input className="form-input" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} id="input-meta-search"/>
        </div>
      </div>

      {/* Definitions Table */}
      {activeTab==="definitions"&&(
        <motion.div className="glass-card" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <div className="card-header">
            <div className="card-title"><h2>Schema Definitions</h2><p>{filteredDefs.length} keys defined</p></div>
          </div>
          <div className="table-container" style={{padding:"0 24px 24px"}}>
            <table className="data-table">
              <thead><tr><th>Key</th><th>Type</th><th>Scope</th><th>Required</th><th>Default</th><th>Description</th>{(canWrite||canDelete)&&<th>Actions</th>}</tr></thead>
              <tbody>
                {filteredDefs.length===0?(
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon"><Tag size={28}/></div><h3>No definitions</h3></div></td></tr>
                ):filteredDefs.map(d=>(
                  <tr key={d.id}>
                    <td><code style={{fontSize:12,color:"var(--color-accent-cyan)",background:"rgba(6,182,212,0.08)",padding:"2px 8px",borderRadius:4}}>{d.key}</code></td>
                    <td><span className={`tag ${TYPE_TAG[d.type]||"tag-default"}`}>{d.type}</span></td>
                    <td><span className={`tag ${SCOPE_TAG[d.scope]||"tag-default"}`}>{d.scope}</span></td>
                    <td>{d.required?<span className="tag tag-danger">Yes</span>:<span className="tag tag-default">No</span>}</td>
                    <td style={{fontSize:12,color:"var(--color-text-muted)"}}>{d.defaultValue||"—"}</td>
                    <td style={{fontSize:13,maxWidth:240}}><span className="truncate" style={{display:"block"}}>{d.description}</span></td>
                    {(canWrite||canDelete)&&(
                      <td><div style={{display:"flex",gap:6}}>
                        {canWrite&&<button className="btn btn-ghost btn-icon" onClick={()=>setModal({type:"def",item:d})} title="Edit"><Edit2 size={14}/></button>}
                        {canDelete&&<button className="btn btn-danger btn-icon" onClick={()=>setDeleteTarget({...d,defType:"def"})} title="Delete"><Trash2 size={14}/></button>}
                      </div></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Values Table */}
      {activeTab==="values"&&(
        <motion.div className="glass-card" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <div className="card-header">
            <div className="card-title"><h2>Entity Values</h2><p>{filteredVals.length} values set</p></div>
          </div>
          <div className="table-container" style={{padding:"0 24px 24px"}}>
            <table className="data-table">
              <thead><tr><th>Key</th><th>Entity</th><th>Type</th><th>Value</th><th>Updated By</th><th>Date</th>{(canWrite||canDelete)&&<th>Actions</th>}</tr></thead>
              <tbody>
                {filteredVals.length===0?(
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon"><Database size={28}/></div><h3>No values set</h3></div></td></tr>
                ):filteredVals.map(v=>(
                  <tr key={v.id}>
                    <td><code style={{fontSize:12,color:"var(--color-accent-cyan)",background:"rgba(6,182,212,0.08)",padding:"2px 8px",borderRadius:4}}>{v.defKey}</code></td>
                    <td style={{fontSize:13,fontWeight:500}}>{v.entity}</td>
                    <td><span className={`tag ${SCOPE_TAG[v.entityType]||"tag-default"}`}>{v.entityType}</span></td>
                    <td style={{fontSize:13,color:"var(--color-text-primary)",fontWeight:600}}>{v.value}</td>
                    <td style={{fontSize:12,color:"var(--color-text-muted)"}}>{v.updatedBy}</td>
                    <td style={{fontSize:12}}>{v.updatedAt}</td>
                    {(canWrite||canDelete)&&(
                      <td><div style={{display:"flex",gap:6}}>
                        {canWrite&&<button className="btn btn-ghost btn-icon" onClick={()=>setModal({type:"val",item:v})} title="Edit"><Edit2 size={14}/></button>}
                        {canDelete&&<button className="btn btn-danger btn-icon" onClick={()=>setDeleteTarget({...v,defType:"val"})} title="Delete"><Trash2 size={14}/></button>}
                      </div></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {modal?.type==="def"&&<DefModal item={modal.item} onSave={handleSaveDef} onClose={()=>setModal(null)}/>}
        {modal?.type==="val"&&<ValueModal defs={defs} item={modal.item} onSave={handleSaveVal} onClose={()=>setModal(null)}/>}
      </AnimatePresence>
      <AnimatePresence>
        {deleteTarget&&(
          <div className="modal-overlay">
            <motion.div className="modal-content" style={{maxWidth:400}} initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}>
              <div className="modal-header"><h3>Delete Record?</h3><button className="btn btn-ghost btn-icon" onClick={()=>setDeleteTarget(null)}><X size={18}/></button></div>
              <div className="modal-body"><div className="alert alert-error"><AlertCircle size={16} style={{flexShrink:0}}/><span>Delete <strong>{deleteTarget.key||deleteTarget.defKey}</strong>? This cannot be undone.</span></div></div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={()=>setDeleteTarget(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete} id="btn-confirm-delete-meta"><Trash2 size={14}/>Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
