import { APP_VERSION } from '../config/version';
import { resolveEnvironmentValue } from './errors';
import { generateRequestId } from '../utils/uuid';

const getUserAgent = () => {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent || '';
};

const buildRequestHeaders = ({ environment, includeContentType = true, userAgent } = {}) => {
  const headers = {
    'X-Request-Id': generateRequestId(),
    'X-Client-App': 'asharvi-admin',
    'X-Client-Version': APP_VERSION,
    'X-Client-Env': resolveEnvironmentValue(environment),
  };

  const agent = (userAgent || getUserAgent() || '').trim();
  if (agent && agent.length < 200) {
    headers['X-Client-User-Agent'] = agent;
  }

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

export { buildRequestHeaders, getUserAgent };
