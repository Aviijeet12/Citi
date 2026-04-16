import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, Globe, Check, Loader2, AlertCircle, Moon, Zap, Database, Key } from "lucide-react";
import { useAuth, ROLES } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function SettingsPage() {
  const { user, hasRole } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    department: user?.department || "",
    bio: "Passionate about building high-performing engineering teams.",
    timezone: "America/New_York",
  });

  const [notifs, setNotifs] = useState({
    emailDigest: true,
    achievementAlerts: true,
    teamUpdates: true,
    reportReady: false,
    weeklyReport: true,
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: "60",
    passwordExpiry: "90",
  });

  const handleSave = async (section = "Settings") => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    toast(`${section} updated successfully`, "success");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <User size={16}/> },
    { id: "notifications", label: "Notifications", icon: <Bell size={16}/> },
    { id: "security", label: "Security", icon: <Shield size={16}/> },
    ...(hasRole(ROLES.ADMIN) ? [{ id: "system", label: "System", icon: <Globe size={16}/> }] : []),
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Manage your account preferences and system configuration</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
        {/* Settings Nav */}
        <div className="glass-card" style={{ padding: "12px 0", height: "fit-content" }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`nav-item${activeTab === t.id ? " active" : ""}`}
              style={{ border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", margin: "2px 8px", width: "calc(100% - 16px)" }}
              id={`btn-settings-tab-${t.id}`}
            >
              <span className="nav-item-icon">{t.icon}</span>
              <span className="nav-item-label">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>

          {activeTab === "profile" && (
            <div className="glass-card">
              <div className="card-header">
                <div className="card-title"><h3>Profile Information</h3><p>Update your personal details</p></div>
              </div>
              <div className="card-body">
                {/* Avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, padding: "16px 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div className="user-avatar" style={{ width: 64, height: 64, fontSize: 22 }}>{user?.avatar || user?.name?.[0] || "U"}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text-primary)" }}>{user?.name}</p>
                    <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{user?.role?.toUpperCase()} · {user?.department}</p>
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}>Change Avatar</button>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} id="input-profile-name"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} id="input-profile-email"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input className="form-input" value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))} id="input-profile-dept"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Timezone</label>
                    <select className="form-select" value={profile.timezone} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}>
                      <option value="America/New_York">Eastern Time (US)</option>
                      <option value="America/Los_Angeles">Pacific Time (US)</option>
                      <option value="Europe/London">London</option>
                      <option value="Asia/Kolkata">India Standard Time</option>
                      <option value="Asia/Singapore">Singapore</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label className="form-label">Bio</label>
                  <textarea className="form-textarea" rows={3} value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} style={{ resize: "vertical" }}/>
                </div>
              </div>
              <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-primary" onClick={() => handleSave("Profile")} disabled={loading} id="btn-save-profile">
                  {loading ? <Loader2 size={15} className="spin"/> : <Check size={15}/>}
                  {loading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="glass-card">
              <div className="card-header">
                <div className="card-title"><h3>Notification Preferences</h3><p>Control what and how you get notified</p></div>
              </div>
              <div className="card-body">
                {[
                  { key: "emailDigest", label: "Email Digest", desc: "Daily summary of activity across your teams" },
                  { key: "achievementAlerts", label: "Achievement Alerts", desc: "Notify when a new achievement is logged for your teams" },
                  { key: "teamUpdates", label: "Team Updates", desc: "Member additions, removals, and role changes" },
                  { key: "reportReady", label: "Report Ready", desc: "When an async report job completes" },
                  { key: "weeklyReport", label: "Weekly Report", desc: "Automated weekly performance summary" },
                ].map(n => (
                  <div key={n.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>{n.label}</p>
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{n.desc}</p>
                    </div>
                    <label style={{ position: "relative", width: 44, height: 24, cursor: "pointer" }}>
                      <input type="checkbox" checked={notifs[n.key]} onChange={e => setNotifs(p => ({ ...p, [n.key]: e.target.checked }))} style={{ opacity: 0, position: "absolute" }} id={`toggle-${n.key}`}/>
                      <div style={{
                        width: 44, height: 24, borderRadius: 12, transition: "0.25s",
                        background: notifs[n.key] ? "var(--color-accent-primary)" : "rgba(99,102,241,0.15)",
                        border: "1px solid", borderColor: notifs[n.key] ? "var(--color-accent-primary)" : "var(--color-border)",
                        position: "relative",
                      }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: "50%", background: "white",
                          position: "absolute", top: 2, left: notifs[n.key] ? 22 : 2, transition: "0.25s",
                        }}/>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-primary" onClick={() => handleSave("Notification preferences")} disabled={loading} id="btn-save-notifs">
                  {loading ? <Loader2 size={15} className="spin"/> : <Check size={15}/>}
                  {loading ? "Saving…" : "Save Preferences"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="glass-card">
                <div className="card-header"><div className="card-title"><h3>Password</h3><p>Update your login password</p></div></div>
                <div className="card-body">
                  <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" placeholder="••••••••" id="input-current-pw"/></div>
                  <div className="form-grid" style={{ marginTop: 12 }}>
                    <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" placeholder="••••••••" id="input-new-pw"/></div>
                    <div className="form-group"><label className="form-label">Confirm New</label><input className="form-input" type="password" placeholder="••••••••" id="input-confirm-pw"/></div>
                  </div>
                </div>
                <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" id="btn-update-password" onClick={() => handleSave("Password")}>Update Password</button>
                </div>
              </div>

              <div className="glass-card">
                <div className="card-header"><div className="card-title"><h3>Two-Factor Authentication</h3><p>Secure your account with 2FA</p></div></div>
                <div className="card-body">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>Enable 2FA</p>
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Use an authenticator app or SMS for additional security</p>
                    </div>
                    <span className={`tag ${security.twoFactor ? "tag-success" : "tag-danger"}`}>{security.twoFactor ? "Enabled" : "Disabled"}</span>
                  </div>
                  <button className={`btn ${security.twoFactor ? "btn-danger" : "btn-primary"} btn-sm`} style={{ marginTop: 12 }} onClick={() => {
                    setSecurity(p => ({ ...p, twoFactor: !p.twoFactor }));
                    toast(`2FA ${!security.twoFactor ? 'enabled' : 'disabled'}`, 'info');
                  }} id="btn-toggle-2fa">
                    {security.twoFactor ? "Disable 2FA" : "Enable 2FA"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "system" && hasRole(ROLES.ADMIN) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="alert alert-info">
                <AlertCircle size={16} style={{ flexShrink: 0 }}/>
                <span>System settings affect all users. Changes take effect immediately.</span>
              </div>
              <div className="glass-card">
                <div className="card-header"><div className="card-title"><h3>Platform Configuration</h3><p>Global system settings (Admin only)</p></div></div>
                <div className="card-body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Session Timeout (minutes)</label>
                      <input className="form-input" type="number" value={security.sessionTimeout} onChange={e => setSecurity(p => ({ ...p, sessionTimeout: e.target.value }))} id="input-session-timeout"/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password Expiry (days)</label>
                      <input className="form-input" type="number" value={security.passwordExpiry} onChange={e => setSecurity(p => ({ ...p, passwordExpiry: e.target.value }))} id="input-pw-expiry"/>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                    {[
                      { icon:<Database size={16}/>, label:"Database Backup", desc:"Last backup: 2 hours ago", action:"Trigger Backup", color:"#6366f1" },
                      { icon:<Key size={16}/>, label:"API Keys", desc:"3 active service tokens", action:"Manage Keys", color:"#8b5cf6" },
                      { icon:<Zap size={16}/>, label:"Cache", desc:"Redis cache (128MB used)", action:"Clear Cache", color:"#f59e0b" },
                    ].map(item => (
                      <div key={item.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid var(--color-border)" }}>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <div style={{width:32,height:32,borderRadius:"var(--radius-sm)",background:`${item.color}18`,display:"flex",alignItems:"center",justifyContent:"center",color:item.color}}>{item.icon}</div>
                          <div>
                            <p style={{fontWeight:600,fontSize:13,color:"var(--color-text-primary)"}}>{item.label}</p>
                            <p style={{fontSize:12,color:"var(--color-text-muted)"}}>{item.desc}</p>
                          </div>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => toast(`${item.label} action triggered`, 'info')}>{item.action}</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" onClick={() => handleSave("System configuration")} disabled={loading} id="btn-save-system">
                    {loading ? <Loader2 size={15} className="spin"/> : <Check size={15}/>}
                    {loading ? "Saving…" : "Save System Config"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
