import React, { useState, useEffect, useRef, useContext } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { LandingPage, LoginPage, RegisterPage, AuthCallback, AuthContext, API, ResetPasswordPage, ConfirmEmailPage } from "./App";
import { Dashboard } from "./Dashboard";
import PublicProfile, { ProfileByUserId } from "./PublicProfile";
import { CardScanner, CardActivation, LoadingSpinner } from "./CardActivation";
import "./index.css";
import "./App.css";

// ============ TOKEN-BASED AUTH SYSTEM ============
// Store token in localStorage and send via Authorization header
// This avoids cross-origin cookie issues

const TOKEN_KEY = 'flexcard_token';
const USER_KEY = 'flexcard_user';

// Configure axios interceptor to add Authorization header
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Handle 401 responses globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on 401
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    return Promise.reject(error);
  }
);

// Helper functions for auth storage
const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
  getUser: () => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },
  setUser: (user) => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

// Auth Provider
const AuthProvider = ({ children }) => {
  // Initialize from localStorage synchronously
  const [user, setUser] = useState(() => authStorage.getUser());
  const [isReady, setIsReady] = useState(true);

  const login = (userData) => {
    // Extract and store token separately
    const { session_token, ...userWithoutToken } = userData;
    if (session_token) {
      authStorage.setToken(session_token);
    }
    authStorage.setUser(userWithoutToken);
    setUser(userWithoutToken);
  };

  const logout = () => {
    authStorage.clear();
    setUser(null);
    // Notify server (fire and forget)
    axios.post(`${API}/auth/logout`, {}).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isReady }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const token = authStorage.getToken();

  // If no user AND no token, redirect to login
  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Guest Route
const GuestRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const token = authStorage.getToken();

  // If user OR token exists, redirect to dashboard
  if (user || token) {
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

// Render
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

export default App;
