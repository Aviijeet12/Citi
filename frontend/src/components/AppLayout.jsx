import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Users2, Trophy, Database, BarChart3,
  Settings, LogOut, ShieldCheck, ChevronLeft, ChevronRight, Bell, Search,
  FileText, Tag, Activity, Menu, Star, BookOpen, Brain, GraduationCap, UserCog
} from "lucide-react";
import { useAuth, PERMISSIONS } from "../context/AuthContext";

const ROLE_BADGE = {
  admin: "badge-admin",
  manager: "badge-manager",
  contributor: "badge-contributor",
  viewer: "badge-viewer",
};

export default function AppLayout({ children }) {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const currentPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Dashboard";
    if (path.startsWith("/users")) return "Users Management";
    if (path.startsWith("/teams")) return "Teams";
    if (path.startsWith("/achievements")) return "Achievements";
    if (path.startsWith("/metadata")) return "Metadata";
    if (path.startsWith("/reports")) return "Reports";
    if (path.startsWith("/reviews")) return "Performance Reviews";
    if (path.startsWith("/plans")) return "Development Plans";
    if (path.startsWith("/competencies")) return "Competencies & Skills";
    if (path.startsWith("/training")) return "Training Records";
    if (path.startsWith("/settings")) return "Settings";
    if (path.startsWith("/audit")) return "Audit Logs";
    return "WorkForce";
  };

  const navSections = [
    {
      label: "Overview",
      items: [
        { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18}/>, always: true },
      ],
    },
    {
      label: "Management",
      items: [
        { to: "/users",        label: "Users",        icon: <Users size={18}/>,    perm: PERMISSIONS.USERS_READ },
        { to: "/teams",        label: "Teams",        icon: <Users2 size={18}/>,   perm: PERMISSIONS.TEAMS_READ },
        { to: "/achievements", label: "Achievements", icon: <Trophy size={18}/>,   perm: PERMISSIONS.ACHIEVEMENTS_READ },
      ],
    },
    {
      label: "Performance & Growth",
      items: [
        { to: "/reviews",      label: "Performance Reviews", icon: <Star size={18}/>,         perm: PERMISSIONS.REVIEWS_READ },
        { to: "/plans",        label: "Development Plans",   icon: <BookOpen size={18}/>,     perm: PERMISSIONS.PLANS_READ },
        { to: "/competencies", label: "Competencies",        icon: <Brain size={18}/>,        perm: PERMISSIONS.SKILLS_READ },
        { to: "/training",     label: "Training Records",    icon: <GraduationCap size={18}/>, perm: PERMISSIONS.TRAINING_READ },
      ],
    },
    {
      label: "Data",
      items: [
        { to: "/metadata", label: "Metadata", icon: <Tag size={18}/>,      perm: PERMISSIONS.METADATA_READ },
        { to: "/reports",  label: "Reports",  icon: <BarChart3 size={18}/>, perm: PERMISSIONS.REPORTS_READ },
      ],
    },
    {
      label: "System",
      items: [
        { to: "/audit",    label: "Audit Logs", icon: <Activity size={18}/>, adminOnly: true },
        { to: "/settings", label: "Settings",   icon: <Settings size={18}/>, always: true },
      ],
    },
  ];

  const isItemVisible = (item) => {
    if (item.always) return true;
    if (item.adminOnly) return user?.role === "admin";
    if (item.perm) return hasPermission(item.perm);
    return false;
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="sidebar-logo" style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
        <div className="sidebar-logo-icon">
          <ShieldCheck size={22} color="white" />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="brand-name">CitiBank WF</span>
            <span className="brand-tagline">Command Center</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => {
          const visible = section.items.filter(isItemVisible);
          if (!visible.length) return null;
          return (
            <div key={section.label} className="nav-section">
              {!collapsed && <p className="nav-section-label">{section.label}</p>}
              {visible.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                  title={collapsed ? item.label : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  {!collapsed && <span className="nav-item-label">{item.label}</span>}
                </NavLink>
              ))}
              {!collapsed && <div className="divider" style={{ margin: "8px 0" }} />}
            </div>
          );
        })}
      </nav>

      {/* Footer / Profile */}
      <div className="sidebar-footer">
        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="btn btn-ghost btn-sm w-full"
          style={{ justifyContent: collapsed ? "center" : "flex-end", marginBottom: 8, padding: "6px 8px" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          id="btn-sidebar-toggle"
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span style={{ fontSize: 12 }}>Collapse</span></>}
        </button>

        <div className="sidebar-user" onClick={handleLogout} title="Logout">
          <div className="user-avatar">{user?.avatar || user?.name?.[0] || "U"}</div>
          {!collapsed && (
            <div className="user-info">
              <p className="user-name truncate">{user?.name || "User"}</p>
              <p className="user-role">{user?.role?.toUpperCase()}</p>
            </div>
          )}
          {!collapsed && <LogOut size={15} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />}
        </div>
      </div>
    </>
  );

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className={`app-sidebar${collapsed ? " collapsed" : ""}`} style={{ width: collapsed ? 70 : 260 }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="app-sidebar"
              style={{ width: 260, zIndex: 200 }}
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="app-main" style={{ marginLeft: collapsed ? 70 : 260 }}>
        {/* Topbar */}
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              className="btn btn-ghost btn-icon"
              style={{ display: "flex" }}
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              id="btn-mobile-menu"
            >
              <Menu size={18} />
            </button>
            <div className="topbar-breadcrumb">
              <span>CitiBank WF</span>
              <span>/</span>
              <span className="current">{currentPageTitle()}</span>
            </div>
          </div>

          <div className="topbar-right">
            <button className="btn btn-ghost btn-icon" aria-label="Search" id="btn-topbar-search">
              <Search size={18} />
            </button>
            <button className="btn btn-ghost btn-icon" aria-label="Notifications" id="btn-topbar-notifications">
              <Bell size={18} />
              <span style={{
                position: "absolute", top: 6, right: 6, width: 6, height: 6,
                borderRadius: "50%", background: "var(--color-accent-rose)",
              }}/>
            </button>
            <span className={`topbar-badge ${ROLE_BADGE[user?.role] || "badge-viewer"}`}>
              {user?.role?.toUpperCase() || "VIEWER"}
            </span>
            <div className="user-avatar" style={{ cursor: "pointer" }} onClick={handleLogout} title="Click to logout">
              {user?.avatar || user?.name?.[0] || "U"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <motion.div
          key={location.pathname}
          className="page-content"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
