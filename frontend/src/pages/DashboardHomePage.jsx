import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Users2, Trophy, Tag, BarChart3, TrendingUp, TrendingDown,
  Activity, AlertTriangle, Shield, Eye, Pencil, Trash2, Star,
  CheckCircle, Clock, Zap, Target, ArrowUpRight, Loader2, Play, RefreshCcw,
  Brain
} from "lucide-react";
import { useAuth, ROLES } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

// Seeded fake data
const FAKE_DATA = {
  metrics: {
    admin: [
      { label: "Total Users", value: 247, icon: <Users size={20}/>, color: "#6366f1", trend: "+12", up: true },
      { label: "Active Teams", value: 34, icon: <Users2 size={20}/>, color: "#8b5cf6", trend: "+3", up: true },
      { label: "Achievements", value: 892, icon: <Trophy size={20}/>, color: "#f59e0b", trend: "+45", up: true },
      { label: "Metadata Keys", value: 118, icon: <Tag size={20}/>, color: "#06b6d4", trend: "+8", up: true },
      { label: "Pending Reports", value: 6, icon: <BarChart3 size={20}/>, color: "#f43f5e", trend: "-2", up: false },
      { label: "System Health", value: "99.8%", icon: <Activity size={20}/>, color: "#10b981", trend: "Stable", up: true },
    ],
    manager: [
      { label: "My Teams", value: 5, icon: <Users2 size={20}/>, color: "#6366f1", trend: "0", up: true },
      { label: "Team Members", value: 42, icon: <Users size={20}/>, color: "#8b5cf6", trend: "+4", up: true },
      { label: "Achievements This Month", value: 23, icon: <Trophy size={20}/>, color: "#f59e0b", trend: "+7", up: true },
      { label: "Open Tasks", value: 14, icon: <Clock size={20}/>, color: "#f43f5e", trend: "-3", up: false },
    ],
    contributor: [
      { label: "My Contributions", value: 38, icon: <Zap size={20}/>, color: "#06b6d4", trend: "+5", up: true },
      { label: "Team", value: "Alpha Squad", icon: <Users2 size={20}/>, color: "#6366f1", trend: null, up: true },
      { label: "Achievements", value: 12, icon: <Trophy size={20}/>, color: "#f59e0b", trend: "+2", up: true },
      { label: "Pending Reviews", value: 3, icon: <Clock size={20}/>, color: "#f43f5e", trend: "0", up: true },
    ],
    viewer: [
      { label: "Teams Visible", value: 34, icon: <Users2 size={20}/>, color: "#6366f1", trend: null, up: true },
      { label: "Users Visible", value: 247, icon: <Users size={20}/>, color: "#8b5cf6", trend: null, up: true },
      { label: "Reports Available", value: 18, icon: <BarChart3 size={20}/>, color: "#06b6d4", trend: null, up: true },
      { label: "Achievements Logged", value: 892, icon: <Trophy size={20}/>, color: "#f59e0b", trend: null, up: true },
    ],
  },
};

const INITIAL_JOBS = [
  { id: "job-1", name: "Monthly Performance Rollup", type: "Report", status: "completed", progress: 100, time: "12:05 PM" },
  { id: "job-2", name: "Team Achievement Sync", type: "Sync", status: "processing", progress: 65, time: "1:42 PM" },
  { id: "job-3", name: "Metadata Schema Update", type: "System", status: "pending", progress: 0, time: "2:00 PM" },
];

const RECENT_ACTIVITY = [
  { id: 1, type: "user_created", msg: "New user Alex Johnson was added.", time: "2 min ago", icon: <Users size={14}/>, color: "#6366f1" },
  { id: 2, type: "achievement", msg: "Team Alpha completed Q1 target achievement.", time: "15 min ago", icon: <Trophy size={14}/>, color: "#f59e0b" },
  { id: 3, type: "team_update", msg: "Team Bravo leader changed to Maria Chen.", time: "1 hr ago", icon: <Users2 size={14}/>, color: "#8b5cf6" },
  { id: 4, type: "report", msg: "Monthly report generated successfully.", time: "3 hr ago", icon: <BarChart3 size={14}/>, color: "#10b981" },
  { id: 5, type: "warning", msg: "3 users have not logged in for 30+ days.", time: "5 hr ago", icon: <AlertTriangle size={14}/>, color: "#f43f5e" },
];

