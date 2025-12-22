class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message || 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

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

const normalizeError = (response, data) => {
  const retryAfter = response.headers?.get('Retry-After');
  const base = {
    status: response.status,
    code: data?.error?.code || response.status,
    message: data?.error?.message || data?.message || response.statusText || 'Request failed',
    details: data?.error?.details || data?.details,
  };

  if (response.status === 429) {
    const retryNote = retryAfter ? ` Please retry after ${retryAfter} seconds.` : '';
    base.message = 'Too many requests. ' + (data?.error?.message || retryNote || 'Please try again soon.');
  }

  return new ApiError(base);
};

const makeRequest = async (baseUrl, path, { method = 'GET', body, headers = {}, getAccessToken } = {}) => {
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
  const token = getAccessToken?.();

  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
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
    throw normalizeError(response, data);
  }

  return { data, status: response.status, headers: response.headers };
};

export { ApiError, makeRequest };
