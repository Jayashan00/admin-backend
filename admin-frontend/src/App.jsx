import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import BinsPage from './pages/BinsPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TrucksPage from './pages/TrucksPage.jsx';
import DriversPage from './pages/DriversPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import PredictionPage from './pages/PredictionPage.jsx';
import MLPanelPage from './pages/MLPanelPage.jsx';
import AlertHistoryPage from './pages/AlertHistoryPage.jsx'; // ++ Import Alert History Page ++
import AlertDropdown from './components/AlertDropdown.jsx';
import { getUnresolvedAlerts, resolveAlert } from './services/alertService';
import { getToken, removeToken } from './services/authService';
import { getCurrentUserRole } from './services/adminUserService';
import './App.css';
import './ThemeToggle.css';

// Protected Route Component
function ProtectedRoute({ isAuthenticated, children }) {
  const location = useLocation();
  if (!isAuthenticated) { return <Navigate to="/login" state={{ from: location }} replace />; }
  return children;
}

function App() {
  const [alerts, setAlerts] = useState([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertError, setAlertError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [userRole, setUserRole] = useState(isAuthenticated ? getCurrentUserRole() : null);
  const [theme, setTheme] = useState(localStorage.getItem('appTheme') || 'light');
  const navigate = useNavigate();

  // Effect for theme
  useEffect(() => { document.body.setAttribute('data-theme', theme); localStorage.setItem('appTheme', theme); }, [theme]);
  // Function to toggle theme
  const toggleTheme = () => { setTheme(prev => (prev === 'light' ? 'dark' : 'light')); };

  // --- Alert Fetching Logic ---
  const fetchAlerts = async () => { if (!getToken()) { setAlerts([]); return; } try { const response = await getUnresolvedAlerts(); setAlerts(response.data || []); setAlertError(null); } catch (err) { console.error("Error fetching alerts:", err); if (err.response && (err.response.status === 401 || err.response.status === 403)) { handleLogout(); } else { setAlertError("Failed to load alerts."); } } };
  useEffect(() => { let iId = null; if (isAuthenticated) { fetchAlerts(); iId = setInterval(fetchAlerts, 10000); } else { setAlerts([]); setIsAlertOpen(false); } return () => { if (iId) clearInterval(iId); }; }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps
  const handleResolveAlert = async (alertId) => { try { await resolveAlert(alertId); setAlerts(a => a.filter(al => al.id !== alertId)); } catch (err) { console.error("Error resolving alert:", err); alert("Failed to resolve alert."); } };
  // --- Auth Logic ---
  const handleLoginSuccess = () => { setIsAuthenticated(true); setUserRole(getCurrentUserRole()); };
  const handleLogout = () => { removeToken(); setIsAuthenticated(false); setUserRole(null); setAlerts([]); setIsAlertOpen(false); navigate('/login'); };

  const alertCount = alerts.length;
  const isSuperAdmin = userRole === 'ROLE_SUPER_ADMIN';
  const isAdminOrSuperAdmin = isSuperAdmin || userRole === 'ROLE_ADMIN';

  return (
    <div className="App">
      {/* Navbar */}
      {isAuthenticated && (
        <nav className="navbar">
          <div className="navbar-logo">SmartWaste - Colombo</div>
          <ul className="navbar-links">
            <li><Link to="/">Dashboard</Link></li>
            {isAdminOrSuperAdmin && ( <li><Link to="/predict">Predictions</Link></li> )}
            {isAdminOrSuperAdmin && ( <li><Link to="/ml-panel">ML Panel</Link></li> )}
            <li><Link to="/bins">Manage Bins</Link></li>
            <li><Link to="/trucks">Manage Trucks</Link></li>
            <li><Link to="/drivers">Manage Drivers</Link></li>
            {isSuperAdmin && ( <li><Link to="/admin/users">Manage Admins</Link></li> )}
            {/* ++ Add Alert History Link (visible to Admins) ++ */}
            {isAdminOrSuperAdmin && (
                <li><Link to="/alert-history">Alert History</Link></li>
            )}

            {/* Alert Bell */}
            <li className="alert-bell-container">
              <button onClick={() => setIsAlertOpen(!isAlertOpen)} className="alert-bell-button">🔔
                {alertCount > 0 && <span className="alert-badge">{alertCount}</span>}
              </button>
              {isAlertOpen && ( <AlertDropdown alerts={alerts} error={alertError} onResolve={handleResolveAlert} onClose={() => setIsAlertOpen(false)} /> )}
            </li>
            {/* Theme Toggle */}
             <li className="theme-toggle-container">
                 <label className="theme-switch" htmlFor="themeCheckbox">
                     <input type="checkbox" id="themeCheckbox" onChange={toggleTheme} checked={theme === 'dark'} />
                     <span className="theme-slider round"></span>
                 </label>
                 <span className="theme-label">{theme === 'light' ? '☀️' : '🌙'}</span>
             </li>
            {/* Logout Button */}
            <li><button onClick={handleLogout} className="logout-button">Logout</button></li>
          </ul>
        </nav>
      )}

      {/* Main Content */}
      <main className="main-content">
         <Routes>
           <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
           <Route path="/" element={<ProtectedRoute isAuthenticated={isAuthenticated}><DashboardPage /></ProtectedRoute>} />
           <Route path="/bins" element={<ProtectedRoute isAuthenticated={isAuthenticated}><BinsPage /></ProtectedRoute>} />
           <Route path="/trucks" element={<ProtectedRoute isAuthenticated={isAuthenticated}><TrucksPage /></ProtectedRoute>} />
           <Route path="/drivers" element={<ProtectedRoute isAuthenticated={isAuthenticated}><DriversPage /></ProtectedRoute>} />
           <Route path="/predict" element={ <ProtectedRoute isAuthenticated={isAuthenticated}> {isAdminOrSuperAdmin ? <PredictionPage /> : <Navigate to="/" replace />} </ProtectedRoute> } />
           <Route path="/ml-panel" element={ <ProtectedRoute isAuthenticated={isAuthenticated}> {isAdminOrSuperAdmin ? <MLPanelPage /> : <Navigate to="/" replace />} </ProtectedRoute> } />
           <Route path="/admin/users" element={ <ProtectedRoute isAuthenticated={isAuthenticated}> {isSuperAdmin ? <AdminUsersPage /> : <Navigate to="/" replace />} </ProtectedRoute> } />
           {/* ++ Protected Alert History Route ++ */}
           <Route
             path="/alert-history"
             element={ <ProtectedRoute isAuthenticated={isAuthenticated}> {isAdminOrSuperAdmin ? <AlertHistoryPage /> : <Navigate to="/" replace />} </ProtectedRoute> }
           />
           <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
         </Routes>
      </main>
    </div>
  );
}

export default App;