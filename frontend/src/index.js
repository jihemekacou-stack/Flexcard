import React, { useState, useEffect, useRef, useContext } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { LandingPage, LoginPage, RegisterPage, AuthCallback, AuthContext, API, ResetPasswordPage, ConfirmEmailPage } from "./App";
import { Dashboard } from "./Dashboard";
import PublicProfile, { ProfileByUserId } from "./PublicProfile";
import { CardScanner, CardActivation } from "./CardActivation";
import "./index.css";
import "./App.css";

// Auth Provider - Simple session-based auth
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Try to get user from localStorage on initial load
    const savedUser = localStorage.getItem('flexcard_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`);
        if (isMounted) {
          setUser(response.data);
          localStorage.setItem('flexcard_user', JSON.stringify(response.data));
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          localStorage.removeItem('flexcard_user');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setAuthChecked(true);
        }
      }
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('flexcard_user', JSON.stringify(userData));
  };
  
  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {});
    } catch (err) {
      console.error(err);
    }
    setUser(null);
    localStorage.removeItem('flexcard_user');
  };

  // Show loading only on first check, not on subsequent renders
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading: !authChecked }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Guest Route - Redirects authenticated users to dashboard
const GuestRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

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
      <Route path="/profile/:userId" element={<ProfileByUserId />} />
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
