import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-bg-primary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 24,
      textAlign: "center",
      padding: 32,
      position: "relative",
    }}>
      <div className="animated-bg-grid" />
      <div className="auth-bg-orbs">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ position: "relative", zIndex: 1 }}
      >
        <div style={{
          fontSize: 120,
          fontFamily: "'Outfit',sans-serif",
          fontWeight: 900,
          lineHeight: 1,
          background: "var(--gradient-primary)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 8,
        }}>404</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8 }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: 15, color: "var(--color-text-muted)", maxWidth: 360, margin: "0 auto 32px" }}>
          The page you're looking for doesn't exist or you don't have permission to access it.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link to="/dashboard" className="btn btn-primary">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <Link to="/login" className="btn btn-ghost">
            <ShieldCheck size={16} /> Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
