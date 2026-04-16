import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Eye, EyeOff, Mail, Lock, User, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth, ROLES } from "../context/AuthContext";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const roleOptions = [
  { value: ROLES.VIEWER, label: "Viewer", desc: "Read-only access to all data", color: "viewer" },
  { value: ROLES.CONTRIBUTOR, label: "Contributor", desc: "Create & update, no delete", color: "contributor" },
  { value: ROLES.MANAGER, label: "Manager", desc: "Full team & achievement control", color: "manager" },
  { value: ROLES.ADMIN, label: "Admin", desc: "Full system access + user mgmt", color: "admin" },
];

export default function SignupPage() {
  const { signup, loginWithGoogle, loginWithGitHub } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState("");
  const [error, setError] = useState("");

  const handleInput = useCallback((field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Full name is required"); return; }
    if (!form.email.includes("@")) { setError("Valid email is required"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    setError("");
    try {
      await signup({ name: form.name, email: form.email, password: form.password });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [form, signup, navigate]);

  const handleSocialLogin = useCallback(async (provider) => {
    setSocialLoading(provider);
    setError("");
    try {
      if (provider === "google") await loginWithGoogle();
      else await loginWithGitHub();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || `${provider} signup failed.`);
    } finally {
      setSocialLoading("");
    }
  }, [loginWithGoogle, loginWithGitHub, navigate]);

  return (
    <div className="auth-layout">
      <div className="auth-bg-orbs">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      {/* Left panel */}
      <div className="auth-left">
        <motion.div
          className="auth-left-content"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="auth-brand-logo">
            <ShieldCheck size={36} color="white" />
          </div>
          <h1 className="auth-left-title">Join the<br />Platform</h1>
          <p className="auth-left-desc">
            Create your account to access the WorkForce Command Center. 
            All new accounts are created as <b>Contributor</b> by default.
          </p>

          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>System Roles</p>
            {[
              { label: "Admin", desc: "admin@citi.com / 123456", color: "admin" },
              { label: "Manager", desc: "Manage team & achievements", color: "manager" },
              { label: "Contributor", desc: "New User Default - Task Access", color: "contributor" },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span className={`topbar-badge badge-${r.color}`}>{r.label}</span>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{r.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <motion.div
          className="auth-form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-form-header">
            <h2>Create account</h2>
            <p>Fill in your details to get started</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="alert alert-error"
                style={{ marginBottom: 16 }}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }}/>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Social sign up */}
            <div className="social-btn-row" style={{ marginBottom: 16 }}>
              <button className="social-btn" onClick={() => handleSocialLogin("google")} disabled={!!socialLoading || loading}>
                {socialLoading === "google" ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }}/> : <GoogleIcon />}
                Google
              </button>
              <button className="social-btn" onClick={() => handleSocialLogin("github")} disabled={!!socialLoading || loading}>
                {socialLoading === "github" ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }}/> : <GitHubIcon />}
                GitHub
              </button>
            </div>

            <div className="auth-divider" style={{ marginBottom: 16 }}>
              <div className="auth-divider-line" />
              <span>or create with email</span>
              <div className="auth-divider-line" />
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="signup-name">Full name <span className="required">*</span></label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                  <input id="signup-name" type="text" className="form-input" style={{ paddingLeft: 40 }} placeholder="Alex Johnson" value={form.name} onChange={handleInput("name")} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-email">Email address <span className="required">*</span></label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                  <input id="signup-email" type="email" className="form-input" style={{ paddingLeft: 40 }} placeholder="you@citi.com" value={form.email} onChange={handleInput("email")} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-password">Password <span className="required">*</span></label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                  <input id="signup-password" type={showPassword ? "text" : "password"} className="form-input" style={{ paddingLeft: 40, paddingRight: 40 }} placeholder="Min. 6 characters" value={form.password} onChange={handleInput("password")} required />
                  <button type="button" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }} onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-confirm">Confirm password <span className="required">*</span></label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                  <input id="signup-confirm" type={showConfirm ? "text" : "password"} className="form-input" style={{ paddingLeft: 40, paddingRight: 40 }} placeholder="Re-enter password" value={form.confirmPassword} onChange={handleInput("confirmPassword")} required />
                  <button type="button" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }} onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button id="btn-signup-submit" type="submit" className="btn btn-primary w-full btn-lg" style={{ justifyContent: "center", marginTop: 4 }} disabled={loading}>
                {loading ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> : null}
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </motion.div>

          <p className="auth-footer-link" style={{ marginTop: 20 }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
