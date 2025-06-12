// Initialize global services
import { authManager } from './auth/auth-manager';
import { queryCache } from './utils/query-cache';
import './utils/navigation'; // Navigation manager initializes itself on import

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Check authentication on app start
const currentPath = window.location.pathname;
const isAuthPage = currentPath.includes('auth.html');
const authState = authManager.getAuthState();

if (!isAuthPage && !authState.isAuthenticated) {
  // Redirect to auth if not authenticated and not on auth page
  window.location.href = 'auth.html';
} else if (isAuthPage && authState.isAuthenticated) {
  // Redirect to dashboard if authenticated and on auth page
  window.location.href = 'index.html';
}

// Global cleanup on page unload
window.addEventListener('beforeunload', () => {
  queryCache.clear();
});

console.log('Application initialized successfully');