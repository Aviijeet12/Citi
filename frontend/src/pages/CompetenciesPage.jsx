import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Search, Plus, Trophy, Target, TrendingUp, AlertTriangle, ArrowRight,
  Filter, Check, X, Edit2, Trash2, PieChart, Loader2
} from "lucide-react";
import { useAuth, PERMISSIONS } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { competenciesApi } from "../services/workshopApi";

const SKILL_LEVELS = [
  { value: 1, label: "Beginner", color: "#f43f5e" },
  { value: 2, label: "Developing", color: "#f97316" },
  { value: 3, label: "Proficient", color: "#f59e0b" },
  { value: 4, label: "Advanced", color: "#10b981" },
  { value: 5, label: "Master", color: "#06b6d4" },
];

export default function CompetenciesPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedComp, setSelectedComp] = useState(null);

  const canEdit = hasPermission(PERMISSIONS.SKILLS_WRITE);

  const fetchCompetencies = async () => {
    try {
      setLoading(true);
      const data = await competenciesApi.list();
      setItems(data.items || []);
    } catch (err) {
      toast("Failed to load competencies: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetencies();
  }, []);

  const filtered = useMemo(() => items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    (i.category && i.category.toLowerCase().includes(search.toLowerCase()))
  ), [items, search]);

  const stats = useMemo(() => ({
    total: items.length,
    criticalGaps: items.filter(i => i.is_critical || i.gap > 5).length,
    avgLevel: items.length ? (items.reduce((acc, curr) => acc + (curr.level || 0), 0) / items.length).toFixed(1) : 0
  }), [items]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Competencies & Skills</h1>
          <p>Mapping organizational capabilities, skill gaps, and development needs</p>
        </div>
        <div className="page-header-right">
          {canEdit && (
            <button className="btn btn-primary" onClick={() => { setSelectedComp(null); setShowModal(true); }}>
              <Plus size={16}/> Define Competency
            </button>
          )}
        </div>
      </div>

      <div className="metrics-grid">
        {[
          { label: "Total Competencies", value: stats.total, icon: <Brain size={20}/>, color: "#6366f1" },
          { label: "Critical Skill Gaps", value: stats.criticalGaps, icon: <AlertTriangle size={20}/>, color: "#f43f5e" },
          { label: "Avg Mastery Level", value: `${stats.avgLevel}/5`, icon: <TrendingUp size={20}/>, color: "#10b981" },
          { label: "Team Distribution", value: "88%", icon: <PieChart size={20}/>, color: "#06b6d4" },
        ].map((m, i) => (
          <motion.div key={m.label} className="metric-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
            <div className="metric-icon" style={{ background: `${m.color}15`, color: m.color }}>{m.icon}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-label">{m.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card">
        <div className="card-header">
          <div className="card-title"><h3>Skills Matrix</h3><p>Detailed view of competencies across categories</p></div>
          <div className="search-input-wrapper" style={{ maxWidth: 260 }}>
            <Search size={14} className="search-icon"/>
            <input className="form-input" placeholder="Search skills..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
        </div>
        <div className="table-container" style={{ padding: "0 24px 24px" }}>
          {loading ? (
             <div style={{ padding: 40, textAlign: "center" }}><Loader2 className="spin" size={32}/><p>Loading Skills Matrix...</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Competency</th>
                  <th>Category</th>
                  <th>Global Demand</th>
                  <th>Org. Level</th>
                  <th>Gap Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(comp => (
                  <tr key={comp.id}>
                    <td>
                      <div>
                        <p style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{comp.name}</p>
                        <p style={{ fontSize: 11, color: "var(--color-text-muted)" }} className="truncate">{comp.description}</p>
                      </div>
                    </td>
                    <td><span className="tag tag-default">{comp.category || "General"}</span></td>
                    <td>
                      <span className={`tag ${comp.is_critical ? 'tag-danger' : 'tag-info'}`}>
                        {comp.is_critical ? 'Critical' : 'Standard'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div className="progress-fill" style={{ width: `${(comp.level || 1) * 20}%`, background: SKILL_LEVELS[(comp.level || 1)-1]?.color }}/>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{comp.level || 0}/5</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: comp.gap > 5 ? "#f43f5e" : "inherit" }}>
                        {comp.gap > 5 && <AlertTriangle size={12}/>}
                        {comp.gap || 0} needed
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => { setSelectedComp(comp); setShowModal(true); }}><Edit2 size={14}/></button>
                        <button className="btn btn-danger btn-icon" onClick={() => toast("Comp deletion not implemented in demo UI", "warning")}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
