import { useEffect, useState } from 'react';
import { APP_VERSION } from '../../config/version';

const MAX_EVENTS = 200;
let events = [];
const listeners = new Set();

const truncateValue = (value) => {
  if (typeof value === 'string' && value.length > 200) {
    return `${value.slice(0, 200)}…`;
  }
  return value;
};

const sanitizePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  try {
    const serialized = JSON.stringify(payload, (key, value) => truncateValue(value));
    return JSON.parse(serialized);
  } catch (err) {
    return undefined;
  }
};

const notify = () => {
  listeners.forEach((listener) => listener([...events]));
};

const logEvent = (type, payload) => {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type,
    payload: sanitizePayload(payload),
    at: new Date().toISOString(),
    version: APP_VERSION,
  };
  events = [...events, entry].slice(-MAX_EVENTS);
  notify();
};

const getDiagnosticsSnapshot = () => [...events];

const clearDiagnostics = () => {
  events = [];
  notify();
};

const subscribeDiagnostics = (listener) => {
  listeners.add(listener);
  listener([...events]);
  return () => listeners.delete(listener);
};

const useDiagnosticsEvents = () => {
  const [items, setItems] = useState(getDiagnosticsSnapshot());

  useEffect(() => subscribeDiagnostics(setItems), []);

  return items;
};

export { clearDiagnostics, getDiagnosticsSnapshot, logEvent, subscribeDiagnostics, useDiagnosticsEvents };
