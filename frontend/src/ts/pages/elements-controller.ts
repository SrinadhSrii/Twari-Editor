import { BasePageController } from './base-controller';
import { authManager } from '../auth/auth-manager';
import { queryCache } from '../utils/query-cache';
import { WebflowElement, WebflowPage, AuthState } from '../types/interfaces';


class ElementsController extends BasePageController {
  private currentPage: WebflowPage | null = null;
  private selectedElement: WebflowElement | null = null;

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
      console.log('Elements controller initialized');
    } catch (error) {
      console.error('Failed to initialize elements controller:', error);
      this.showError('Failed to initialize element inspector');
    }
  }

  private setupEventListeners(): void {
    // Page selector
    const pageSelect = this.getElement('#page-select');
    if (pageSelect) {
      this.addEventListener(pageSelect, 'change', (e) => {
        const target = e.target as HTMLSelectElement;
        this.selectPage(target.value);
      });
    }

    // Element selector
    const elementSelect = this.getElement('#element-select');
    if (elementSelect) {
      this.addEventListener(elementSelect, 'change', (e) => {
        const target = e.target as HTMLSelectElement;
        this.selectElement(target.value);
      });
    }

    // Action buttons
    const inspectBtn = this.getElement('#inspect-btn');
    const updateBtn = this.getElement('#update-btn');
    const deleteBtn = this.getElement('#delete-btn');
    const refreshBtn = this.getElement('#refresh-btn');

    if (inspectBtn) {
      this.addEventListener(inspectBtn, 'click', () => {
        this.inspectElement();
      });
    }

    if (updateBtn) {
      this.addEventListener(updateBtn, 'click', () => {
        this.updateElement();
      });
    }

    if (deleteBtn) {
      this.addEventListener(deleteBtn, 'click', () => {
        this.deleteElement();
      });
    }

    if (refreshBtn) {
      this.addEventListener(refreshBtn, 'click', () => {
        this.refreshPageElements();
      });
    }

    // Navigation
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
    await this.loadPages();
  }

  private async loadPages(): Promise<void> {
    try {
      this.setLoadingState(true);
      this.hideError();

      // Get pages from query cache
      const pages = await queryCache.query(
        ['pages'],
        async () => {
          const response = await fetch('/api/pages', {
            headers: authManager.getAuthHeaders()
          });

          if (!response.ok) {
            throw new Error('Failed to fetch pages');
          }

          const data = await response.json();
          return data.pages || [];
        },
        {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000    // 10 minutes
        }
      );

      this.populatePageSelector(pages);
    } catch (error) {
      console.error('Failed to load pages:', error);
      this.showError('Failed to load pages');
    } finally {
      this.setLoadingState(false);
    }
  }

  private populatePageSelector(pages: WebflowPage[]): void {
    const pageSelect = this.getElement('#page-select') as HTMLSelectElement;
    if (!pageSelect) return;

    // Clear existing options
    pageSelect.innerHTML = '<option value="">Select a page...</option>';

    // Add page options
    pages.forEach(page => {
      const option = document.createElement('option');
      option.value = page.id;
      option.textContent = page.title || page.slug;
      pageSelect.appendChild(option);
    });
  }

  private async selectPage(pageId: string): Promise<void> {
    if (!pageId) {
      this.currentPage = null;
      this.clearElementSelector();
      this.clearElementInfo();
      return;
    }

    try {
      this.setLoadingState(true);
      this.hideError();

      // Get page elements
      const elements = await queryCache.query(
        ['page-elements', pageId],
        async () => {
          const response = await fetch(`/api/pages/${pageId}/elements`, {
            headers: authManager.getAuthHeaders()
          });

          if (!response.ok) {
            throw new Error('Failed to fetch page elements');
          }

          const data = await response.json();
          return data.elements || [];
        },
        {
          staleTime: 2 * 60 * 1000, // 2 minutes
          gcTime: 5 * 60 * 1000     // 5 minutes
        }
      );

      // Get page info
      this.currentPage = await queryCache.query(
        ['page', pageId],
        async () => {
          const response = await fetch(`/api/pages/${pageId}`, {
            headers: authManager.getAuthHeaders()
          });

          if (!response.ok) {
            throw new Error('Failed to fetch page info');
          }

          return await response.json();
        }
      );

      this.populateElementSelector(elements);
      this.updatePageInfo();
    } catch (error) {
      console.error('Failed to load page elements:', error);
      this.showError('Failed to load page elements');
    } finally {
      this.setLoadingState(false);
    }
  }

  private populateElementSelector(elements: WebflowElement[]): void {
    const elementSelect = this.getElement('#element-select') as HTMLSelectElement;
    if (!elementSelect) return;

    // Clear existing options
    elementSelect.innerHTML = '<option value="">Select an element...</option>';

    // Add element options
    elements.forEach(element => {
      const option = document.createElement('option');
      option.value = element.id;
      option.textContent = `${element.tag} ${element.classes ? '.' + element.classes.join('.') : ''} ${element.text ? '- ' + element.text.substring(0, 30) : ''}`;
      elementSelect.appendChild(option);
    });

    // Enable element selector
    elementSelect.disabled = false;
  }

  private clearElementSelector(): void {
    const elementSelect = this.getElement('#element-select') as HTMLSelectElement;
    if (elementSelect) {
      elementSelect.innerHTML = '<option value="">Select a page first...</option>';
      elementSelect.disabled = true;
    }
  }

  private async selectElement(elementId: string): Promise<void> {
    if (!elementId) {
      this.selectedElement = null;
      this.clearElementInfo();
      return;
    }

    try {
      // Get element details
      this.selectedElement = await queryCache.query(
        ['element', elementId],
        async () => {
          const response = await fetch(`/api/elements/${elementId}`, {
            headers: authManager.getAuthHeaders()
          });

          if (!response.ok) {
            throw new Error('Failed to fetch element details');
          }

          return await response.json();
        }
      );

      this.updateElementInfo();
      this.enableActionButtons();
    } catch (error) {
      console.error('Failed to load element details:', error);
      this.showError('Failed to load element details');
    }
  }

  private updatePageInfo(): void {
    const pageInfoElement = this.getElement('#page-info');
    if (!pageInfoElement || !this.currentPage) return;

    pageInfoElement.innerHTML = `
      <h3>Page Information</h3>
      <p><strong>Title:</strong> ${this.escapeHtml(this.currentPage.title || 'Untitled')}</p>
      <p><strong>Slug:</strong> ${this.escapeHtml(this.currentPage.slug)}</p>
      ${this.currentPage.url ? `<p><strong>URL:</strong> <a href="${this.escapeHtml(this.currentPage.url)}" target="_blank">${this.escapeHtml(this.currentPage.url)}</a></p>` : ''}
      ${this.currentPage.lastModified ? `<p><strong>Last Modified:</strong> ${this.formatDate(this.currentPage.lastModified)}</p>` : ''}
    `;

    this.showElement(pageInfoElement);
  }

  private updateElementInfo(): void {
    const elementInfoElement = this.getElement('#element-info');
    if (!elementInfoElement || !this.selectedElement) return;

    const element = this.selectedElement;
    
    elementInfoElement.innerHTML = `
      <h3>Element Information</h3>
      <div class="element-basic-info">
        <p><strong>Tag:</strong> ${this.escapeHtml(element.tag)}</p>
        <p><strong>ID:</strong> ${this.escapeHtml(element.id)}</p>
        ${element.classes ? `<p><strong>Classes:</strong> ${element.classes.map(c => this.escapeHtml(c)).join(', ')}</p>` : ''}
        ${element.text ? `<p><strong>Text:</strong> ${this.escapeHtml(element.text.substring(0, 100))}${element.text.length > 100 ? '...' : ''}</p>` : ''}
      </div>
      
      ${element.styles ? `
        <div class="element-styles">
          <h4>Styles</h4>
          <pre><code>${this.escapeHtml(JSON.stringify(element.styles, null, 2))}</code></pre>
        </div>
      ` : ''}
      
      ${element.attributes ? `
        <div class="element-attributes">
          <h4>Attributes</h4>
          <pre><code>${this.escapeHtml(JSON.stringify(element.attributes, null, 2))}</code></pre>
        </div>
      ` : ''}
    `;

    this.showElement(elementInfoElement);
  }

  private clearElementInfo(): void {
    const elementInfoElement = this.getElement('#element-info');
    if (elementInfoElement) {
      this.hideElement(elementInfoElement);
    }
    this.disableActionButtons();
  }

  private enableActionButtons(): void {
    const buttons = ['#inspect-btn', '#update-btn', '#delete-btn'];
    buttons.forEach(selector => {
      const btn = this.getElement(selector) as HTMLButtonElement;
      if (btn) {
        btn.disabled = false;
      }
    });
  }

  private disableActionButtons(): void {
    const buttons = ['#inspect-btn', '#update-btn', '#delete-btn'];
    buttons.forEach(selector => {
      const btn = this.getElement(selector) as HTMLButtonElement;
      if (btn) {
        btn.disabled = true;
      }
    });
  }

  private async inspectElement(): Promise<void> {
    if (!this.selectedElement) return;

    try {
      // Refresh element data
      queryCache.invalidate(['element', this.selectedElement.id]);
      await this.selectElement(this.selectedElement.id);
      
      this.showSuccess('Element data refreshed');
    } catch (error) {
      console.error('Failed to inspect element:', error);
      this.showError('Failed to refresh element data');
    }
  }

  private async updateElement(): Promise<void> {
    if (!this.selectedElement) return;

    // This would typically open a modal or form for editing
    // For now, just show a placeholder message
    alert('Element update functionality would be implemented here');
  }

  private async deleteElement(): Promise<void> {
    if (!this.selectedElement) return;

    if (!confirm('Are you sure you want to delete this element? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/elements/${this.selectedElement.id}`, {
        method: 'DELETE',
        headers: authManager.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete element');
      }

      // Clear selection and refresh page elements
      this.selectedElement = null;
      this.clearElementInfo();
      
      if (this.currentPage) {
        queryCache.invalidate(['page-elements', this.currentPage.id]);
        await this.selectPage(this.currentPage.id);
      }
      
      this.showSuccess('Element deleted successfully');
    } catch (error) {
      console.error('Failed to delete element:', error);
      this.showError('Failed to delete element');
    }
  }

  private async refreshPageElements(): Promise<void> {
    if (!this.currentPage) return;

    try {
      // Invalidate cache and reload
      queryCache.invalidate(['page-elements', this.currentPage.id]);
      await this.selectPage(this.currentPage.id);
      
      this.showSuccess('Page elements refreshed');
    } catch (error) {
      console.error('Failed to refresh page elements:', error);
      this.showError('Failed to refresh page elements');
    }
  }

  private setLoadingState(loading: boolean): void {
    const loadingSpinner = this.getElement('#loading-spinner');
    
    if (loadingSpinner) {
      this.toggleElement(loadingSpinner, loading);
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
    // Cleanup any elements-specific resources
    this.currentPage = null;
    this.selectedElement = null;
  }
}

// Initialize the elements controller when the script loads
const elementsController = new ElementsController();
elementsController.initialize().catch(error => {
  console.error('Failed to initialize elements controller:', error);
});

export { ElementsController };