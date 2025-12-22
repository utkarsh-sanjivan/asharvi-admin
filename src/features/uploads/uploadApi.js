import { getApiBaseUrl, ENVIRONMENTS, getStoredEnvironment } from '../../config/environment';
import { getAuthConfig } from '../../config/auth';
import { createApiClient } from '../../api/apiClientFactory';
import { getCookie } from '../../utils/cookies';
import { buildRequestHeaders } from '../../api/headers';
import { parseRetryAfterHeader } from '../../api/errors';

const DEFAULT_THUMBNAIL_PATH = '/admin/uploads/thumbnail';
const DEFAULT_ATTACHMENT_PATH = '/admin/uploads/attachment';

const THUMBNAIL_UPLOAD_PATH = import.meta.env.VITE_UPLOAD_THUMBNAIL_PATH || DEFAULT_THUMBNAIL_PATH;
const ATTACHMENT_UPLOAD_PATH = import.meta.env.VITE_UPLOAD_ATTACHMENT_PATH || DEFAULT_ATTACHMENT_PATH;

const THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024;
const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_ATTACHMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'png', 'jpg', 'jpeg'];

class UploadError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'UploadError';
    this.status = status;
  }
}

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const normalizeUploadError = (error, maxSize) => {
  const status = error?.status || error?.response?.status;
  if (status === 413) {
    return new UploadError(`File is too large. Maximum size is ${formatBytes(maxSize)}.`, status);
  }
  if (status === 429) {
    const retryAfterText = error?.retryAfterMs
      ? ` Try again in ${Math.ceil(error.retryAfterMs / 1000)}s.`
      : ' Please slow down and retry.';
    const uploadError = new UploadError(`Rate limited.${retryAfterText}`, status);
    uploadError.retryAfterMs = error?.retryAfterMs || null;
    return uploadError;
  }
  const payload = error?.response?.data || {};
  const serverMessage =
    payload?.error?.message || payload?.message || error?.message || 'Upload failed. Please try again.';
  const uploadError = new UploadError(serverMessage, status);
  uploadError.retryAfterMs = error?.retryAfterMs || null;
  return uploadError;
};

const resolveEnvironment = (env) => {
  if (env === ENVIRONMENTS.production) return ENVIRONMENTS.production;
  if (env === ENVIRONMENTS.staging) return ENVIRONMENTS.staging;
  return getStoredEnvironment();
};

const parseJsonSafely = (text) => {
  try {
    return text ? JSON.parse(text) : {};
  } catch (err) {
    return {};
  }
};

const performUpload = ({
  baseURL,
  path,
  file,
  onProgress,
  maxSize,
  refreshableClient,
  attempt = 0,
  environment,
}) =>
  new Promise((resolve, reject) => {
    const url = path.startsWith('http') ? path : `${baseURL}${path}`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.withCredentials = true;

    const token = getCookie('access_token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    const auditHeaders = buildRequestHeaders({ environment, includeContentType: false });
    Object.entries(auditHeaders).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event?.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    };

    xhr.onerror = () => {
      const retryAfterMs = parseRetryAfterHeader(xhr.getResponseHeader('Retry-After'));
      reject(normalizeUploadError({ status: xhr.status, retryAfterMs }, maxSize));
    };

    xhr.onload = async () => {
      const payload = parseJsonSafely(xhr.responseText);
      if (xhr.status === 401 && attempt === 0) {
        try {
          await refreshableClient.refresh();
          const retry = await performUpload({ baseURL, path, file, onProgress, maxSize, refreshableClient, attempt: 1 });
          resolve(retry);
        } catch (refreshError) {
          reject(normalizeUploadError(refreshError, maxSize));
        }
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload);
      } else {
        const retryAfterMs = parseRetryAfterHeader(xhr.getResponseHeader('Retry-After'));
        reject(
          normalizeUploadError({ status: xhr.status, response: { data: payload }, retryAfterMs }, maxSize)
        );
      }
    };

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });

const createUploadClient = (environment, apiClient) => {
  const env = resolveEnvironment(environment);
  const baseURL = getApiBaseUrl(env) || '';
  const authPaths = getAuthConfig();
  const refreshableClient =
    apiClient ||
    createApiClient({
      baseUrl: baseURL,
      getAccessToken: () => getCookie('access_token'),
      onAuthFailure: () => {},
      authPaths,
      environment: env,
    });

  const uploadThumbnail = (file, onProgress) =>
    performUpload({
      baseURL,
      path: THUMBNAIL_UPLOAD_PATH,
      file,
      onProgress,
      maxSize: THUMBNAIL_MAX_BYTES,
      refreshableClient,
      environment: env,
    });

  const uploadAttachment = (file, onProgress) =>
    performUpload({
      baseURL,
      path: ATTACHMENT_UPLOAD_PATH,
      file,
      onProgress,
      maxSize: ATTACHMENT_MAX_BYTES,
      refreshableClient,
      environment: env,
    });

  const extractUrl = (payload) => {
    if (payload?.url) return payload;
    if (typeof payload === 'string') return { url: payload };
    return payload || {};
  };

  return {
    uploadThumbnail: async (file, onProgress) => extractUrl(await uploadThumbnail(file, onProgress)),
    uploadAttachment: async (file, onProgress) => extractUrl(await uploadAttachment(file, onProgress)),
  };
};

const uploadThumbnail = (file, { environment, apiClient, onProgress } = {}) =>
  createUploadClient(environment, apiClient).uploadThumbnail(file, onProgress);

const uploadAttachment = (file, { environment, apiClient, onProgress } = {}) =>
  createUploadClient(environment, apiClient).uploadAttachment(file, onProgress);

export {
  ALLOWED_ATTACHMENT_EXTENSIONS,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_UPLOAD_PATH,
  DEFAULT_ATTACHMENT_PATH,
  DEFAULT_THUMBNAIL_PATH,
  THUMBNAIL_MAX_BYTES,
  THUMBNAIL_UPLOAD_PATH,
  UploadError,
  createUploadClient,
  formatBytes,
  normalizeUploadError,
  uploadAttachment,
  uploadThumbnail,
};
