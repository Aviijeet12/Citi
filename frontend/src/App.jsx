import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardHomePage from "./pages/DashboardHomePage";
import UsersPage from "./pages/UsersPage";
import TeamsPage from "./pages/TeamsPage";
import AchievementsPage from "./pages/AchievementsPage";
import MetadataPage from "./pages/MetadataPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import AuditPage from "./pages/AuditPage";
import NotFoundPage from "./pages/NotFoundPage";
import PerformanceReviewsPage from "./pages/PerformanceReviewsPage";
import DevelopmentPlansPage from "./pages/DevelopmentPlansPage";
import CompetenciesPage from "./pages/CompetenciesPage";
import TrainingPage from "./pages/TrainingPage";

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", flexDirection: "column", gap: 16,
      background: "var(--color-bg-primary)",
    }}>
      <div className="loading-spinner" />
      <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>Loading…</p>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login"  element={<PublicRoute><LoginPage  /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

      {/* Core protected routes */}
      <Route path="/dashboard"    element={<PrivateRoute><DashboardHomePage /></PrivateRoute>} />
      <Route path="/users"        element={<PrivateRoute><UsersPage        /></PrivateRoute>} />
      <Route path="/teams"        element={<PrivateRoute><TeamsPage        /></PrivateRoute>} />
      <Route path="/achievements" element={<PrivateRoute><AchievementsPage /></PrivateRoute>} />
      <Route path="/metadata"     element={<PrivateRoute><MetadataPage     /></PrivateRoute>} />
      <Route path="/reports"      element={<PrivateRoute><ReportsPage      /></PrivateRoute>} />
      <Route path="/settings"     element={<PrivateRoute><SettingsPage     /></PrivateRoute>} />

      {/* Performance & Growth routes (NEW) */}
      <Route path="/reviews"      element={<PrivateRoute><PerformanceReviewsPage /></PrivateRoute>} />
      <Route path="/plans"        element={<PrivateRoute><DevelopmentPlansPage   /></PrivateRoute>} />
      <Route path="/competencies" element={<PrivateRoute><CompetenciesPage       /></PrivateRoute>} />
      <Route path="/training"     element={<PrivateRoute><TrainingPage           /></PrivateRoute>} />

      {/* Admin-only */}
      <Route path="/audit" element={<AdminRoute><AuditPage /></AdminRoute>} />

      {/* Index redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="animated-bg-grid" />
      <AppRoutes />
    </BrowserRouter>
  );
}
