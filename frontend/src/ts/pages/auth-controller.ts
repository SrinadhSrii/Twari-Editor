import { BasePageController } from './base-controller';
import { authManager } from '../auth/auth-manager';
import { AuthState } from '../types/interfaces';

class AuthController extends BasePageController {

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Wait for DOM to be ready
      await this.waitForDOMReady();

      // Check if already authenticated
      const authState = authManager.getAuthState();
      if (authState.isAuthenticated) {
        // Redirect to dashboard if already authenticated
        window.location.href = '/pages/index.html';
        return;
      }

      // Setup UI
      this.setupEventListeners();
      this.setupAuthSubscription();
      
      // Check for auth code in URL
      await this.handleAuthCallback();

      this.initialized = true;
      console.log('Auth controller initialized');
    } catch (error) {
      console.error('Failed to initialize auth controller:', error);
      this.showError('Failed to initialize authentication');
    }
  }

  private setupEventListeners(): void {
    // Login button
    const loginBtn = this.getElement('#login-btn');
    if (loginBtn) {
      this.addEventListener(loginBtn, 'click', () => {
        this.initiateLogin();
      });
    }

    // Retry button
    const retryBtn = this.getElement('#retry-btn');
    if (retryBtn) {
      this.addEventListener(retryBtn, 'click', () => {
        this.hideError();
        this.handleAuthCallback();
      });
    }
  }

  private setupAuthSubscription(): void {
    authManager.subscribe((authState: AuthState) => {
      if (authState.isAuthenticated) {
        // Redirect to dashboard on successful authentication
        window.location.href = '/pages/index.html';
      }
    });
  }

  private async handleAuthCallback(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (error) {
      this.showError(`Authentication failed: ${errorDescription || error}`);
      return;
    }

    if (code) {
      await this.exchangeCodeForToken(code);
    }
  }

  private async exchangeCodeForToken(code: string): Promise<void> {
    try {
      this.setLoadingState(true, 'Completing authentication...');
      this.hideError();

      await authManager.exchangeToken(code);
      
      // Clear the URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      window.history.replaceState({}, document.title, url.pathname);

      // The auth subscription will handle the redirect
    } catch (error) {
      console.error('Token exchange failed:', error);
      this.showError('Authentication failed. Please try again.');
    } finally {
      this.setLoadingState(false);
    }
  }

  private initiateLogin(): void {
    try {
      this.setLoadingState(true, 'Redirecting to Webflow...');
      this.hideError();

      // Generate state parameter for security
      const state = this.generateRandomString(32);
      sessionStorage.setItem('oauth_state', state);

      // Build authorization URL
      const authUrl = this.buildAuthorizationUrl(state);
      
      // Open Webflow OAuth in a new window with specific features
      // Note: Browser behavior for new windows vs. tabs can vary and is often user-configurable.
      window.open(authUrl, '_blank', 'width=600,height=700,left=200,top=200,toolbar=no,menubar=no,location=no,status=no');
    } catch (error) {
      console.error('Failed to initiate login:', error);
      this.showError('Failed to start authentication. Please try again.');
      this.setLoadingState(false);
    }
  }

  private buildAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: import.meta.env.VITE_WEBFLOW_CLIENT_ID || 'your-client-id',
      redirect_uri: `${window.location.origin}/pages/auth.html`,
      scope: 'sites:read sites:write cms:read cms:write',
      state: state
    });

    return `https://webflow.com/oauth/authorize?${params.toString()}`;
  }

  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    
    return result;
  }

  private setLoadingState(loading: boolean, message?: string): void {
    
    const loadingSpinner = this.getElement('#loading-spinner');
    const loginSection = this.getElement('#login-section');
    const loadingMessage = this.getElement('#loading-message');
    const loginBtn = this.getElement('#login-btn');

    if (loadingSpinner) {
      this.toggleElement(loadingSpinner, loading);
    }

    if (loginSection) {
      this.toggleElement(loginSection, !loading);
    }

    if (loadingMessage && message) {
      this.updateText(loadingMessage, message);
    }

    if (loginBtn) {
      (loginBtn as HTMLButtonElement).disabled = loading;
    }
  }

  private showError(message: string): void {
    const errorElement = this.getElement('#error-message');
    if (errorElement) {
      const errorText = errorElement.querySelector<HTMLParagraphElement>('p');
      if (errorText) {
        this.updateText(errorText, message);
      }
      this.showElement(errorElement);
    }
  }

  private hideError(): void {
    const errorElement = this.getElement('#error-message');
    if (errorElement) {
      this.hideElement(errorElement);
    }
  }

  protected onDestroy(): void {
    // Cleanup any auth-specific resources
  }
}

// Initialize the auth controller when the script loads
const authController = new AuthController();
authController.initialize().catch(error => {
  console.error('Failed to initialize auth controller:', error);
});

export { AuthController };