import { BasePageController } from './base-controller';
import { authManager } from '../auth/auth-manager';
import { queryCache } from '../utils/query-cache';
import { CustomCode, AuthState } from '../types/interfaces';


class CustomCodeController extends BasePageController {
  private customCodes: CustomCode[] = [];
  private loading = false;
  private registering = false;

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
      console.log('Custom code controller initialized');
    } catch (error) {
      console.error('Failed to initialize custom code controller:', error);
      this.showError('Failed to initialize custom code manager');
    }
  }

  private setupEventListeners(): void {
    // Register script form
    const registerForm = this.getElement('#register-script-form');
    if (registerForm) {
      this.addEventListener(registerForm, 'submit', (e) => {
        e.preventDefault();
        this.registerScript();
      });
    }

    // Load scripts button
    const loadScriptsBtn = this.getElement('#load-scripts-btn');
    if (loadScriptsBtn) {
      this.addEventListener(loadScriptsBtn, 'click', () => {
        this.loadCustomCodes();
      });
    }

    // Refresh status button
    const refreshStatusBtn = this.getElement('#refresh-status-btn');
    if (refreshStatusBtn) {
      this.addEventListener(refreshStatusBtn, 'click', () => {
        this.refreshApplicationStatus();
      });
    }

    // Navigation links
    const backToDashboardBtn = this.getElement('#back-to-dashboard');
    if (backToDashboardBtn) {
      this.addEventListener(backToDashboardBtn, 'click', () => {
        window.location.href = '/pages/index.html';
      });
    }
  }

  private setupAuthSubscription(): void {
    authManager.subscribe((authState: AuthState) => {
      if (!authState.isAuthenticated) {
        window.location.href = '/pages/auth.html';
      }
    });
  }

  private async loadInitialData(): Promise<void> {
    await this.loadCustomCodes();
    await this.refreshApplicationStatus();
  }

  private async registerScript(): Promise<void> {
    if (this.registering) return;

    try {
      this.setRegisteringState(true);
      this.hideError();

      const form = this.getElement('#register-script-form') as HTMLFormElement;
      const formData = new FormData(form);
      
      const scriptData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        code: formData.get('code') as string,
        location: formData.get('location') as string
      };

      // Validate form data
      if (!scriptData.name || !scriptData.code) {
        throw new Error('Name and code are required');
      }

      // Register the script
      const response = await fetch('/api/custom-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeaders()
        },
        body: JSON.stringify(scriptData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register script');
      }

      // Clear form
      form.reset();
      
      // Reload scripts
      await this.loadCustomCodes();
      
      // Show success message
      this.showSuccess('Script registered successfully!');
    } catch (error) {
      console.error('Failed to register script:', error);
      this.showError(error instanceof Error ? error.message : 'Failed to register script');
    } finally {
      this.setRegisteringState(false);
    }
  }

  private async loadCustomCodes(): Promise<void> {
    if (this.loading) return;

    try {
      this.setLoadingState(true);
      this.hideError();

      // Use query cache for custom codes
      this.customCodes = await queryCache.query(
        ['custom-codes'],
        async () => {
          const response = await fetch('/api/custom-code', {
            headers: authManager.getAuthHeaders()
          });

          if (!response.ok) {
            throw new Error('Failed to fetch custom codes');
          }

          const data = await response.json();
          return data.customCodes || [];
        },
        {
          staleTime: 2 * 60 * 1000, // 2 minutes
          gcTime: 5 * 60 * 1000     // 5 minutes
        }
      );

      this.renderCustomCodesList();
    } catch (error) {
      console.error('Failed to load custom codes:', error);
      this.showError('Failed to load registered scripts');
    } finally {
      this.setLoadingState(false);
    }
  }

  private async refreshApplicationStatus(): Promise<void> {
    try {
      const response = await fetch('/api/status', {
        headers: authManager.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch application status');
      }

      const status = await response.json();
      this.updateApplicationStatus(status);
    } catch (error) {
      console.error('Failed to refresh application status:', error);
      this.updateApplicationStatus({ status: 'error', message: 'Failed to fetch status' });
    }
  }

  private renderCustomCodesList(): void {
    const scriptsContainer = this.getElement('#scripts-container');
    const scriptsList = this.getElement('#scripts-list');
    const emptyState = this.getElement('#empty-state');

    if (!scriptsContainer || !scriptsList) return;

    if (this.customCodes.length === 0) {
      this.hideElement(scriptsContainer);
      if (emptyState) {
        this.showElement(emptyState);
      }
      return;
    }

    // Hide empty state and show container
    if (emptyState) {
      this.hideElement(emptyState);
    }
    this.showElement(scriptsContainer);

    // Clear existing items
    scriptsList.innerHTML = '';

    // Add script items
    this.customCodes.forEach(script => {
      const item = document.createElement('div');
      item.className = 'script-item';
      item.innerHTML = `
        <div class="script-header">
          <h3>${this.escapeHtml(script.name)}</h3>
          <span class="script-location">${this.escapeHtml(script.location)}</span>
        </div>
        <p class="script-description">${this.escapeHtml(script.description || 'No description')}</p>
        <div class="script-meta">
          <span class="script-date">Created: ${this.formatDate(script.createdAt)}</span>
          <button class="btn btn-small btn-secondary delete-script-btn" data-script-id="${script.id}">
            Delete
          </button>
        </div>
      `;

      // Add delete event listener
      const deleteBtn = item.querySelector<HTMLElement>('.delete-script-btn');
      if (deleteBtn) {
        this.addEventListener(deleteBtn, 'click', () => {
          this.deleteScript(script.id);
        });
      }

      scriptsList.appendChild(item);
    });
  }

  private async deleteScript(scriptId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this script?')) {
      return;
    }

    try {
      const response = await fetch(`/api/custom-code/${scriptId}`, {
        method: 'DELETE',
        headers: authManager.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete script');
      }

      // Invalidate cache and reload
      queryCache.invalidate(['custom-codes']);
      await this.loadCustomCodes();
      
      this.showSuccess('Script deleted successfully!');
    } catch (error) {
      console.error('Failed to delete script:', error);
      this.showError('Failed to delete script');
    }
  }

  private updateApplicationStatus(status: any): void {
    const statusElement = this.getElement('#app-status');
    const statusText = this.getElement('#status-text');
    const statusMessage = this.getElement('#status-message');

    if (!statusElement || !statusText) return;

    // Update status text and styling
    const statusValue = status.status || 'unknown';
    this.updateText(statusText, statusValue.toUpperCase());
    
    // Remove existing status classes
    statusElement.classList.remove('status-running', 'status-error', 'status-stopped');
    
    // Add appropriate status class
    statusElement.classList.add(`status-${statusValue}`);

    // Update status message if available
    if (statusMessage && status.message) {
      this.updateText(statusMessage, status.message);
      this.showElement(statusMessage);
    } else if (statusMessage) {
      this.hideElement(statusMessage);
    }
  }

  private setLoadingState(loading: boolean): void {
    this.loading = loading;
    const loadingSpinner = this.getElement('#loading-spinner');
    const loadScriptsBtn = this.getElement('#load-scripts-btn');

    if (loadingSpinner) {
      this.toggleElement(loadingSpinner, loading);
    }

    if (loadScriptsBtn) {
      (loadScriptsBtn as HTMLButtonElement).disabled = loading;
      this.updateText(loadScriptsBtn, loading ? 'Loading...' : 'Refresh Scripts');
    }
  }

  private setRegisteringState(registering: boolean): void {
    this.registering = registering;
    const submitBtn = this.getElement('#register-submit-btn');
    const form = this.getElement('#register-script-form');

    if (submitBtn) {
      (submitBtn as HTMLButtonElement).disabled = registering;
      this.updateText(submitBtn, registering ? 'Registering...' : 'Register Script');
    }

    if (form) {
      const inputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select');
      inputs.forEach(input => {
        (input as HTMLInputElement).disabled = registering;
      });
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

  private showSuccess(message: string): void {
    // Create or update success message
    let successElement = this.getElement('#success-message');
    if (!successElement) {
      successElement = document.createElement('div');
      successElement.id = 'success-message';
      successElement.className = 'success-message';
      successElement.innerHTML = '<p></p>';
      
      const mainContent = this.getElement('.main-content');
      if (mainContent) {
        mainContent.insertBefore(successElement, mainContent.firstChild);
      }
    }

    const successText = successElement.querySelector<HTMLParagraphElement>('p');
    if (successText) {
      this.updateText(successText, message);
    }
    this.showElement(successElement);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hideElement(successElement);
    }, 3000);
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
    // Cleanup any custom code-specific resources
    this.customCodes = [];
    this.loading = false;
    this.registering = false;
  }
}

// Initialize the custom code controller when the script loads
const customCodeController = new CustomCodeController();
customCodeController.initialize().catch(error => {
  console.error('Failed to initialize custom code controller:', error);
});

export { CustomCodeController };