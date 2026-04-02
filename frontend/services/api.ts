import axios from 'axios'
import useAuthStore from '@/store/useAuthStore'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api',
  timeout: 30000,
})

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_STALE_TIME = 30000; // 30 seconds — increased for faster page loads

// Paths that should never be cached (real-time / write-sensitive)
const NO_CACHE_PATTERNS = ['/notifications', '/chats', '/social/feed'];

const isCacheable = (url: string) =>
  !NO_CACHE_PATTERNS.some(p => url.includes(p));

// Request interceptor for adding the auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize error shape across different backend services
    const errPayload = error.response?.data;
    const errorMessage = errPayload?.error || errPayload?.message || error.message || 'An unknown error occurred';
    
    // Automatically logout if unauthorized or invalid token
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        const { logout } = useAuthStore.getState();
        // Prevent multiple logouts and immediate redirect for better UX
        const lastAuthError = sessionStorage.getItem('last_auth_error');
        const now = Date.now();
        if (!lastAuthError || now - parseInt(lastAuthError) > 5000) {
          sessionStorage.setItem('last_auth_error', now.toString());
          logout();
          window.location.href = '/login';
        }
      }
    }

    const normalizedError = new Error(errorMessage);
    (normalizedError as any).status = error.response?.status;
    (normalizedError as any).payload = errPayload;
    
    return Promise.reject(normalizedError);
  }
)

// Wrapper for GET requests to implement fast in-memory caching
const originalGet = api.get.bind(api);
api.get = async (url: string, config?: any) => {
  if (!isCacheable(url)) {
    return originalGet(url, config);
  }

  const cacheKey = url + (config?.params ? JSON.stringify(config.params) : '');
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_STALE_TIME) {
    return Promise.resolve({ 
      data: cached.data, 
      status: 200, 
      statusText: 'OK', 
      headers: {}, 
      config: config || {},
      cached: true,
    } as any);
  }
  
  const response = await originalGet(url, config);
  cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
  return response;
};

// Expose cache invalidation so mutations can bust stale data
export const invalidateApiCache = (urlPattern?: string) => {
  if (!urlPattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(urlPattern)) cache.delete(key);
  }
};

export default api
