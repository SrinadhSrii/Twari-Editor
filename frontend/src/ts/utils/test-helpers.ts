import { authManager } from '../auth/auth-manager';
import { queryCache } from './query-cache';
import { apiClient } from '../api/api-client';
import { customCodeApi } from '../api/custom-code-api';

// Test utilities for manual testing
export class TestHelpers {
  static async testAuthFlow(): Promise<void> {
    console.log('Testing authentication flow...');
    
    try {
      // Test auth state
      const authState = authManager.getAuthState();
      console.log('Auth state:', authState);
      
      // Test token validation
      if (authState.isAuthenticated) {
        console.log('✓ User is authenticated');
        console.log('User info:', authState.user);
      } else {
        console.log('✗ User is not authenticated');
      }
    } catch (error) {
      console.error('Auth test failed:', error);
    }
  }
  
  static async testApiConnections(): Promise<void> {
    console.log('Testing API connections...');
    
    try {
      // Test sites API
      const sitesResponse = await apiClient.get('/api/sites');
      console.log('✓ Sites API working:', sitesResponse);
      
      // Test custom code API
      const scriptsResponse = await customCodeApi.getScripts('test-site-id');
      console.log('✓ Custom code API working:', scriptsResponse);
    } catch (error) {
      console.error('API test failed:', error);
    }
  }
  
  static testLocalStorage(): void {
    console.log('Testing local storage...');
    
    try {
      // Test storage availability
      localStorage.setItem('test', 'value');
      const value = localStorage.getItem('test');
      localStorage.removeItem('test');
      
      if (value === 'value') {
        console.log('✓ Local storage working');
      } else {
        console.log('✗ Local storage not working');
      }
    } catch (error) {
      console.error('Local storage test failed:', error);
    }
  }
  
  static async testQueryCache(): Promise<void> {
    console.log('Testing query cache...');
    
    try {
      // Test cache operations with a mock query function
      const testData = { data: 'test' };
      const mockQueryFn = () => Promise.resolve(testData);
      
      // Test query and caching
      const result = await queryCache.query(['test'], mockQueryFn);
      
      // Test invalidation
      queryCache.invalidate(['test']);
      
      if (result?.data === 'test') {
        console.log('✓ Query cache working');
      } else {
        console.log('✗ Query cache not working');
      }
    } catch (error) {
      console.error('Query cache test failed:', error);
    }
  }
  
  static async runAllTests(): Promise<void> {
    console.log('Running all tests...');
    
    this.testLocalStorage();
    await this.testQueryCache();
    await this.testAuthFlow();
    await this.testApiConnections();
    
    console.log('All tests completed');
  }
}

// Make available globally for manual testing
(window as any).testHelpers = TestHelpers;