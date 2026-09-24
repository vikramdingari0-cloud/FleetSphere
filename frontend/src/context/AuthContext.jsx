import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_USERS = [
  { role: 'Super Admin', email: 'admin@fleetsphere.com', name: 'Marcus Sterling (Global Admin)' },
  { role: 'Fleet Manager', email: 'fleet@fleetsphere.com', name: 'Helena Vance (Fleet Operations)' },
  { role: 'Branch Manager', email: 'branch.dallas@fleetsphere.com', name: 'David Kowalski (Dallas Hub)' },
  { role: 'Finance Officer', email: 'finance@fleetsphere.com', name: 'Rachel Adams (Finance & Audit)' },
  { role: 'Driver', email: 'driver.john@fleetsphere.com', name: 'John Miller (Commercial Driver)' }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fleetsphere_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('fleetsphere_token'));
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
          localStorage.setItem('fleetsphere_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Session restoration failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      const { token: receivedToken, user: userData } = res.data;
      
      setToken(receivedToken);
      setUser(userData);
      localStorage.setItem('fleetsphere_token', receivedToken);
      localStorage.setItem('fleetsphere_user', JSON.stringify(userData));
      showToast(`Welcome back, ${userData.name}! (${userData.role})`, 'success');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const demoLogin = async (roleName) => {
    const match = DEMO_USERS.find((u) => u.role === roleName);
    if (!match) return;
    return await login(match.email, 'password123');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('fleetsphere_token');
    localStorage.removeItem('fleetsphere_user');
    showToast('Logged out of session', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        demoLogin,
        logout,
        showToast,
        toast
      }}
    >
      {children}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor:
              toast.type === 'error'
                ? '#ef4444'
                : toast.type === 'info'
                ? '#0ea5e9'
                : '#10b981',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'slideUp 0.25s ease-out'
          }}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
