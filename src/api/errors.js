import { ENVIRONMENTS } from '../config/environment';

class ApiError extends Error {
  constructor({ status, code, message, details, retryAfterMs }) {
    super(message || 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfterMs = retryAfterMs || null;
  }
}

class RateLimitError extends ApiError {
  constructor({ status, code, message, details, retryAfterMs }) {
    super({
      status: status || 429,
      code: code || 429,
      message: message || 'Too many requests. Please wait before retrying.',
      details,
      retryAfterMs,
    });
    this.name = 'RateLimitError';
  }
}

const parseRetryAfterHeader = (value) => {
  if (!value) return null;
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && asNumber >= 0) {
    return asNumber * 1000;
  }
  const asDate = Date.parse(value);
  if (!Number.isNaN(asDate)) {
    const diff = asDate - Date.now();
    return diff > 0 ? diff : 0;
  }
  return null;
};

const normalizeApiError = (response, data) => {
  const retryAfter = response?.headers?.get?.('Retry-After');
  const retryAfterMs = parseRetryAfterHeader(retryAfter);
  const base = {
    status: response?.status,
    code: data?.error?.code || response?.status,
    message: data?.error?.message || data?.message || response?.statusText || 'Request failed',
    details: data?.error?.details || data?.details,
    retryAfterMs,
  };

  if (response?.status === 429) {
    return new RateLimitError({
      ...base,
      message:
        base.message || (retryAfterMs ? 'Rate limit reached. Please wait a moment.' : 'Rate limit reached.'),
    });
  }

  return new ApiError(base);
};

const formatRetryAfter = (retryAfterMs) => {
  if (!retryAfterMs) return null;
  const seconds = Math.max(0, Math.ceil(retryAfterMs / 1000));
  return seconds <= 1 ? '1 second' : `${seconds} seconds`;
};

const mapApiErrorToDisplay = (error, { resourceLabel } = {}) => {
  const status = error?.status;
  const retryAfter = formatRetryAfter(error?.retryAfterMs);
  const fallbackDescription = resourceLabel ? `Unable to load ${resourceLabel}. Please try again.` : 'Request failed.';

  const base = {
    title: 'Request failed',
    description: error?.message || fallbackDescription,
    severity: 'error',
    suggestedAction: 'Please try again.',
    canRetry: true,
  };

  if (status === 401) {
    return {
      ...base,
      title: 'Session expired',
      description: 'Your session has expired. Please sign in again.',
      suggestedAction: 'Sign in',
      canRetry: false,
    };
  }

  if (status === 403) {
    return {
      ...base,
      title: 'Access denied',
      description: 'You do not have permission to perform this action.',
      suggestedAction: 'Switch accounts or request access.',
      canRetry: false,
      severity: 'warning',
    };
  }

  if (status === 404) {
    return {
      ...base,
      title: 'Not found',
      description: resourceLabel
        ? `${resourceLabel} could not be found or was removed.`
        : 'The requested item could not be found.',
      suggestedAction: 'Return to the previous page.',
      canRetry: false,
      severity: 'warning',
    };
  }

  if (status === 409) {
    return {
      ...base,
      title: 'Conflict',
      description: error?.message || 'This resource is in a conflicting state. Please refresh and try again.',
      suggestedAction: 'Refresh and try again.',
      canRetry: true,
    };
  }

  if (status === 429 || error instanceof RateLimitError) {
    return {
      ...base,
      title: 'Rate limit reached',
      description:
        retryAfter || error?.message
          ? `${error?.message || 'Too many requests.'}${retryAfter ? ` Try again in ${retryAfter}.` : ''}`
          : 'Too many requests. Please slow down and retry shortly.',
      suggestedAction: retryAfter ? `Retry after ${retryAfter}.` : 'Retry shortly.',
      canRetry: true,
      severity: 'warning',
    };
  }

  if (status >= 500) {
    return {
      ...base,
      title: 'Server error',
      description: 'We hit a server issue. Please try again shortly.',
      suggestedAction: 'Retry or contact an administrator if the issue persists.',
      canRetry: true,
    };
  }

  return {
    ...base,
    description: error?.message || fallbackDescription,
  };
};

const resolveEnvironmentValue = (env) => (env === ENVIRONMENTS.production ? ENVIRONMENTS.production : ENVIRONMENTS.staging);

export {
  ApiError,
  RateLimitError,
  formatRetryAfter,
  mapApiErrorToDisplay,
  normalizeApiError,
  parseRetryAfterHeader,
  resolveEnvironmentValue,
};
