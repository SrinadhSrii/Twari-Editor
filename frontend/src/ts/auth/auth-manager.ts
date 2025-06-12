import { jwtDecode } from 'jwt-decode';
import { AuthState, DecodedToken } from '../types/interfaces';
import { queryCache } from '../utils/query-cache';
import { storage } from '../utils/storage';

class AuthManager {
  private authState: AuthState = {
    user: { firstName: '', email: '' },
    sessionToken: '',
    isAuthenticated: false
  };
  
  private subscribers = new Set<(state: AuthState) => void>();
  private baseUrl = import.meta.env.VITE_NEXTJS_API_URL || 'http://localhost:3000';

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    const storedUser = storage.getItem('wf_hybrid_user');
    const wasLoggedOut = storage.getItem('explicitly_logged_out');

    if (!storedUser || wasLoggedOut) {
      this.updateAuthState({
        user: { firstName: '', email: '' },
        sessionToken: '',
        isAuthenticated: false
      });
      return;
    }

    try {
      const userData = JSON.parse(storedUser as string);
      if (!userData.sessionToken) {
        throw new Error('No session token');
      }

      const decodedToken = jwtDecode(userData.sessionToken) as DecodedToken;
      if (decodedToken.exp * 1000 <= Date.now()) {
        storage.removeItem('wf_hybrid_user');
        throw new Error('Token expired');
      }

      this.updateAuthState({
        user: {
          firstName: decodedToken.user.firstName,
          email: decodedToken.user.email
        },
        sessionToken: userData.sessionToken,
        isAuthenticated: true
      });
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.updateAuthState({
        user: { firstName: '', email: '' },
        sessionToken: '',
        isAuthenticated: false
      });
    }
  }

  async login(): Promise<void> {
    const authUrl = `${this.baseUrl}/api/auth/webflow`;
    window.location.href = authUrl;
  }

  async exchangeToken(code: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Token exchange failed');
      }

      const data = await response.json();
      const decodedToken = jwtDecode(data.sessionToken) as DecodedToken;

      const authState: AuthState = {
        user: {
          firstName: decodedToken.user.firstName,
          email: decodedToken.user.email
        },
        sessionToken: data.sessionToken,
        isAuthenticated: true
      };

      // Store in localStorage
      storage.setItem('wf_hybrid_user', JSON.stringify(authState));
      storage.removeItem('explicitly_logged_out');

      this.updateAuthState(authState);
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  }

  logout(): void {
    storage.setItem('explicitly_logged_out', 'true');
    storage.removeItem('wf_hybrid_user');
    queryCache.clear();
    
    this.updateAuthState({
      user: { firstName: '', email: '' },
      sessionToken: '',
      isAuthenticated: false
    });

    // Redirect to auth page
    window.location.href = '/pages/auth.html';
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  getAuthHeaders(): Record<string, string> {
    if (!this.authState.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    return {
      'Authorization': `Bearer ${this.authState.sessionToken}`,
      'Content-Type': 'application/json'
    };
  }

  subscribe(callback: (state: AuthState) => void): () => void {
    this.subscribers.add(callback);
    
    // Call immediately with current state
    callback(this.getAuthState());
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private updateAuthState(newState: AuthState): void {
    this.authState = newState;
    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.getAuthState());
      } catch (error) {
        console.error('Error in auth subscriber:', error);
      }
    });
  }

  isTokenExpired(): boolean {
    if (!this.authState.sessionToken) return true;
    
    try {
      const decodedToken = jwtDecode(this.authState.sessionToken) as DecodedToken;
      return decodedToken.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  async refreshTokenIfNeeded(): Promise<void> {
    if (this.isTokenExpired()) {
      this.logout();
    }
  }
}

export const authManager = new AuthManager();