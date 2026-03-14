import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { AuthCallback } from "@/pages/AuthCallback";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardOverview } from "@/pages/DashboardOverview";
import { PropertiesPage } from "@/pages/PropertiesPage";
import { SustainabilityPage } from "@/pages/SustainabilityPage";
import { TenantChatPage } from "@/pages/TenantChatPage";
import { LeadsPage } from "@/pages/LeadsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TenantDashboard } from "@/pages/TenantDashboard";
import { TenantLayout } from "@/components/TenantLayout";
import { TenantChatView } from "@/pages/TenantChatView";
import { TenantSettingsPage } from "@/pages/TenantSettingsPage";

const LandlordRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
        <div className="text-[#00FFAB] text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.needs_role_selection) {
    return <Navigate to="/auth/callback" replace />;
  }

  if (user.role === "tenant") {
    return <Navigate to="/tenant" replace />;
  }

  return children;
};

const TenantRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
        <div className="text-[#00FFAB] text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.needs_role_selection) {
    return <Navigate to="/auth/callback" replace />;
  }

  if (user.role === "landlord") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      <Route
        path="/dashboard"
        element={
          <LandlordRoute>
            <DashboardLayout />
          </LandlordRoute>
        }
      >
        <Route index element={<DashboardOverview />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="sustainability" element={<SustainabilityPage />} />
        <Route path="chat" element={<TenantChatPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="/tenant"
        element={
          <TenantRoute>
            <TenantLayout />
          </TenantRoute>
        }
      >
        <Route index element={<TenantDashboard />} />
        <Route path="chat" element={<TenantChatView />} />
        <Route path="settings" element={<TenantSettingsPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
