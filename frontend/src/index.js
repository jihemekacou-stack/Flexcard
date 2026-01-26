import React, { useState, useEffect, useRef, useContext } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { LandingPage, LoginPage, RegisterPage, AuthCallback, AuthContext, API, ResetPasswordPage, ConfirmEmailPage } from "./App";
import { Dashboard } from "./Dashboard";
import PublicProfile from "./PublicProfile";
import { CardScanner, CardActivation } from "./CardActivation";
import "./index.css";
import "./App.css";

// Auth Provider - Simple session-based auth
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
        setUser(response.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = (userData) => setUser(userData);
  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error(err);
    }
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 gradient-bg rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { user, loading } = useContext(AuthContext);

  // If user data was passed from AuthCallback, render immediately
  if (location.state?.user) {
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 gradient-bg rounded-full animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Guest Route - Redirects authenticated users to dashboard
const GuestRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 gradient-bg rounded-full animate-pulse" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Router
const AppRouter = () => {
  const location = useLocation();

  // Check for session_id in hash synchronously (CRITICAL for OAuth)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  // Handle Supabase auth callbacks (email confirmation, password reset)
  if (location.hash?.includes("access_token=") || location.hash?.includes("type=recovery")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/auth/confirm" element={<ConfirmEmailPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/u/:username" element={<PublicProfile />} />
      {/* Physical Card Routes */}
      <Route path="/c/:cardId" element={<CardScanner />} />
      <Route path="/activate/:cardId" element={<CardActivation />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

// Render App
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export default App;
