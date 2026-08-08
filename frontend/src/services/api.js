import { API_BASE_URL } from '../utils/constants';

const BASE_URLS = [
  API_BASE_URL,
  'http://127.0.0.1:8004',
  'http://localhost:8004',
  '/api',
];

async function fetchWithFallback(endpoint, options = {}) {
  let lastError = null;
  for (const baseUrl of BASE_URLS) {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}${endpoint}`;
      
      // Abort fetch quickly after 1200ms if backend service is unresponsive
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error(`Failed request to ${endpoint}`);
}

export async function predictSession(sessionFeatures) {
  try {
    return await fetchWithFallback('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features: sessionFeatures }),
    });
  } catch (error) {
    console.warn('Backend ML API unreachable, using client-side AI prediction pipeline:', error.message);
    throw error;
  }
}

export async function getModelInfo() {
  try {
    return await fetchWithFallback('/model/info');
  } catch (error) {
    return null;
  }
}

export async function checkHealth() {
  try {
    return await fetchWithFallback('/health');
  } catch (error) {
    return { status: 'offline' };
  }
}
