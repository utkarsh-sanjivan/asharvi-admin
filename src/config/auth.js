const AUTH_DEFAULTS = {
  loginPath: '/auth/login',
  refreshPath: '/auth/refresh',
  logoutPath: '/auth/logout',
  mePath: '/auth/me',
};

const getAuthConfig = () => ({
  loginPath: import.meta.env.VITE_AUTH_LOGIN_PATH || AUTH_DEFAULTS.loginPath,
  refreshPath: import.meta.env.VITE_AUTH_REFRESH_PATH || AUTH_DEFAULTS.refreshPath,
  logoutPath: import.meta.env.VITE_AUTH_LOGOUT_PATH || AUTH_DEFAULTS.logoutPath,
  mePath: import.meta.env.VITE_AUTH_ME_PATH || AUTH_DEFAULTS.mePath,
});

export { AUTH_DEFAULTS, getAuthConfig };
