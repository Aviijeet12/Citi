import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Calendar, CheckCircle2, Circle, Clock, Plus, Search,
  ChevronRight, ArrowUpRight, TrendingUp, MoreVertical, Edit2, Loader2
} from "lucide-react";
import { useAuth, PERMISSIONS } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { developmentPlansApi } from "../services/workshopApi";

export default function DevelopmentPlansPage() {
  const { user, hasPermission } = useAuth();
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await developmentPlansApi.list();
      setPlans(data.items || []);
    } catch (err) {
      toast("Failed to load plans: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const filteredPlans = plans.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.target_role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Individual Development Plans (IDP)</h1>
          <p>Chart your career path and track progress towards your target roles</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => toast("Plan Creation not yet available", "info")}>
            <Plus size={16}/> New Development Plan
          </button>
        </div>
      </div>

      <div className="search-bar" style={{ marginBottom: 24 }}>
        <div className="search-input-wrapper" style={{ maxWidth: 350 }}>
          <Search size={16} className="search-icon"/>
          <input className="form-input" placeholder="Search plans or roles..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center" }}><Loader2 className="spin" size={40}/><p>Loading career plans...</p></div>
      ) : filteredPlans.length === 0 ? (
        <div className="empty-state glass-card">
          <div className="empty-state-icon"><Target size={32}/></div>
          <h3>No plans found</h3>
          <p>Create a development plan to start tracking your growth goals.</p>
        </div>
      ) : (
        <div className="plans-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 20 }}>
          {filteredPlans.map((plan, idx) => (
            <motion.div key={plan.id} className="glass-card plan-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
              <div style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, color: "var(--color-text-primary)" }}>{plan.title}</h3>
                    <p style={{ margin: "4px 0 0", color: "var(--color-primary-light)", fontWeight: 600, fontSize: 14 }}>
                      Target: {plan.target_role}
                    </p>
                  </div>
                  <div className={`tag ${plan.status === 'in_progress' ? 'tag-info' : 'tag-gray'}`}>
                    {plan.status === 'in_progress' ? 'In Progress' : plan.status}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: "var(--color-text-muted)" }}>Progress</span>
                      <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>{plan.progress_percent || 0}%</span>
                   </div>
                   <div className="progress-bar" style={{ height: 8 }}>
                      <div className="progress-fill" style={{ width: `${plan.progress_percent || 0}%`, background: "var(--grad-primary)" }}/>
                   </div>
                </div>

                <div className="plan-meta" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                   <div className="meta-item" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-muted)" }}>
                      <Calendar size={14}/>
                      <span>Target: {new Date(plan.target_date).toLocaleDateString()}</span>
                   </div>
                   <div className="meta-item" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-muted)" }}>
                      <Clock size={14}/>
                      <span>{plan.items?.length || 0} Actions</span>
                   </div>
                </div>

                <div className="plan-actions-list" style={{ borderTop: "1px solid var(--glass-border)", paddingTop: 16 }}>
                   <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 12 }}>Milestones</p>
                   {(plan.items || []).slice(0, 3).map(item => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 13 }}>
                         {item.status === 'completed' ? <CheckCircle2 size={16} color="var(--color-success)"/> : <Circle size={16} color="var(--color-text-muted)"/>}
                         <span style={{ textDecoration: item.status === 'completed' ? 'line-through' : 'none', color: item.status === 'completed' ? 'var(--color-text-muted)' : 'inherit' }}>
                            {item.title}
                         </span>
                      </div>
                   ))}
                </div>
              </div>
              <div style={{ padding: "12px 24px", background: "rgba(255,255,255,0.03)", display: "flex", justifyContent: "flex-end" }}>
                 <button className="btn btn-ghost" style={{ fontSize: 12 }}>Manage Plan <ArrowUpRight size={14}/></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
