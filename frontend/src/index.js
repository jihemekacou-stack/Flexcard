import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { LandingPage, LoginPage, RegisterPage, AuthCallback, AuthContext, API, ResetPasswordPage, ConfirmEmailPage } from "./App";
import { Dashboard } from "./Dashboard";
import PublicProfile, { ProfileByUserId } from "./PublicProfile";
import { CardScanner, CardActivation } from "./CardActivation";
import "./index.css";
import "./App.css";

// Configure axios globally
axios.defaults.withCredentials = true;

// Helper to safely get/set localStorage
const storage = {
  getUser: () => {
    try {
      const data = localStorage.getItem('flexcard_user');
      return data ? JSON.parse(data) : null;
    } catch {
      localStorage.removeItem('flexcard_user');
      return null;
    }
  },
  setUser: (user) => {
    if (user) {
      localStorage.setItem('flexcard_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('flexcard_user');
    }
  }
};

// Auth Provider - Optimized to prevent flickering
const AuthProvider = ({ children }) => {
  // Initialize synchronously from localStorage - CRITICAL for preventing flicker
  const initialUser = storage.getUser();
  const [user, setUser] = useState(initialUser);
  const [isInitialized, setIsInitialized] = useState(true); // Start as true if we have cached user
  const mounted = useRef(true);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Skip if already checked or if we have a user
    if (hasChecked.current || initialUser) return;
    hasChecked.current = true;
    mounted.current = true;

    // Only verify with server if no cached user
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API}/auth/me`);
        if (mounted.current) {
          setUser(res.data);
          storage.setUser(res.data);
        }
      } catch {
        // Not logged in - that's fine
      } finally {
        if (mounted.current) {
          setIsInitialized(true);
        }
      }
    };

    checkAuth();

    return () => {
      mounted.current = false;
    };
  }, [initialUser]);

  const login = (userData) => {
    setUser(userData);
    storage.setUser(userData);
  };

  const logout = () => {
    setUser(null);
    storage.setUser(null);
    axios.post(`${API}/auth/logout`, {}).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route - Only redirect if definitely not logged in
const ProtectedRoute = ({ children }) => {
  const { user, isInitialized } = useContext(AuthContext);

  // Wait for auth check to complete
  if (!isInitialized) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Guest Route - Only redirect if definitely logged in
const GuestRoute = ({ children }) => {
  const { user, isInitialized } = useContext(AuthContext);

  // Wait for auth check to complete
  if (!isInitialized) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Router
const AppRouter = () => {
  const location = useLocation();

  // Check for OAuth callback
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
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/u/:username" element={<PublicProfile />} />
      <Route path="/profile/:userId" element={<ProfileByUserId />} />
      <Route path="/c/:cardId" element={<CardScanner />} />
      <Route path="/activate/:cardId" element={<CardActivation />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// App Component
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

// Render without StrictMode to prevent double renders
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

export default App;
