import { BasePageController } from './base-controller';
import { authManager } from '../auth/auth-manager';
import { queryCache } from '../utils/query-cache';
import { Site, AuthState } from '../types/interfaces';

class DashboardController extends BasePageController {
  private sites: Site[] = [];
  private loading = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Wait for DOM to be ready
      await this.waitForDOMReady();

      // Check authentication
      const authState = authManager.getAuthState();
      if (!authState.isAuthenticated) {
        window.location.href = '/pages/auth.html';
        return;
      }

      // Setup UI
      this.setupEventListeners();
      this.setupAuthSubscription();
      
      // Load initial data
      await this.loadInitialData();

      this.initialized = true;
      console.log('Dashboard controller initialized');
    } catch (error) {
      console.error('Failed to initialize dashboard controller:', error);
      this.showError('Failed to initialize dashboard');
    }
  }

  private setupEventListeners(): void {
    // Fetch sites button
    const fetchSitesBtn = this.getElement('#fetch-sites-btn');
    if (fetchSitesBtn) {
      this.addEventListener(fetchSitesBtn, 'click', () => {
        this.fetchSites();
      });
    }

    // Logout button
    const logoutBtn = this.getElement('#logout-btn');
    if (logoutBtn) {
      this.addEventListener(logoutBtn, 'click', () => {
        authManager.logout();
      });
    }

    // Retry button
    const retryBtn = this.getElement('#retry-btn');
    if (retryBtn) {
      this.addEventListener(retryBtn, 'click', () => {
        this.fetchSites();
      });
    }

    // Dev tools
    const toggleDevToolsBtn = this.getElement('#toggle-dev-tools');
    const clearCacheBtn = this.getElement('#clear-cache-btn');
    const refreshAuthBtn = this.getElement('#refresh-auth-btn');

    if (toggleDevToolsBtn) {
      this.addEventListener(toggleDevToolsBtn, 'click', () => {
        this.toggleDevTools();
      });
    }

    if (clearCacheBtn) {
      this.addEventListener(clearCacheBtn, 'click', () => {
        queryCache.clear();
        console.log('Cache cleared');
      });
    }

    if (refreshAuthBtn) {
      this.addEventListener(refreshAuthBtn, 'click', () => {
        authManager.refreshTokenIfNeeded();
      });
    }
  }

  private setupAuthSubscription(): void {
    authManager.subscribe((authState: AuthState) => {
      this.updateUserInfo(authState);
    });
  }

  private async loadInitialData(): Promise<void> {
    const authState = authManager.getAuthState();
    this.updateUserInfo(authState);
    
    // Show dev tools in development
    if (import.meta.env.DEV) {
      const devTools = this.getElement('#dev-tools');
      if (devTools) {
        this.showElement(devTools);
      }
    }
  }

  private updateUserInfo(authState: AuthState): void {
    const userNameElement = this.getElement('#user-name');
    const welcomeMessageElement = this.getElement('#welcome-message');

    if (userNameElement) {
      this.updateText(userNameElement, authState.user.firstName || 'User');
    }

    if (welcomeMessageElement) {
      this.updateText(welcomeMessageElement, `Welcome, ${authState.user.firstName || 'User'}!`);
    }
  }

  private async fetchSites(): Promise<void> {
    if (this.loading) return;

    try {
      this.setLoadingState(true);
      this.hideError();

      // Use query cache for sites
      this.sites = await queryCache.query(
        ['sites'],
        async () => {
          const response = await fetch('/api/sites', {
            headers: authManager.getAuthHeaders()
          });

          if (!response.ok) {
            throw new Error('Failed to fetch sites');
          }

          const data = await response.json();
          return data.sites || [];
        },
        {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000    // 10 minutes
        }
      );

      this.renderSitesTable();
    } catch (error) {
      console.error('Failed to fetch sites:', error);
      this.showError('Failed to load sites. Please try again.');
    } finally {
      this.setLoadingState(false);
    }
  }

  private renderSitesTable(): void {
    const sitesContainer = this.getElement('#sites-container');
    const sitesTableBody = this.getElement('#sites-tbody');

    if (!sitesContainer || !sitesTableBody) return;

    if (this.sites.length === 0) {
      this.hideElement(sitesContainer);
      this.showError('No sites found.');
      return;
    }

    // Clear existing rows
    sitesTableBody.innerHTML = '';

    // Add site rows
    this.sites.forEach(site => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${this.escapeHtml(site.displayName)}</td>
        <td>${this.formatDate(site.createdOn)}</td>
        <td>${this.formatDate(site.lastUpdated)}</td>
        <td>${this.formatDate(site.lastPublished)}</td>
      `;
      sitesTableBody.appendChild(row);
    });

    this.showElement(sitesContainer);
  }

  private setLoadingState(loading: boolean): void {
    this.loading = loading;
    const loadingSpinner = this.getElement('#loading-spinner');
    const fetchSitesBtn = this.getElement('#fetch-sites-btn');

    if (loadingSpinner) {
      this.toggleElement(loadingSpinner, loading);
    }

    if (fetchSitesBtn) {
      (fetchSitesBtn as HTMLButtonElement).disabled = loading;
      this.updateText(fetchSitesBtn, loading ? 'Loading...' : 'List Authorized Sites');
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

  private toggleDevTools(): void {
    const devToolsPanel = this.getElement('.dev-tools-panel');
    if (devToolsPanel) {
      devToolsPanel.classList.toggle('hidden');
    }
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  protected onDestroy(): void {
    // Cleanup any dashboard-specific resources
    this.sites = [];
    this.loading = false;
  }
}

// Initialize the dashboard controller when the script loads
const dashboardController = new DashboardController();
dashboardController.initialize().catch(error => {
  console.error('Failed to initialize dashboard:', error);
});

export { DashboardController };