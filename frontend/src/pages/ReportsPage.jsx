import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Users, Users2, Trophy, AlertTriangle, Star, Activity, Zap, Target, Clock, Filter } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { reportsApi } from "../services/workshopApi";
import { Loader2 } from "lucide-react";

const HIGH_POTENTIAL = [
  { name:"Jordan Pierce", team:"Alpha Squad", score:96, department:"Engineering", trend:"up", skills:["Cloud","Leadership","Agile"] },
  { name:"Priya Patel", team:"Beta Force", score:94, department:"Product", trend:"up", skills:["Strategy","Data Analysis","Stakeholder Mgmt"] },
  { name:"Casey Morgan", team:"Gamma Unit", score:91, department:"Operations", trend:"up", skills:["Process Optimization","Communication","LEAN"] },
  { name:"Dana White", team:"Alpha Squad", score:89, department:"Engineering", trend:"stable", skills:["DevOps","Python","CI/CD"] },
  { name:"Max Johnson", team:"Epsilon Lab", score:87, department:"Research", trend:"up", skills:["AI/ML","Research","Innovation"] },
];

const CRITICAL_GAPS = [
  { skill:"Cloud Architecture", affected:8, severity:"high", teams:["Alpha Squad","Delta Core"], recommended:"AWS Certification Track" },
  { skill:"Cybersecurity",      affected:12, severity:"high", teams:["Beta Force","Gamma Unit"], recommended:"CISSP Preparation Program" },
  { skill:"Data Engineering",   affected:5,  severity:"medium", teams:["Epsilon Lab"], recommended:"Spark + dbt Workshop" },
  { skill:"Agile Coaching",     affected:4,  severity:"medium", teams:["Delta Core"], recommended:"ICAgile Training" },
  { skill:"Financial Modeling", affected:7,  severity:"low",  teams:["Delta Core","Beta Force"], recommended:"Internal Finance Bootcamp" },
];

const TRAINING_DATA = [
  { program:"Cloud Fundamentals", enrolled:24, completed:18, rate:75, department:"Engineering" },
  { program:"Leadership Excellence", enrolled:16, completed:14, rate:87, department:"All" },
  { program:"Data Privacy & GDPR", enrolled:45, completed:45, rate:100, department:"All" },
  { program:"Python for Finance", enrolled:10, completed:6, rate:60, department:"Finance" },
  { program:"Agile Practitioner",  enrolled:20, completed:15, rate:75, department:"Product" },
];

const ATTRITION_RISK = [
  { name:"Victor Viewer", team:"Delta Core", riskLevel:"high", lastActive:"42 days ago", score:22, signals:["No logins","Missed reviews","Low engagement"] },
  { name:"James Wilson", team:"Beta Force", riskLevel:"medium", lastActive:"18 days ago", score:45, signals:["Missed reviews","Low project contribution"] },
  { name:"Pat Jones", team:"Alpha Squad", riskLevel:"medium", lastActive:"12 days ago", score:51, signals:["Repeated deadline slips"] },
];

const SUMMARY_METRICS = [
  { label:"High Potential Employees", value:5, icon:<Star size={20}/>, color:"#f59e0b" },
  { label:"Critical Skill Gaps", value:5, icon:<AlertTriangle size={20}/>, color:"#f43f5e" },
  { label:"Avg Training Completion", value:"79%", icon:<Target size={20}/>, color:"#10b981" },
  { label:"Attrition Risk Employees", value:3, icon:<TrendingDown size={20}/>, color:"#8b5cf6" },
  { label:"Teams Non-collocated Leaders", value:2, icon:<Users2 size={20}/>, color:"#06b6d4" },
  { label:"Non-direct Staff Ratio >20%", value:1, icon:<Users size={20}/>, color:"#6366f1" },
];