const TOP_TEAMS = [
  { name: "Alpha Squad", members: 9, score: 94, lead: "Jordan Pierce" },
  { name: "Beta Force", members: 12, score: 88, lead: "Taylor Kim" },
  { name: "Gamma Unit", members: 7, score: 85, lead: "Casey Morgan" },
  { name: "Delta Core", members: 11, score: 80, lead: "Riley Zhao" },
];

const ROLE_WELCOME = {
  admin: { title: "Admin Dashboard", subtitle: "Full system visibility and control. Manage users, teams, and all resources.", badge: "Full Access", badgeClass: "badge-admin" },
  manager: { title: "Manager Dashboard", subtitle: "Oversee your teams, track achievements, and manage team operations.", badge: "Manager", badgeClass: "badge-manager" },
  contributor: { title: "Contributor Dashboard", subtitle: "View your contributions, team progress, and track your achievements.", badge: "Contributor", badgeClass: "badge-contributor" },
  viewer: { title: "Viewer Dashboard", subtitle: "Browse and monitor all data across the platform. Read-only access.", badge: "Read Only", badgeClass: "badge-viewer" },
};

const ROLE_CAPABILITIES = {
  admin: [
    { icon: <Shield size={16}/>, text: "Manage all users and assign roles" },
    { icon: <Users2 size={16}/>, text: "Create, edit, delete any team" },
    { icon: <Trophy size={16}/>, text: "Full achievement CRUD" },
    { icon: <Tag size={16}/>, text: "Define and manage metadata schema" },
    { icon: <BarChart3 size={16}/>, text: "Access all reports and analytics" },
    { icon: <Activity size={16}/>, text: "View audit logs and system events" },
  ],
  manager: [
    { icon: <Users2 size={16}/>, text: "Manage teams and member assignments" },
    { icon: <Trophy size={16}/>, text: "Log and track team achievements" },
    { icon: <Users size={16}/>, text: "Read user profiles (no edit/delete)" },
    { icon: <Tag size={16}/>, text: "Manage metadata for teams" },
    { icon: <BarChart3 size={16}/>, text: "View reports and analytics" },
  ],
  contributor: [
    { icon: <Pencil size={16}/>, text: "Create and update records (no delete)" },
    { icon: <Users2 size={16}/>, text: "View and edit team data" },
    { icon: <Trophy size={16}/>, text: "Log new achievements" },
    { icon: <Tag size={16}/>, text: "Add metadata values" },
    { icon: <BarChart3 size={16}/>, text: "Read reports" },
  ],
  viewer: [
    { icon: <Eye size={16}/>, text: "View all users (read-only)" },
    { icon: <Eye size={16}/>, text: "Browse teams and members" },
    { icon: <Eye size={16}/>, text: "Read achievements data" },
    { icon: <Eye size={16}/>, text: "Explore metadata definitions" },
    { icon: <Eye size={16}/>, text: "Access all generated reports" },
  ],
};

