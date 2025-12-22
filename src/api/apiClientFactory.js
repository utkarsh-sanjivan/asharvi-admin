import { ApiError, makeRequest } from './request';

const createApiClient = ({ baseUrl, getAccessToken, onAuthFailure, authPaths }) => {
  let refreshPromise = null;

  const callRequest = (path, options = {}) =>
    makeRequest(baseUrl, path, {
      ...options,
      getAccessToken,
    });

  const refreshAccessToken = async () => {
    if (!refreshPromise) {
      refreshPromise = callRequest(authPaths.refreshPath, { method: 'POST', skipRefresh: true }).finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  };

  const requestWithRefresh = async (path, options = {}) => {
    const isAuthRoute =
      path === authPaths.loginPath || path === authPaths.refreshPath || path === authPaths.logoutPath;

    const attemptRequest = async (hasRetried = false) => {
      try {
        return await callRequest(path, options);
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 401 &&
          !isAuthRoute &&
          options.skipRefresh !== true &&
          !hasRetried
        ) {
          try {
            await refreshAccessToken();
            return await attemptRequest(true);
          } catch (refreshError) {
            onAuthFailure?.();
            throw refreshError instanceof ApiError ? refreshError : error;
          }
        }
        throw error;
      }
    };

    return attemptRequest();
  };

  const get = (path, options) => requestWithRefresh(path, { ...options, method: 'GET' });
  const post = (path, body, options = {}) => requestWithRefresh(path, { ...options, body, method: 'POST' });
  const put = (path, body, options = {}) => requestWithRefresh(path, { ...options, body, method: 'PUT' });
  const patch = (path, body, options = {}) => requestWithRefresh(path, { ...options, body, method: 'PATCH' });
  const del = (path, options = {}) => requestWithRefresh(path, { ...options, method: 'DELETE' });

  return {
    get,
    post,
    put,
    patch,
    delete: del,
    refresh: () => callRequest(authPaths.refreshPath, { method: 'POST', skipRefresh: true }),
    login: (credentials) => callRequest(authPaths.loginPath, { method: 'POST', body: credentials, skipRefresh: true }),
    logout: () => callRequest(authPaths.logoutPath, { method: 'POST', skipRefresh: true }),
  };
};

export { createApiClient };
