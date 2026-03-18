import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { setAccessTokenProvider, setAccessTokenUpdater, getUserProfile } from '../service/api';
import PropTypes from 'prop-types';

function getStoredUser() {
  const rawUser = localStorage.getItem('user');
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    localStorage.removeItem('user');
    return null;
  }
}

/**
 * Provides authentication state and vault keys to the app.
 * @param {{ children: React.ReactNode }} props
 */
function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(
    localStorage.getItem('accessToken') || ''
  );
  const [user, setUserState] = useState(getStoredUser);
  const [KEK, setKEK] = useState(null);
  const [RKEK, setRKEK] = useState(null);
  const [DEK, setDEK] = useState(null);
  const [rsaPrivateKey, setRsaPrivateKey] = useState(null);

  const setAccessToken = useCallback((token) => {
    setAccessTokenState(token || '');
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }, []);

  const setUser = useCallback((nextUser) => {
    setUserState(nextUser || null);
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (accessToken && !user) {
        try {
          const { user: userData } = await getUserProfile();
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          const status = error?.response?.status;
          if (status === 401 || status === 403) {
            setAccessToken('');
            setUser(null);
          }
        }
      }
    };
    fetchUser();
  }, [accessToken, user, setAccessToken, setUser]);

  useEffect(() => {
    setAccessTokenProvider(() => accessToken);
  }, [accessToken]);

  useEffect(() => {
    // Keep interceptor-driven token updates synced with localStorage.
    setAccessTokenUpdater(setAccessToken);
    return () => setAccessTokenUpdater(null);
  }, [setAccessToken]);

  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      setKEK(null);
      setDEK(null);
      setRKEK(null);
      setRsaPrivateKey(null);
    }
  }, [accessToken, setUser]);

  const value = {
    accessToken,
    user,
    isLoggedIn: !!accessToken,
    KEK,
    RKEK,
    DEK,
    rsaPrivateKey,
    setAccessToken,
    setUser,
    setKEK,
    setRKEK,
    setDEK,
    setRsaPrivateKey,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

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
