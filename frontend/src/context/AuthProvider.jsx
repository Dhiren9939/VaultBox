import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { setAccessTokenProvider, setAccessTokenUpdater } from '../service/api';

/**
 * Provides authentication state and vault keys to the app.
 * @param {{ children: React.ReactNode }} props
 */
function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState('');
  const [user, setUser] = useState(null);
  const [KEK, setKEK] = useState(null);
  const [RKEK, setRKEK] = useState(null);
  const [DEK, setDEK] = useState(null);

  const setAccessToken = (token) => {
    setAccessTokenState(token || '');
  };

  useEffect(() => {
    setAccessTokenProvider(() => accessToken);
  }, [accessToken]);

  useEffect(() => {
    setAccessTokenUpdater(setAccessTokenState);
    return () => setAccessTokenUpdater(null);
  }, [setAccessTokenState]);

  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      setKEK(null);
      setDEK(null);
      setRKEK(null);
    }
  }, [accessToken]);

  const value = {
    accessToken,
    user,
    isLoggedIn: !!accessToken,
    KEK,
    RKEK,
    DEK,
    setAccessToken,
    setUser,
    setKEK,
    setRKEK,
    setDEK,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access AuthContext.
 */
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth };
