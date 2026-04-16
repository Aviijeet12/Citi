import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Plus, Search, Edit2, Trash2, X, Check, AlertCircle,
  Loader2, User, Users2, Calendar, TrendingUp, TrendingDown, Filter
} from "lucide-react";
import { useAuth, PERMISSIONS } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { performanceReviewsApi } from "../services/workshopApi";

const EMPLOYEES = [
  "Alex Admin", "Maria Manager", "Chris Contrib", "Victor Viewer",
  "Jordan Pierce", "Taylor Kim", "Casey Morgan", "Riley Zhao"
];

const PERIODS = ["Q1 2024","Q2 2024","Q3 2024","Q4 2024","Q1 2025","Q2 2025","Annual 2024"];
const STATUS_OPTIONS = ["draft","submitted","approved","rejected"];

const INITIAL_REVIEWS = [
  {
    id:"r1", employee:"Jordan Pierce", employeeId:"e1", reviewer:"Maria Manager",
    period:"Q1 2024", rating:5, status:"approved",
    goals:"Lead platform migration to cloud. Reduce deploy time by 40%.",
    achievements:"Migrated 60% of services. Deploy time reduced 35%. Zero downtime.",
    strengths:"Technical leadership, problem-solving, cross-team collaboration.",
    improvements:"Documentation quality, delegating tasks to juniors.",
    feedback:"Jordan has been exceptional this quarter. Strong candidate for promotion.",
    date:"2024-04-05"
  },
  {
    id:"r2", employee:"Taylor Kim", employeeId:"e2", reviewer:"Maria Manager",
    period:"Q1 2024", rating:4, status:"approved",
    goals:"Improve customer onboarding flow. Ship 3 key product features.",
    achievements:"Redesigned onboarding — NPS improved +12. Delivered 3 features on time.",
    strengths:"Product intuition, stakeholder management, data-driven decisions.",
    improvements:"Could improve cross-functional communication frequency.",
    feedback:"Strong quarter. Taylor is reliable and consistently delivers quality work.",
    date:"2024-04-06"
  },
  {
    id:"r3", employee:"Casey Morgan", employeeId:"e3", reviewer:"Alex Admin",
    period:"Q2 2024", rating:3, status:"submitted",
    goals:"Streamline ops processes. Cut ticket resolution time by 20%.",
    achievements:"Implemented new ticketing workflow. Resolution time improved 15%.",
    strengths:"Process thinking, attention to detail.",
    improvements:"Needs to improve communication with the tech team.",
    feedback:"Good progress but short of the target. Clear improvement plan needed.",
    date:"2024-07-10"
  },
  {
    id:"r4", employee:"Chris Contrib", employeeId:"e4", reviewer:"Maria Manager",
    period:"Q2 2024", rating:4, status:"draft",
    goals:"Deliver finance dashboard. Performance audit Q2.",
    achievements:"Dashboard delivered ahead of schedule. Audit score: 92%.",
    strengths:"Analytical skills, accuracy, initiative.",
    improvements:"Should proactively flag blockers earlier.",
    feedback:"Solid contributor. Promotable within 2 quarters.",
    date:"2024-07-15"
  },
];

const EMPTY_FORM = {
  employee:"", reviewer:"", period:"Q1 2024", rating:0,
  status:"draft", goals:"", achievements:"", strengths:"",
  improvements:"", feedback:"", date: new Date().toISOString().split("T")[0]
};

const STATUS_TAG = {
  approved: "tag-success", submitted: "tag-info",
  draft: "tag-default", rejected: "tag-danger"
};

const RATING_COLOR = { 5:"#10b981", 4:"#06b6d4", 3:"#f59e0b", 2:"#f97316", 1:"#f43f5e" };

function StarRating({ value, onChange, readonly }) {
  return (
    <div style={{ display:"flex", gap:4 }}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => !readonly && onChange && onChange(n)}
          style={{
            background:"none", border:"none", cursor: readonly?"default":"pointer",
            color: n <= value ? "#f59e0b" : "var(--color-text-muted)",
            fontSize:22, padding:2, transition:"color 0.15s, transform 0.1s",
          }}
          onMouseEnter={e => { if (!readonly) e.target.style.transform="scale(1.2)"; }}
          onMouseLeave={e => { if (!readonly) e.target.style.transform="scale(1)"; }}
        >★</button>
      ))}
      {value > 0 && <span style={{ fontSize:13, color: RATING_COLOR[value] || "#f59e0b", fontWeight:700, alignSelf:"center" }}>
        {["","Poor","Below Average","Meets Expectations","Exceeds Expectations","Outstanding"][value]}
      </span>}
    </div>
  );
}

