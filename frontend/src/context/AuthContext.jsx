import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const TOKEN_KEY = 'ecorent_session_token';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
const storeToken = (token) => { if (token) localStorage.setItem(TOKEN_KEY, token); };
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const authFetch = async (url, options = {}) => {
  const token = getStoredToken();
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers, credentials: 'include' });
};

const AuthProviderInner = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await authFetch(`${API_URL}/api/auth/me`);
      if (response.ok) {
        setUser(await response.json());
      } else {
        setUser(null);
        clearToken();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Login failed');
    if (data.token) storeToken(data.token);
    setUser(data);
    return data;
  };

  const register = async (name, email, password, role = 'landlord') => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Registration failed');
    if (data.token) storeToken(data.token);
    setUser(data);
    return data;
  };

  // Called with the credential (ID token) returned by Google's One Tap / button
  const loginWithGoogle = async (credential) => {
    const response = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Google sign-in failed');
    if (data.token) storeToken(data.token);
    setUser(data);
    return data;
  };

  const setRole = async (role) => {
    const response = await authFetch(`${API_URL}/api/auth/set-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!response.ok) throw new Error('Failed to set role');
    const userData = await response.json();
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await authFetch(`${API_URL}/api/auth/logout`, { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    clearToken();
  };

  const getRedirectPath = () => {
    if (!user) return '/login';
    if (user.needs_role_selection) return '/auth/callback';
    return user.role === 'tenant' ? '/tenant' : '/dashboard';
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, loading,
      login, register, loginWithGoogle, setRole, logout, checkAuth, getRedirectPath,
      isLandlord: user?.role === 'landlord',
      isTenant: user?.role === 'tenant',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }) => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || ''}>
    <AuthProviderInner>{children}</AuthProviderInner>
  </GoogleOAuthProvider>
);
