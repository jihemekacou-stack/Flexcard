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

// Configure axios to send cookies with every request
axios.defaults.withCredentials = true;

// Auth Provider - Stable session-based auth without flickering
const AuthProvider = ({ children }) => {
  // Initialize user from localStorage synchronously to avoid flash
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('flexcard_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [isReady, setIsReady] = useState(false);
  const authCheckDone = useRef(false);
  const justLoggedIn = useRef(false);

  useEffect(() => {
    // Prevent double auth check in StrictMode
    if (authCheckDone.current) return;
    authCheckDone.current = true;
    
    // If user just logged in (has data in localStorage), skip the server check
    // This prevents the flickering caused by auth/me returning 401 briefly
    const savedUser = localStorage.getItem('flexcard_user');
    if (savedUser) {
      setIsReady(true);
      return;
    }
    
    // Only check auth if no cached user
    const verifyAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`);
        const userData = response.data;
        setUser(userData);
        localStorage.setItem('flexcard_user', JSON.stringify(userData));
      } catch (err) {
        // User is not logged in, that's fine
        setUser(null);
        localStorage.removeItem('flexcard_user');
      } finally {
        setIsReady(true);
      }
    };
    
    verifyAuth();
  }, []);

  const login = (userData) => {
    justLoggedIn.current = true;
    setUser(userData);
    localStorage.setItem('flexcard_user', JSON.stringify(userData));
  };
  
  const logout = () => {
    // Clear immediately for instant UI feedback
    setUser(null);
    localStorage.removeItem('flexcard_user');
    // Then notify server (fire and forget)
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

// Render App - Without StrictMode to prevent double renders and flickering
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

export default App;