function MetricCard({ metric, index }) {
  return (
    <motion.div
      className="metric-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      <div className="metric-icon" style={{ background: `${metric.color}18` }}>
        <span style={{ color: metric.color }}>{metric.icon}</span>
      </div>
      <div className="metric-value">{metric.value}</div>
      <div className="metric-label">{metric.label}</div>
      {metric.trend && (
        <div className={`metric-trend ${metric.up ? "up" : "down"}`}>
          {metric.up ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
          {metric.trend} this month
        </div>
      )}
    </motion.div>
  );
}

export default function DashboardHomePage() {
  const { user } = useAuth();
  const toast = useToast();
  const role = user?.role || ROLES.VIEWER;
  const welcome = ROLE_WELCOME[role] || ROLE_WELCOME.viewer;
  const metrics = FAKE_DATA.metrics[role] || FAKE_DATA.metrics.viewer;
  const capabilities = ROLE_CAPABILITIES[role] || ROLE_CAPABILITIES.viewer;

  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
    toast("Dashboard data refreshed successfully", "success");
  };

  const handleStartJob = () => {
    const newJob = {
      id: `job-${Date.now()}`,
      name: "On-demand Performance Audit",
      type: "Audit",
      status: "pending",
      progress: 0,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setJobs([newJob, ...jobs]);
    toast("Audit job queued successfully", "info");
  };

  // Simulate job progress
  useEffect(() => {
    const timer = setInterval(() => {
      setJobs(prev => prev.map(job => {
        if (job.status === 'processing') {
          const nextProgress = job.progress + 5;
          if (nextProgress >= 100) return { ...job, progress: 100, status: 'completed' };
          return { ...job, progress: nextProgress };
        }
        if (job.status === 'pending') {
          return { ...job, status: 'processing', progress: 5 };
        }
        return job;
      }));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div className="page-header-left">
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 4 }}>
            {greeting}, {user?.name?.split(" ")[0] || "there"} 👋
          </p>
          <h1>{welcome.title}</h1>
          <p>{welcome.subtitle}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button 
            className="btn btn-ghost" 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ minWidth: 110 }}
          >
            {refreshing ? <Loader2 size={16} className="spin" /> : <RefreshCcw size={16} />}
            Refresh
          </button>
          <span className={`topbar-badge ${welcome.badgeClass}`}>
            {welcome.badge}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-row">
        {metrics.map((m, i) => <MetricCard key={m.label} metric={m} index={i} />)}
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, marginBottom: 20 }}>
        {/* Activity Feed and Job Queue */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Job Queue for Admin/Manager */}
          {(role === ROLES.ADMIN || role === ROLES.MANAGER) && (
            <motion.div
              className="glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="card-header">
                <div className="card-title">
                  <h3>Background Jobs</h3>
                  <p>Real-time processing and report generation</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleStartJob}>
                  <Play size={14}/> Run Audit
                </button>
              </div>
              <div className="card-body">
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {jobs.map(job => (
                    <div key={job.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ 
                            width: 32, height: 32, borderRadius: 8, 
                            background: "rgba(99,102,241,0.1)", display: "flex", 
                            alignItems: "center", justifyContent: "center", color: "var(--color-accent-primary)"
                          }}>
                            {job.status === 'processing' ? <Loader2 size={16} className="spin" /> : job.status === 'completed' ? <CheckCircle size={16} /> : <Clock size={16} />}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{job.name}</p>
                            <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{job.type} · Starting at {job.time}</p>
                          </div>
                        </div>
                        <span className={`tag ${job.status === 'completed' ? 'tag-success' : job.status === 'processing' ? 'tag-info' : 'tag-default'}`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="progress-bar" style={{ height: 4 }}>
                        <div className="progress-fill" style={{ width: `${job.progress}%`, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Activity Feed */}
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="card-header">
              <div className="card-title">
                <h3>Recent Activity</h3>
                <p>Latest system and team events</p>
              </div>
              <Activity size={16} style={{ color: "var(--color-text-muted)" }}/>
            </div>
            <div className="card-body">
              <div className="timeline">
                {RECENT_ACTIVITY.map((item) => (
                  <div key={item.id} className="timeline-item">
                    <div className="timeline-dot" style={{ background: `${item.color}15`, color: item.color }}>
                      {item.icon}
                    </div>
                    <div className="timeline-content">
                      <p className="timeline-title">{item.msg}</p>
                      <p className="timeline-time">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Your Permissions */}
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ height: 'fit-content' }}
        >
          <div className="card-header">
            <div className="card-title">
              <h3>Your Access</h3>
              <p>Role permissions overview</p>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {capabilities.map((cap, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "var(--radius-sm)",
                    background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "var(--color-accent-primary)", flexShrink: 0,
                  }}>
                    {cap.icon}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--color-text-secondary)", paddingTop: 5 }}>{cap.text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top teams + Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Top Teams */}
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="card-header">
            <div className="card-title">
              <h3>Top Teams</h3>
              <p>By achievement score this month</p>
            </div>
            <ArrowUpRight size={16} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <div className="card-body" style={{ paddingTop: 0 }}>
            {TOP_TEAMS.map((team, i) => (
              <div key={team.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < TOP_TEAMS.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: i === 0 ? "linear-gradient(135deg, #f59e0b,#f97316)" : i === 1 ? "linear-gradient(135deg,#94a3b8,#64748b)" : "linear-gradient(135deg,#a16207,#78350f)",
                  color: "white", fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{team.name}</p>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Lead: {team.lead} · {team.members} members</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 60 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${team.score}%` }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", width: 32, textAlign: "right" }}>{team.score}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ACME Workforce Insights Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
         {/* Skill Distribution */}
         <motion.div className="glass-card" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.7}}>
            <div className="card-header">
               <div className="card-title"><h3>Skill Distribution</h3><p>Organizational competency breakdown</p></div>
               <Brain size={16} style={{color:"var(--color-text-muted)"}}/>
            </div>
            <div className="card-body">
               <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {[
                     { name: "Cloud Architecture", value: 65, color: "#6366f1" },
                     { name: "Python for Data Science", value: 42, color: "#06b6d4" },
                     { name: "Stakeholder Management", value: 88, color: "#10b981" },
                     { name: "Cybersecurity", value: 55, color: "#f43f5e" },
                     { name: "Agile Methodology", value: 92, color: "#f59e0b" },
                  ].map(skill => (
                     <div key={skill.name}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}>
                           <span>{skill.name}</span>
                           <span style={{fontWeight:700}}>{skill.value}%</span>
                        </div>
                        <div className="progress-bar" style={{height:6}}>
                           <div className="progress-fill" style={{width:`${skill.value}%`, background:skill.color}}/>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </motion.div>

         {/* High Potential Talent */}
         <motion.div className="glass-card" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.8}}>
            <div className="card-header">
               <div className="card-title"><h3>Promotion Registry</h3><p>High-potential employees (HIPO)</p></div>
               <Trophy size={16} style={{color:"#f59e0b"}}/>
            </div>
            <div className="card-body" style={{paddingTop:0}}>
               {[
                  { name: "Jordan Pierce", role: "Sr. Contributor", match: 98, reason: "Exceptional leadership in Cloud Sync" },
                  { name: "Taylor Kim", role: "Contributor", match: 94, reason: "Product intuition & high NPS scores" },
                  { name: "Chris Contrib", role: "Contributor", match: 89, reason: "Consistently exceeds Q-targets" },
               ].map((hipo, i) => (
                  <div key={hipo.name} style={{padding:"12px 0", borderBottom: i < 2 ? "1px solid var(--color-border)" : "none"}}>
                     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <p style={{fontSize:13,fontWeight:700}}>{hipo.name}</p>
                        <span className="tag tag-success" style={{fontSize:10}}>Match {hipo.match}%</span>
                     </div>
                     <p style={{fontSize:11,color:"var(--color-text-muted)"}}>{hipo.role} · {hipo.reason}</p>
                  </div>
               ))}
               <button className="btn btn-secondary btn-sm w-full" style={{marginTop:12}} onClick={() => toast("Opening Talent Review system", "info")}>
                  Full Talent Review <ArrowUpRight size={14}/>
               </button>
            </div>
         </motion.div>
      </div>
    </div>
  );
}
