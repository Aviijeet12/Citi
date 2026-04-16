import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Search, Filter, Play, CheckCircle, Clock, 
  Award, TrendingUp, ChevronRight, Star, Loader2, Sparkles, Plus
} from "lucide-react";
import { useAuth, PERMISSIONS } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { trainingRecordsApi } from "../services/workshopApi";

export default function TrainingPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const fetchTraining = async () => {
    try {
      setLoading(true);
      const data = await trainingRecordsApi.list();
      const items = data?.items || data || [];
      setRecords(Array.isArray(items) ? items : []);
    } catch (err) {
      // Backend unavailable — silently show empty
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraining();
  }, []);

  const filtered = records.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                      (c.provider && c.provider.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === "all" || c.status === filterType;
    return matchSearch && matchType;
  });

  const stats = useMemo(() => ({
    completed: records.filter(c => c.status === 'completed').length,
    hours: records.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0),
    avgScore: records.length ? (records.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / records.length).toFixed(1) : 0
  }), [records]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Learning & Certifications</h1>
          <p>Continuous education pipeline and internal training records</p>
        </div>
        <div className="page-header-right">
          <div style={{ display: "flex", gap: 12 }}>
             <button className="btn btn-ghost" onClick={() => toast("Opening Learning Portal", "info")}>
               <Sparkles size={16}/> Course Catalog
             </button>
             <button className="btn btn-primary" onClick={() => toast("Manual entry not implemented", "info")}>
               <Plus size={16}/> Record External Training
             </button>
          </div>
        </div>
      </div>

      <div className="metrics-grid" style={{ marginBottom: 30 }}>
         {[
           { label: "Completed Courses", value: stats.completed, color: "#10b981", icon: <CheckCircle size={20}/> },
           { label: "Learning Hours", value: `${stats.hours}h`, color: "#6366f1", icon: <Clock size={20}/> },
           { label: "Avg assessment", value: `${stats.avgScore}%`, color: "#f59e0b", icon: <TrendingUp size={20}/> },
           { label: "Certs Earned", value: records.filter(r=>r.certification_name).length, color: "#06b6d4", icon: <Award size={20}/> },
         ].map((stat, i) => (
           <motion.div key={stat.label} className="metric-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
             <div className="metric-icon" style={{ background: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
             <div className="metric-value">{stat.value}</div>
             <div className="metric-label">{stat.label}</div>
           </motion.div>
         ))}
      </div>

      <div className="glass-card">
        <div className="card-header">
          <div className="card-title"><h3>Training Ledger</h3></div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="search-input-wrapper" style={{ width: 240 }}>
              <Search size={14} className="search-icon"/>
              <input className="form-input" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
            </select>
          </div>
        </div>

        <div className="table-container" style={{ padding: "0 24px 24px" }}>
          {loading ? (
             <div style={{ padding: 40, textAlign: "center" }}><Loader2 className="spin" size={32}/><p>Accessing training database...</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Provider</th>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(record => (
                  <tr key={record.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{record.title}</div>
                      {record.certification_name && <div style={{ fontSize: 11, color: "var(--color-primary-light)", display: "flex", alignItems: "center", gap: 4 }}><Award size={12}/> {record.certification_name}</div>}
                    </td>
                    <td>{record.provider}</td>
                    <td>{record.completion_date ? new Date(record.completion_date).toLocaleDateString() : "Planned"}</td>
                    <td>{record.hours || 0}h</td>
                    <td>{record.score ? `${record.score}%` : "-"}</td>
                    <td>
                      <span className={`tag ${record.status === 'completed' ? 'tag-success' : record.status === 'in_progress' ? 'tag-info' : 'tag-gray'}`}>
                        {record.status.replace("_", " ")}
                      </span>
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
