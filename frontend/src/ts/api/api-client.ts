import { authManager } from '../auth/auth-manager';

class ApiClient {
  private baseUrl = import.meta.env.VITE_NEXTJS_API_URL || 'http://localhost:3000';

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const authState = authManager.getAuthState();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(authState.sessionToken && {
          Authorization: `Bearer ${authState.sessionToken}`
        }),
        ...options.headers
      },
      ...options
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();