function ReviewModal({ review, onSave, onClose }) {
  const [form, setForm] = useState(review ? { ...review } : { ...EMPTY_FORM });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const f = field => e => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setErrors(p => { const n={...p}; delete n[field]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.employee.trim()) e.employee = "Employee required";
    if (!form.reviewer.trim()) e.reviewer = "Reviewer required";
    if (!form.rating) e.rating = "Rating required";
    return e;
  };

  const handleSubmit = async ev => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onSave({ ...form, id: review?.id || crypto.randomUUID() });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal-content modal-lg" initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}>
        <div className="modal-header">
          <h3>{review ? "Edit Review" : "New Performance Review"}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Employee <span className="required">*</span></label>
                <select className="form-select" value={form.employee} onChange={f("employee")}>
                  <option value="">Select employee…</option>
                  {EMPLOYEES.map(e => <option key={e}>{e}</option>)}
                </select>
                {errors.employee && <p className="form-error"><AlertCircle size={12}/>{errors.employee}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Reviewer <span className="required">*</span></label>
                <select className="form-select" value={form.reviewer} onChange={f("reviewer")}>
                  <option value="">Select reviewer…</option>
                  {EMPLOYEES.map(e => <option key={e}>{e}</option>)}
                </select>
                {errors.reviewer && <p className="form-error"><AlertCircle size={12}/>{errors.reviewer}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Review Period</label>
                <select className="form-select" value={form.period} onChange={f("period")}>
                  {PERIODS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={f("status")}>
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Overall Rating <span className="required">*</span></label>
              <StarRating value={form.rating} onChange={v => { setForm(p => ({...p, rating:v})); setErrors(p => { const n={...p}; delete n.rating; return n; }); }} />
              {errors.rating && <p className="form-error"><AlertCircle size={12}/>{errors.rating}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Goals & Objectives</label>
              <textarea className="form-textarea" rows={3} placeholder="What were the set goals this period?" value={form.goals} onChange={f("goals")} style={{ resize:"vertical" }}/>
            </div>
            <div className="form-group">
              <label className="form-label">Key Achievements</label>
              <textarea className="form-textarea" rows={3} placeholder="What did the employee achieve?" value={form.achievements} onChange={f("achievements")} style={{ resize:"vertical" }}/>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Strengths</label>
                <textarea className="form-textarea" rows={2} placeholder="Key strengths demonstrated…" value={form.strengths} onChange={f("strengths")} style={{ resize:"vertical" }}/>
              </div>
              <div className="form-group">
                <label className="form-label">Areas for Improvement</label>
                <textarea className="form-textarea" rows={2} placeholder="Areas needing development…" value={form.improvements} onChange={f("improvements")} style={{ resize:"vertical" }}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Manager Feedback</label>
              <textarea className="form-textarea" rows={2} placeholder="Overall feedback and recommendations…" value={form.feedback} onChange={f("feedback")} style={{ resize:"vertical" }}/>
            </div>
            <div className="form-group" style={{ maxWidth:200 }}>
              <label className="form-label">Review Date</label>
              <input className="form-input" type="date" value={form.date} onChange={f("date")}/>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={15} className="spin"/> : <Check size={15}/>}
              {loading ? "Saving…" : review ? "Update Review" : "Submit Review"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function PerformanceReviewsPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canWrite  = hasPermission(PERMISSIONS.REVIEWS_WRITE);
  const canDelete = hasPermission(PERMISSIONS.REVIEWS_DELETE);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await performanceReviewsApi.list();
      setReviews(data.items || []);
    } catch (err) {
      toast("Failed to load reviews: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filtered = useMemo(() => reviews.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.employee.toLowerCase().includes(q) || r.reviewer.toLowerCase().includes(q) || r.period.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || r.status === statusFilter;
    const matchP = periodFilter === "all" || r.period === periodFilter;
    return matchQ && matchS && matchP;
  }), [reviews, search, statusFilter, periodFilter]);

  const stats = useMemo(() => ({
    total: reviews.length,
    approved: reviews.filter(r => r.status==="approved").length,
    avgRating: reviews.length ? (reviews.reduce((s,r) => s+r.rating,0)/reviews.length).toFixed(1) : 0,
    pending: reviews.filter(r => r.status==="submitted").length,
  }), [reviews]);

  const handleSave = useCallback(async data => {
    try {
      if (data.id && reviews.find(r => r.id === data.id)) {
        await performanceReviewsApi.update(data.id, data);
        toast("Review updated", "success");
      } else {
        await performanceReviewsApi.create(data);
        toast("Review submitted", "success");
      }
      setModal(null);
      fetchReviews();
    } catch (err) {
      toast("Save failed: " + err.message, "error");
    }
  }, [reviews, toast]);

  const handleDelete = useCallback(async id => {
    try {
      await performanceReviewsApi.remove(id);
      setDeleteTarget(null);
      toast("Review deleted", "warning");
      fetchReviews();
    } catch (err) {
      toast("Delete failed: " + err.message, "error");
    }
  }, [toast]);

  const uniquePeriods = [...new Set(reviews.map(r => r.period))];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Performance Reviews</h1>
          <p>Track employee performance, ratings, and feedback across review periods</p>
        </div>
        <div className="page-header-right">
          {canWrite && (
            <button className="btn btn-primary" onClick={() => setModal("new")} id="btn-add-review">
              <Plus size={16}/> New Review
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Total Reviews",  value:stats.total,            color:"#6366f1", icon:<Star size={18}/> },
          { label:"Approved",       value:stats.approved,         color:"#10b981", icon:<Check size={18}/> },
          { label:"Avg Rating",     value:`${stats.avgRating}/5`,  color:"#f59e0b", icon:<TrendingUp size={18}/> },
          { label:"Pending Review", value:stats.pending,          color:"#06b6d4", icon:<Calendar size={18}/> },
        ].map((s,i) => (
          <motion.div key={s.label} className="metric-card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}>
            <div className="metric-icon" style={{ background:`${s.color}18` }}><span style={{ color:s.color }}>{s.icon}</span></div>
            <div className="metric-value">{s.value}</div>
            <div className="metric-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="search-bar" style={{ marginBottom:20 }}>
        <div className="search-input-wrapper" style={{ maxWidth:320 }}>
          <Search size={16} className="search-icon"/>
          <input className="form-input" placeholder="Search employee or reviewer…" value={search} onChange={e => setSearch(e.target.value)} id="input-review-search"/>
        </div>
        <select className="form-select" style={{ width:150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
        <select className="form-select" style={{ width:160 }} value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}>
          <option value="all">All Periods</option>
          {uniquePeriods.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Reviews Table */}
      <motion.div className="glass-card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
        <div className="card-header">
          <div className="card-title"><h2>Review Records</h2><p>{filtered.length} records</p></div>
        </div>
        <div className="table-container" style={{ padding:"0 24px 24px" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Reviewer</th>
                <th>Period</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Date</th>
                {(canWrite||canDelete) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Star size={28}/></div>
                    <h3>No reviews found</h3>
                    <p>Try adjusting your filters or create a new review</p>
                  </div>
                </td></tr>
              ) : filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div className="user-avatar" style={{ width:32, height:32, fontSize:11 }}>
                        {r.employee.split(" ").map(w=>w[0]).join("")}
                      </div>
                      <div>
                        <p style={{ fontWeight:600, fontSize:13, color:"var(--color-text-primary)" }}>{r.employee}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize:13 }}>{r.reviewer}</td>
                  <td><span className="tag tag-info">{r.period}</span></td>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ color: RATING_COLOR[r.rating]||"#f59e0b", fontSize:16, letterSpacing:1 }}>
                        {"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}
                      </span>
                      <span style={{ fontSize:12, fontWeight:700, color: RATING_COLOR[r.rating] }}>{r.rating}/5</span>
                    </div>
                  </td>
                  <td><span className={`tag ${STATUS_TAG[r.status]||"tag-default"}`}>{r.status}</span></td>
                  <td style={{ fontSize:12, color:"var(--color-text-muted)" }}>{r.date}</td>
                  {(canWrite||canDelete) && (
                    <td>
                      <div style={{ display:"flex", gap:6 }}>
                        {canWrite && <button className="btn btn-ghost btn-icon" onClick={() => setModal(r)} title="Edit"><Edit2 size={14}/></button>}
                        {canDelete && <button className="btn btn-danger btn-icon" onClick={() => setDeleteTarget(r)} title="Delete"><Trash2 size={14}/></button>}
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
        {modal && <ReviewModal review={modal==="new"?null:modal} onSave={handleSave} onClose={() => setModal(null)}/>}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <div className="modal-overlay">
            <motion.div className="modal-content" style={{ maxWidth:400 }} initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}>
              <div className="modal-header"><h3>Delete Review?</h3><button className="btn btn-ghost btn-icon" onClick={() => setDeleteTarget(null)}><X size={18}/></button></div>
              <div className="modal-body">
                <div className="alert alert-error"><AlertCircle size={16} style={{ flexShrink:0 }}/><span>Delete review for <strong>{deleteTarget.employee}</strong> ({deleteTarget.period})? This cannot be undone.</span></div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteTarget.id)} id="btn-confirm-delete-review"><Trash2 size={14}/> Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
