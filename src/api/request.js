import { ApiError, RateLimitError, normalizeApiError } from './errors';
import { buildRequestHeaders, getUserAgent } from './headers';

const parseJsonSafely = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (response.status === 204 || !contentType.includes('application/json')) {
    return null;
  }
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const makeRequest = async (
  baseUrl,
  path,
  { method = 'GET', body, headers = {}, getAccessToken, environment, onApiError } = {}
) => {
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
  const token = getAccessToken?.();
  const standardHeaders = buildRequestHeaders({ environment, userAgent: getUserAgent() });

  const init = {
    method,
    headers: {
      ...standardHeaders,
      ...headers,
    },
    credentials: 'include',
  };

  if (token) {
    init.headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);
  const data = await parseJsonSafely(response);

  if (!response.ok) {
    const normalizedError = normalizeApiError(response, data);
    if (normalizedError instanceof ApiError && [401, 403, 429].includes(normalizedError.status)) {
      onApiError?.(normalizedError, path);
    }
    throw normalizedError;
  }

  return { data, status: response.status, headers: response.headers };
};

export { ApiError, RateLimitError, makeRequest };