const SEVERITY_TAG = { high:"tag-danger", medium:"tag-warning", low:"tag-success" };
const RISK_TAG = { high:"tag-danger", medium:"tag-warning", low:"tag-success" };

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("summary");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(SUMMARY_METRICS);
  const [hpData, setHpData] = useState(HIGH_POTENTIAL);
  const [gapsData, setGapsData] = useState(CRITICAL_GAPS);
  const [trainingData, setTrainingData] = useState(TRAINING_DATA);
  const [riskData, setRiskData] = useState(ATTRITION_RISK);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [summary, hp, gaps, training, risk] = await Promise.all([
        reportsApi.summary(),
        reportsApi.highPotentialEmployees(),
        reportsApi.criticalSkillGaps(),
        reportsApi.trainingCompletion(),
        reportsApi.attritionRiskEmployees()
      ]);

      // If we have real data, map it. Otherwise keep fallbacks.
      if (summary?.item) {
        // Simple mapping for demo
        setMetrics(SUMMARY_METRICS.map(m => ({ ...m, value: summary.item[m.label.toLowerCase().replace(/ /g, '_')] || m.value })));
      }
      
      const hpItems = hp?.items || hp || [];
      if (hpItems.length > 0) setHpData(hpItems);
      
      const gapItems = gaps?.items || gaps || [];
      if (gapItems.length > 0) setGapsData(gapItems);
      
      const trainItems = training?.items || training || [];
      if (trainItems.length > 0) setTrainingData(trainItems);
      
      const riskItems = risk?.items || risk || [];
      if (riskItems.length > 0) setRiskData(riskItems);

    } catch (err) {
      // Keep static fallbacks
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const tabs = [
    { id:"summary", label:"Summary", icon:<BarChart3 size={14}/> },
    { id:"highPotential", label:"High Potential", icon:<Star size={14}/> },
    { id:"skillGaps", label:"Skill Gaps", icon:<AlertTriangle size={14}/> },
    { id:"training", label:"Training", icon:<Target size={14}/> },
    { id:"attrition", label:"Attrition Risk", icon:<TrendingDown size={14}/> },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reports & Analytics</h1>
          <p>Aggregated insights across teams, skills, and workforce performance</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" id="btn-export-report">
            <Filter size={14}/> Export
          </button>
        </div>
      </div>

      {/* Top summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:28}}>
        {metrics.map((m,i)=>(
          <motion.div key={m.label} className="metric-card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}>
            <div className="metric-icon" style={{background:`${m.color}18`}}><span style={{color:m.color}}>{m.icon}</span></div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-label">{m.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Section Tabs */}
      <div className="tabs">
        {tabs.map(t=>(
          <button key={t.id} className={`tab ${activeSection===t.id?"active":""}`} onClick={()=>setActiveSection(t.id)} id={`btn-report-tab-${t.id}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      {activeSection==="summary"&&(
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <div className="glass-card">
              <div className="card-header"><div className="card-title"><h3>Teams: Non-Collocated Leaders</h3><p>Teams where the leader is in a different location</p></div></div>
              <div className="card-body">
                {[{team:"Gamma Unit",leader:"Casey Morgan (Chicago)",members:"Remote across 4 cities"},{team:"Epsilon Lab",leader:"Max Johnson (Boston)",members:"Remote across 3 cities"}].map(x=>(
                  <div key={x.team} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 0",borderBottom:"1px solid var(--color-border)"}}>
                    <div style={{width:32,height:32,borderRadius:"var(--radius-sm)",background:"rgba(244,63,94,0.1)",display:"flex",alignItems:"center",justifyContent:"center",color:"#f43f5e",flexShrink:0}}><Users2 size={14}/></div>
                    <div>
                      <p style={{fontWeight:600,fontSize:13,color:"var(--color-text-primary)"}}>{x.team}</p>
                      <p style={{fontSize:12,color:"var(--color-text-muted)"}}>{x.leader}</p>
                      <p style={{fontSize:12,color:"var(--color-text-muted)"}}>{x.members}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card">
              <div className="card-header"><div className="card-title"><h3>Non-Direct Staff Ratio &gt;20%</h3><p>Teams with high indirect reporting structure</p></div></div>
              <div className="card-body">
                <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 0"}}>
                  <div style={{width:32,height:32,borderRadius:"var(--radius-sm)",background:"rgba(99,102,241,0.1)",display:"flex",alignItems:"center",justifyContent:"center",color:"#6366f1",flexShrink:0}}><Users size={14}/></div>
                  <div style={{flex:1}}>
                    <p style={{fontWeight:600,fontSize:13,color:"var(--color-text-primary)"}}>Delta Core</p>
                    <p style={{fontSize:12,color:"var(--color-text-muted)"}}>Non-direct ratio: <strong style={{color:"#f43f5e"}}>27%</strong> (3 of 11 members)</p>
                    <div style={{marginTop:8}}><div className="progress-bar"><div className="progress-fill" style={{width:"27%",background:"linear-gradient(135deg,#f43f5e,#f97316)"}}/></div></div>
                  </div>
                </div>
                <div className="alert alert-info" style={{marginTop:12}}>
                  <Activity size={14} style={{flexShrink:0}}/>
                  <span>This exceeds the recommended 20% threshold. Review reporting structure with team leader.</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* High Potential */}
      {activeSection==="highPotential"&&(
        <motion.div className="glass-card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
          <div className="card-header"><div className="card-title"><h3>High Potential Employees</h3><p>Top performers identified for growth and succession planning</p></div></div>
          <div className="table-container" style={{padding:"0 24px 24px"}}>
            <table className="data-table">
              <thead><tr><th>#</th><th>Employee</th><th>Department</th><th>Score</th><th>Trend</th><th>Key Skills</th></tr></thead>
              <tbody>
                {hpData.map((hp,i)=>(
                  <tr key={hp.name}>
                    <td>
                      <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                        background:i===0?"linear-gradient(135deg,#f59e0b,#f97316)":i===1?"linear-gradient(135deg,#94a3b8,#64748b)":"linear-gradient(135deg,#a16207,#78350f)",
                        color:"white",fontSize:12,fontWeight:700}}>
                        {i+1}
                      </div>
                    </td>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div className="user-avatar" style={{width:32,height:32,fontSize:12}}>
                          {hp.name.split(" ").map(w=>w[0]).join("")}
                        </div>
                        <div>
                          <p style={{fontWeight:600,fontSize:13,color:"var(--color-text-primary)"}}>{hp.name}</p>
                          <p style={{fontSize:11,color:"var(--color-text-muted)"}}>{hp.team}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{fontSize:13}}>{hp.department}</td>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:8,minWidth:100}}>
                        <div style={{flex:1}}><div className="progress-bar"><div className="progress-fill" style={{width:`${hp.score}%`}}/></div></div>
                        <span style={{fontSize:12,fontWeight:700,color:"var(--color-text-primary)",width:28}}>{hp.score}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{display:"flex",alignItems:"center",gap:4,color:hp.trend==="up"?"var(--color-accent-emerald)":"var(--color-text-muted)"}}>
                        {hp.trend==="up"?<TrendingUp size={14}/>:"-"} {hp.trend}
                      </span>
                    </td>
                    <td><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{hp.skills.map(s=><span key={s} className="tag tag-info" style={{fontSize:10}}>{s}</span>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Skill Gaps */}
      {activeSection==="skillGaps"&&(
        <motion.div className="glass-card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
          <div className="card-header"><div className="card-title"><h3>Critical Skill Gaps</h3><p>Skills with insufficient coverage across teams</p></div></div>
          <div className="table-container" style={{padding:"0 24px 24px"}}>
            <table className="data-table">
              <thead><tr><th>Skill</th><th>Affected</th><th>Severity</th><th>Teams</th><th>Recommended Action</th></tr></thead>
              <tbody>
                {gapsData.map(g=>(
                  <tr key={g.skill}>
                    <td style={{fontWeight:600,fontSize:13}}>{g.skill}</td>
                    <td><span style={{fontWeight:700,color:"var(--color-text-primary)"}}>{g.affected}</span> <span style={{fontSize:12,color:"var(--color-text-muted)"}}>employees</span></td>
                    <td><span className={`tag ${SEVERITY_TAG[g.severity]}`} style={{textTransform:"capitalize"}}>{g.severity}</span></td>
                    <td><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{g.teams.map(t=><span key={t} className="tag tag-default" style={{fontSize:10}}>{t}</span>)}</div></td>
                    <td style={{fontSize:12,color:"var(--color-text-secondary)"}}>{g.recommended}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Training */}
      {activeSection==="training"&&(
        <motion.div className="glass-card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
          <div className="card-header"><div className="card-title"><h3>Training Completion</h3><p>Program-level enrollment and completion rates</p></div></div>
          <div className="table-container" style={{padding:"0 24px 24px"}}>
            <table className="data-table">
              <thead><tr><th>Program</th><th>Department</th><th>Enrolled</th><th>Completed</th><th>Completion Rate</th></tr></thead>
              <tbody>
                {trainingData.map(t=>(
                  <tr key={t.program}>
                    <td style={{fontWeight:600,fontSize:13}}>{t.program}</td>
                    <td style={{fontSize:13}}>{t.department}</td>
                    <td style={{fontSize:13}}>{t.enrolled}</td>
                    <td style={{fontSize:13}}>{t.completed}</td>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:8,minWidth:120}}>
                        <div style={{flex:1}}><div className="progress-bar"><div className="progress-fill" style={{width:`${t.rate}%`,background:t.rate===100?"linear-gradient(135deg,#10b981,#06b6d4)":"var(--gradient-primary)"}}/></div></div>
                        <span style={{fontSize:12,fontWeight:700,color:t.rate===100?"var(--color-accent-emerald)":"var(--color-text-primary)",width:36}}>{t.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Attrition Risk */}
      {activeSection==="attrition"&&(
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="alert alert-warning">
            <AlertTriangle size={16} style={{flexShrink:0}}/>
            <span>{ATTRITION_RISK.length} employees show attrition risk signals. Immediate action recommended for high-risk employees.</span>
          </div>
          {riskData.map(e=>(
            <div key={e.name} className="glass-card">
              <div style={{padding:"20px 24px"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div className="user-avatar" style={{width:40,height:40,fontSize:14}}>
                      {e.name.split(" ").map(w=>w[0]).join("")}
                    </div>
                    <div>
                      <p style={{fontWeight:700,fontSize:14,color:"var(--color-text-primary)"}}>{e.name}</p>
                      <p style={{fontSize:12,color:"var(--color-text-muted)"}}>{e.team} · Last active: {e.lastActive}</p>
                    </div>
                  </div>
                  <span className={`tag ${RISK_TAG[e.riskLevel]}`} style={{textTransform:"capitalize"}}>{e.riskLevel} risk</span>
                </div>
                <div style={{marginTop:16}}>
                  <p style={{fontSize:11,fontWeight:600,color:"var(--color-text-muted)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.8px"}}>Risk Signals</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {e.signals.map(s=><span key={s} className="tag tag-danger" style={{fontSize:11}}>{s}</span>)}
                  </div>
                </div>
                <div style={{marginTop:12,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:12,color:"var(--color-text-muted)"}}>Engagement Score</span>
                  <div style={{flex:1,maxWidth:200}}><div className="progress-bar"><div className="progress-fill" style={{width:`${e.score}%`,background:"linear-gradient(135deg,#f43f5e,#f97316)"}}/></div></div>
                  <span style={{fontSize:12,fontWeight:700,color:"#f43f5e"}}>{e.score}/100</span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
