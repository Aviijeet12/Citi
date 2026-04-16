import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2,
  ShieldCheck
} from "lucide-react";

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

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState("");
  const [error, setError] = useState("");
  const { login, loginWithGoogle, loginWithGitHub } = useAuth();
  const navigate = useNavigate();

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleInput = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setSocialLoading(provider);
    setError("");
    try {
      if (provider === "google") await loginWithGoogle();
      else await loginWithGitHub();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || `${provider} login failed.`);
    } finally {
      setSocialLoading("");
    }
  };

  const isMobile = window.innerWidth < 1024;

  const styles = {
    layout: {
      display: "flex",
      height: "100vh",
      width: "100vw",
      backgroundColor: "#000000",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif"
    },
    leftPanel: {
      flex: 1.2,
      position: "relative",
      display: isMobile ? "none" : "block",
      overflow: "hidden",
      borderRight: "1px solid rgba(255,255,255,0.05)"
    },
    image: {
      position: "absolute",
      width: "100%",
      height: "100%",
      objectFit: "cover",
      filter: "contrast(1.2) brightness(0.8)"
    },
    gradientOverlay: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(to right, transparent 0%, #000000 100%)",
      zIndex: 1
    },
    rightPanel: {
      flex: 1,
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isMobile ? "20px" : "40px",
      minWidth: "400px",
      maxWidth: "700px",
      backgroundColor: "#000000",
      overflow: "hidden"
    },
    orb1: { position: "absolute", top: "10%", left: "20%", width: "40vh", height: "40vh", background: "#4f46e5", filter: "blur(100px)", opacity: 0.4, borderRadius: "50%", zIndex: 0 },
    orb2: { position: "absolute", bottom: "10%", right: "10%", width: "50vh", height: "50vh", background: "#0ea5e9", filter: "blur(120px)", opacity: 0.3, borderRadius: "50%", zIndex: 0 },
    
    glassCardWrapper: {
      width: "100%",
      maxWidth: "420px",
      position: "relative",
      zIndex: 10,
      cursor: "default"
    },
    glassCard: {
      width: "100%",
      padding: "40px 32px",
      background: "rgba(10, 10, 10, 0.4)",
      backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)",
      borderRadius: "24px",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
      position: "relative",
      overflow: "hidden"
    },
    input: {
      width: "100%",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px",
      padding: "14px 16px 14px 44px",
      color: "#ffffff",
      fontSize: "14px",
      transition: "all 0.3s ease",
      outline: "none"
    },
    icon: { position: "absolute", left: "14px", top: "15px", color: "#64748b", transition: "color 0.3s ease" },
    btnPrimary: {
      width: "100%",
      padding: "14px",
      background: "#ffffff",
      color: "#000000",
      border: "none",
      borderRadius: "12px",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      transition: "transform 0.1s, background 0.3s",
      marginTop: "16px"
    },
    socialBtn: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      padding: "12px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease"
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
  };

  return (
    <div style={styles.layout}>
      <div style={styles.leftPanel}>
        <motion.img 
           src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000"
           alt="Citi Hub AI" 
           style={styles.image}
           initial={{ scale: 1.05 }}
           animate={{ scale: 1 }}
           transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <div style={styles.gradientOverlay} />
        
        <div style={{ position: "absolute", bottom: "8%", left: "8%", zIndex: 10 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ padding: "10px", background: "#ffffff", borderRadius: "12px" }}>
                <Building2 size={20} color="#000000" />
              </div>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "1px" }}>CITI HUB</span>
            </div>
            <p style={{ color: "#94a3b8", fontSize: "16px", maxWidth: "400px", lineHeight: 1.5 }}>
              Enterprise resource synchronization platform.
            </p>
          </motion.div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <motion.div style={styles.orb1} animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div style={styles.orb2} animate={{ x: [0, 40, 0], scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />

        <div 
          style={styles.glassCardWrapper}
          onMouseMove={handleMouseMove}
        >
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={styles.glassCard}>
            <div style={{
              position: "absolute",
              top: mousePosition.y - 300,
              left: mousePosition.x - 300,
              width: 600,
              height: 600,
              background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%)",
              pointerEvents: "none",
              zIndex: 0,
              transition: "opacity 0.3s"
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <motion.div variants={fadeInUp} style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", marginBottom: 4 }}>Access Node</h2>
                <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>Securely authenticate your session.</p>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }} 
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: "hidden", marginBottom: 16 }}
                  >
                    <div style={{ padding: "10px 14px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.2)", display: "flex", gap: 10, alignItems: "center" }}>
                      <ShieldCheck size={16} style={{ color: "#ef4444" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#fca5a5" }}>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={fadeInUp} style={{ display: "flex", gap: "12px", marginBottom: 20 }}>
                <motion.button
                  whileHover={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  style={styles.socialBtn}
                  onClick={() => handleSocialLogin("google")}
                  disabled={!!socialLoading}
                >
                  {socialLoading === "google" ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
                  <span>Google</span>
                </motion.button>
                <motion.button
                  whileHover={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  style={styles.socialBtn}
                  onClick={() => handleSocialLogin("github")}
                  disabled={!!socialLoading}
                >
                  {socialLoading === "github" ? <Loader2 size={18} className="animate-spin" /> : <GitHubIcon />}
                  <span>GitHub</span>
                </motion.button>
              </motion.div>

              <motion.div variants={fadeInUp} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: 20 }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
                <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>OR</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
              </motion.div>

              <form onSubmit={handleSubmit}>
                <motion.div variants={fadeInUp} style={{ marginBottom: 16 }}>
                  <div style={{ position: "relative" }}>
                    <Mail style={styles.icon} size={18} />
                    <input
                      type="email"
                      style={styles.input}
                      placeholder="Email Address"
                      value={form.email}
                      onChange={handleInput("email")}
                      required
                    />
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} style={{ marginBottom: 16 }}>
                  <div style={{ position: "relative" }}>
                    <Lock style={styles.icon} size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      style={{ ...styles.input, paddingRight: "44px" }}
                      placeholder="Password"
                      value={form.password}
                      onChange={handleInput("password")}
                      required
                    />
                    <button
                      type="button"
                      style={{ position: "absolute", right: 14, top: "15px", background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0 }}
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <motion.button
                    type="submit"
                    style={{ ...styles.btnPrimary, cursor: loading ? "wait" : "pointer" }}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Authenticate"}
                    {!loading && <ArrowRight size={18} />}
                  </motion.button>
                </motion.div>
              </form>

              <motion.div variants={fadeInUp} style={{ marginTop: 24, textAlign: "center" }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>
                  Don't have an account?{" "}
                  <Link to="/signup" style={{ color: "#fff", fontWeight: 600, textDecoration: "none" }}>
                    Sign Up
                  </Link>
                </span>
              </motion.div>

              <motion.div variants={fadeInUp} style={{ marginTop: 24, display: "flex", gap: "8px" }}>
                {[
                  { email: "admin@citi.com", pass: "123456", label: "Admin" },
                  { email: "employee@citi.com", pass: "password", label: "User" }
                ].map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => setForm({ email: acc.email, password: acc.pass })}
                    type="button"
                    style={{ flex: 1, padding: "8px", background: "transparent", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "8px", color: "#94a3b8", fontSize: "11px", cursor: "pointer", transition: "all 0.2s" }}
                  >
                     Log in as {acc.label}
                  </button>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
