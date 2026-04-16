import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Search, Filter, User, Users2, Trophy, Tag, Settings, Shield, Trash2, Edit2, Plus, LogIn, LogOut } from "lucide-react";

const ACTION_ICONS = {
  create: <Plus size={13}/>,
  update: <Edit2 size={13}/>,
  delete: <Trash2 size={13}/>,
  login: <LogIn size={13}/>,
  logout: <LogOut size={13}/>,
};

const ACTION_COLORS = {
  create: "#10b981",
  update: "#6366f1",
  delete: "#f43f5e",
  login: "#06b6d4",
  logout: "#94a3b8",
};

const RESOURCE_ICONS = {
  user: <User size={13}/>,
  team: <Users2 size={13}/>,
  achievement: <Trophy size={13}/>,
  metadata: <Tag size={13}/>,
  system: <Settings size={13}/>,
  auth: <Shield size={13}/>,
};

const AUDIT_LOGS = [
  { id:"log1", actor:"Alex Admin", action:"create", resource:"user", detail:"Created user Priya Patel (contributor)", timestamp:"2024-03-15T14:32:00Z", ip:"10.0.1.45" },
  { id:"log2", actor:"Maria Manager", action:"update", resource:"team", detail:"Updated Alpha Squad leader assignment", timestamp:"2024-03-15T13:18:00Z", ip:"10.0.1.67" },
  { id:"log3", actor:"Alex Admin", action:"delete", resource:"user", detail:"Deactivated user James Wilson", timestamp:"2024-03-15T11:05:00Z", ip:"10.0.1.45" },
  { id:"log4", actor:"Chris Contrib", action:"create", resource:"achievement", detail:"Logged achievement 'Q1 Revenue Target' for Alpha Squad", timestamp:"2024-03-15T10:30:00Z", ip:"10.0.1.99" },
  { id:"log5", actor:"Alex Admin", action:"update", resource:"system", detail:"Updated session timeout to 60 minutes", timestamp:"2024-03-15T09:00:00Z", ip:"10.0.1.45" },
  { id:"log6", actor:"Victor Viewer", action:"login", resource:"auth", detail:"Successful login via email", timestamp:"2024-03-14T17:45:00Z", ip:"10.0.2.10" },
  { id:"log7", actor:"Maria Manager", action:"create", resource:"metadata", detail:"Added metadata key 'is_remote_eligible'", timestamp:"2024-03-14T16:00:00Z", ip:"10.0.1.67" },
  { id:"log8", actor:"Jordan Pierce", action:"update", resource:"achievement", detail:"Updated 'Platform Migration' score to 98", timestamp:"2024-03-14T14:20:00Z", ip:"10.0.1.88" },
  { id:"log9", actor:"Alex Admin", action:"create", resource:"team", detail:"Created new team 'Epsilon Lab'", timestamp:"2024-03-13T11:00:00Z", ip:"10.0.1.45" },
  { id:"log10", actor:"Casey Morgan", action:"logout", resource:"auth", detail:"Session ended", timestamp:"2024-03-13T18:30:00Z", ip:"10.0.1.55" },
  { id:"log11", actor:"Alex Admin", action:"delete", resource:"metadata", detail:"Removed deprecated key 'old_budget_code'", timestamp:"2024-03-12T15:00:00Z", ip:"10.0.1.45" },
  { id:"log12", actor:"Riley Zhao", action:"update", resource:"team", detail:"Added 2 members to Delta Core", timestamp:"2024-03-12T13:40:00Z", ip:"10.0.1.77" },
];

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");

  const filtered = useMemo(() => AUDIT_LOGS.filter(l => {
    const q = search.toLowerCase();
    const matchQ = !q || l.actor.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q) || l.ip.includes(q);
    const matchA = actionFilter === "all" || l.action === actionFilter;
    const matchR = resourceFilter === "all" || l.resource === resourceFilter;
    return matchQ && matchA && matchR;
  }), [search, actionFilter, resourceFilter]);

  const stats = useMemo(() => ({
    total: AUDIT_LOGS.length,
    creates: AUDIT_LOGS.filter(l => l.action === "create").length,
    updates: AUDIT_LOGS.filter(l => l.action === "update").length,
    deletes: AUDIT_LOGS.filter(l => l.action === "delete").length,
  }), []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Audit Logs</h1>
          <p>Complete record of all system actions and user activity (Admin only)</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Events", value: stats.total, color: "#6366f1" },
          { label: "Records Created", value: stats.creates, color: "#10b981" },
          { label: "Records Updated", value: stats.updates, color: "#8b5cf6" },
          { label: "Records Deleted", value: stats.deletes, color: "#f43f5e" },
        ].map((s,i) => (
          <motion.div key={s.label} className="metric-card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.06 }}>
            <div className="metric-value" style={{ color:s.color }}>{s.value}</div>
            <div className="metric-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="search-bar" style={{ marginBottom: 20 }}>
        <div className="search-input-wrapper" style={{ maxWidth: 320 }}>
          <Search size={16} className="search-icon"/>
          <input className="form-input" placeholder="Search actor, detail, IP…" value={search} onChange={e => setSearch(e.target.value)} id="input-audit-search"/>
        </div>
        <select className="form-select" style={{ width: 140 }} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          <option value="all">All Actions</option>
          {["create","update","delete","login","logout"].map(a => <option key={a}>{a}</option>)}
        </select>
        <select className="form-select" style={{ width: 150 }} value={resourceFilter} onChange={e => setResourceFilter(e.target.value)}>
          <option value="all">All Resources</option>
          {["user","team","achievement","metadata","system","auth"].map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Log Table */}
      <motion.div className="glass-card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
        <div className="card-header">
          <div className="card-title"><h2>Activity Log</h2><p>{filtered.length} of {AUDIT_LOGS.length} events</p></div>
        </div>
        <div className="table-container" style={{ padding: "0 24px 24px" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Actor</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Detail</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Activity size={28}/></div>
                    <h3>No logs found</h3>
                    <p>Try adjusting filters</p>
                  </div>
                </td></tr>
              ) : filtered.map(l => (
                <tr key={l.id}>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div className="user-avatar" style={{ width:28, height:28, fontSize:11 }}>
                        {l.actor.split(" ").map(w=>w[0]).join("").slice(0,2)}
                      </div>
                      <span style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>{l.actor}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px",
                      borderRadius:"var(--radius-full)", fontSize:11, fontWeight:600,
                      background:`${ACTION_COLORS[l.action]}18`, color:ACTION_COLORS[l.action],
                      border:`1px solid ${ACTION_COLORS[l.action]}30`,
                      textTransform:"capitalize",
                    }}>
                      {ACTION_ICONS[l.action]} {l.action}
                    </span>
                  </td>
                  <td>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, color:"var(--color-text-secondary)", textTransform:"capitalize" }}>
                      {RESOURCE_ICONS[l.resource]} {l.resource}
                    </span>
                  </td>
                  <td style={{ fontSize:12, color:"var(--color-text-secondary)", maxWidth:280 }}>
                    <span className="truncate" style={{ display:"block" }} title={l.detail}>{l.detail}</span>
                  </td>
                  <td style={{ fontSize:12, fontFamily:"monospace", color:"var(--color-text-muted)" }}>{l.ip}</td>
                  <td style={{ fontSize:12, color:"var(--color-text-muted)", whiteSpace:"nowrap" }}>
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
