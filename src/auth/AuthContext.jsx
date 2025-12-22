import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createApiClient } from '../api/apiClientFactory';
import { getAuthConfig } from '../config/auth';
import { ENVIRONMENTS, getApiBaseUrl, getStoredEnvironment, setStoredEnvironment } from '../config/environment';
import { getCookie } from '../utils/cookies';
import { decodeJwt } from '../utils/jwt';
import { logEvent } from '../features/diagnostics/diagnosticsStore';

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [environment, setEnvironment] = useState(() => getStoredEnvironment());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const authPaths = useMemo(() => getAuthConfig(), []);

  const getAccessToken = () => getCookie('access_token');

  const handleAuthFailure = () => {
    setIsAuthenticated(false);
    setUser(null);
    logEvent('LOGOUT');
  };

  const handleApiErrorLog = (error, path) => {
    if (error?.status === 401) {
      logEvent('API_401', { path });
    }
    if (error?.status === 403) {
      logEvent('API_403', { path });
    }
    if (error?.status === 429) {
      logEvent('API_429', { path, retryAfterMs: error?.retryAfterMs });
    }
  };

  const apiClient = useMemo(() => {
    const baseUrl = getApiBaseUrl(environment) || '';
    return createApiClient({
      baseUrl,
      getAccessToken,
      onAuthFailure: handleAuthFailure,
      authPaths,
      environment,
      onApiError: handleApiErrorLog,
    });
  }, [environment, authPaths]);

  const refreshSession = async () => {
    const token = getAccessToken();

    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }

    try {
      logEvent('REFRESH_START');
      const response = await apiClient.get(authPaths.mePath);
      const payload = response?.data;
      if (payload) {
        setUser({
          userId: payload.userId || payload.sub || null,
          roles: payload.roles || [],
        });
        setIsAuthenticated(true);
        logEvent('REFRESH_SUCCESS');
        return true;
      }
    } catch (error) {
      const decoded = decodeJwt(token);
      if (decoded) {
        const roles = decoded.roles || (decoded.role ? [decoded.role] : []);
        setUser({
          userId: decoded.userId || decoded.sub || null,
          roles,
        });
        setIsAuthenticated(true);
        logEvent('REFRESH_SUCCESS');
        return true;
      }
      logEvent('REFRESH_FAIL', { status: error?.status });
    }

    setIsAuthenticated(false);
    setUser(null);
    return false;
  };

  const login = async (email, password) => {
    try {
      await apiClient.login({ email, password });
      logEvent('LOGIN_SUCCESS');
      await refreshSession();
    } catch (error) {
      logEvent('LOGIN_FAIL', { status: error?.status });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      // Ignore server-side logout errors and clear local session
    } finally {
      handleAuthFailure();
    }
  };

  const updateEnvironment = (env) => {
    const normalized = env === ENVIRONMENTS.production ? ENVIRONMENTS.production : ENVIRONMENTS.staging;
    setStoredEnvironment(normalized);
    setEnvironment(normalized);
    logEvent('ENV_CHANGED', { environment: normalized });
    handleAuthFailure();
  };

  useEffect(() => {
    let active = true;
    const validate = async () => {
      setIsLoading(true);
      await refreshSession();
      if (active) {
        setIsLoading(false);
      }
    };
    validate();
    return () => {
      active = false;
    };
  }, [environment, apiClient]);

  const value = {
    environment,
    setEnvironment: updateEnvironment,
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    refreshSession,
    apiClient,
    hasAdminRole: !!user?.roles?.includes('admin'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };
