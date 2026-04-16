import { createContext, useCallback, useContext, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle2 size={16} />,
  error:   <AlertCircle  size={16} />,
  warning: <AlertTriangle size={16} />,
  info:    <Info          size={16} />,
};

const COLORS = {
  success: { icon: "var(--color-accent-emerald)", border: "rgba(16,185,129,0.3)" },
  error:   { icon: "var(--color-accent-rose)",    border: "rgba(244,63,94,0.3)" },
  warning: { icon: "var(--color-accent-amber)",   border: "rgba(245,158,11,0.3)" },
  info:    { icon: "var(--color-accent-cyan)",    border: "rgba(6,182,212,0.3)" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const id = useRef(0);

  const push = useCallback((msg, type = "success", duration = 3500) => {
    const toastId = ++id.current;
    setToasts(t => [...t, { id: toastId, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== toastId)), duration);
  }, []);

  const dismiss = useCallback((toastId) => {
    setToasts(t => t.filter(x => x.id !== toastId));
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        display: "flex", flexDirection: "column-reverse", gap: 10, width: 360,
        pointerEvents: "none",
      }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0,  scale: 1    }}
              exit={{    opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{
                background: "#0d1528",
                border: `1px solid ${COLORS[t.type]?.border || "var(--color-border)"}`,
                borderRadius: "var(--radius-md)",
                padding: "14px 16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                display: "flex", alignItems: "flex-start", gap: 12,
                pointerEvents: "auto",
              }}
            >
              <span style={{ color: COLORS[t.type]?.icon, flexShrink: 0, marginTop: 1 }}>
                {ICONS[t.type]}
              </span>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", flex: 1, lineHeight: 1.5 }}>{t.msg}</p>
              <button
                onClick={() => dismiss(t.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", flexShrink: 0, display: "flex", padding: 0 }}
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
