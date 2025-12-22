const ENVIRONMENTS = {
  staging: 'staging',
  production: 'production',
};

const LOCAL_STORAGE_KEY = 'ASHRAVI_ADMIN_ENV';

const API_BASE_URLS = {
  [ENVIRONMENTS.staging]: import.meta.env.VITE_API_BASE_URL_STAGING,
  [ENVIRONMENTS.production]: import.meta.env.VITE_API_BASE_URL_PROD,
};

const getStoredEnvironment = () => {
  if (typeof window === 'undefined') {
    return ENVIRONMENTS.staging;
  }
  const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  return stored === ENVIRONMENTS.production ? ENVIRONMENTS.production : ENVIRONMENTS.staging;
};

const setStoredEnvironment = (env) => {
  if (typeof window === 'undefined') return;
  const value = env === ENVIRONMENTS.production ? ENVIRONMENTS.production : ENVIRONMENTS.staging;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, value);
};

const getApiBaseUrl = (env) => {
  const resolvedEnv = env === ENVIRONMENTS.production ? ENVIRONMENTS.production : ENVIRONMENTS.staging;
  return API_BASE_URLS[resolvedEnv] || '';
};

export { API_BASE_URLS, ENVIRONMENTS, LOCAL_STORAGE_KEY, getApiBaseUrl, getStoredEnvironment, setStoredEnvironment };
