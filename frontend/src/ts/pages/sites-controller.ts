import { BasePageController } from './base-controller';
import { authManager } from '../auth/auth-manager';
import { queryCache } from '../utils/query-cache';
import { Site, AuthState } from '../types/interfaces';


class SitesController extends BasePageController {
  private sites: Site[] = [];
  private filteredSites: Site[] = [];
  private loading = false;
  private currentFilter = '';


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
      console.log('Sites controller initialized');
    } catch (error) {
      console.error('Failed to initialize sites controller:', error);
      this.showError('Failed to initialize sites manager');
    }
  }

  private setupEventListeners(): void {
    // Search/filter input
    const searchInput = this.getElement('#site-search');
    if (searchInput) {
      this.addEventListener(searchInput, 'input', (e) => {
        const target = e.target as HTMLInputElement;
        this.filterSites(target.value);
      });
    }

    // Load sites button
    const loadSitesBtn = this.getElement('#load-sites-btn');
    if (loadSitesBtn) {
      this.addEventListener(loadSitesBtn, 'click', () => {
        this.loadSites();
      });
    }

    // Refresh button
    const refreshBtn = this.getElement('#refresh-btn');
    if (refreshBtn) {
      this.addEventListener(refreshBtn, 'click', () => {
        this.refreshSites();
      });
    }

    // Modal close buttons
    const closeModalBtns = document.querySelectorAll<HTMLElement>('.close-modal, .modal-backdrop');
    closeModalBtns.forEach(btn => {
      this.addEventListener(btn, 'click', () => {
        this.closeModal();
      });
    });

    // Navigation
    const backToDashboardBtn = this.getElement('#back-to-dashboard');
    if (backToDashboardBtn) {
      this.addEventListener(backToDashboardBtn, 'click', () => {
        window.location.href = '/pages/index.html';
      });
    }

    // Keyboard events for modal
    this.addEventListener(document, 'keydown', (e) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  private setupAuthSubscription(): void {
    authManager.subscribe((authState: AuthState) => {
      if (!authState.isAuthenticated) {
        window.location.href = '/pages/auth.html';
      }
    });
  }

  private async loadInitialData(): Promise<void> {
    await this.loadSites();
  }

  private async loadSites(): Promise<void> {
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

      this.filteredSites = [...this.sites];
      this.renderSitesGrid();
    } catch (error) {
      console.error('Failed to load sites:', error);
      this.showError('Failed to load sites. Please try again.');
    } finally {
      this.setLoadingState(false);
    }
  }

  private async refreshSites(): Promise<void> {
    // Invalidate cache and reload
    queryCache.invalidate(['sites']);
    await this.loadSites();
  }

  private filterSites(query: string): void {
    this.currentFilter = query.toLowerCase();
    
    if (!query) {
      this.filteredSites = [...this.sites];
    } else {
      this.filteredSites = this.sites.filter(site => 
        site.displayName.toLowerCase().includes(this.currentFilter) ||
        site.shortName.toLowerCase().includes(this.currentFilter) ||
        (site.customDomain && site.customDomain.toLowerCase().includes(this.currentFilter))
      );
    }
    
    this.renderSitesGrid();
  }

  private renderSitesGrid(): void {
    const sitesGrid = this.getElement('#sites-grid');
    const emptyState = this.getElement('#empty-state');
    const sitesContainer = this.getElement('#sites-container');

    if (!sitesGrid || !sitesContainer) return;

    if (this.filteredSites.length === 0) {
      this.hideElement(sitesContainer);
      if (emptyState) {
        const emptyMessage = emptyState.querySelector<HTMLParagraphElement>('p');
        if (emptyMessage) {
          const message = this.currentFilter 
            ? `No sites found matching "${this.currentFilter}"`
            : 'No sites found. Click "Load Sites" to fetch your Webflow sites.';
          this.updateText(emptyMessage, message);
        }
        this.showElement(emptyState);
      }
      return;
    }

    // Hide empty state and show container
    if (emptyState) {
      this.hideElement(emptyState);
    }
    this.showElement(sitesContainer);

    // Clear existing grid items
    sitesGrid.innerHTML = '';

    // Add site cards
    this.filteredSites.forEach(site => {
      const card = document.createElement('div');
      card.className = 'site-card';
      card.innerHTML = `
        <div class="site-card-header">
          <h3>${this.escapeHtml(site.displayName)}</h3>
          <span class="site-status ${site.isPublished ? 'published' : 'draft'}">
            ${site.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
        <div class="site-card-body">
          <p class="site-short-name">${this.escapeHtml(site.shortName)}</p>
          ${site.customDomain ? `<p class="site-domain">${this.escapeHtml(site.customDomain)}</p>` : ''}
          <p class="site-date">Created: ${this.formatDate(site.createdOn)}</p>
          <p class="site-date">Updated: ${this.formatDate(site.lastUpdated)}</p>
        </div>
        <div class="site-card-actions">
          <button class="btn btn-small btn-primary view-details-btn" data-site-id="${site.id}">
            View Details
          </button>
          ${site.previewUrl ? `<a href="${site.previewUrl}" target="_blank" class="btn btn-small btn-secondary">Preview</a>` : ''}
        </div>
      `;

      // Add click event for view details
      const viewDetailsBtn = card.querySelector<HTMLElement>('.view-details-btn');
      if (viewDetailsBtn) {
        this.addEventListener(viewDetailsBtn, 'click', () => {
          this.showSiteDetails(site);
        });
      }

      sitesGrid.appendChild(card);
    });
  }

  private showSiteDetails(site: Site): void {

    const modal = this.getElement('#site-modal');
    const modalContent = this.getElement('#modal-content');

    if (!modal || !modalContent) return;

    // Populate modal content
    modalContent.innerHTML = `
      <div class="modal-header">
        <h2>${this.escapeHtml(site.displayName)}</h2>
        <button class="close-modal" aria-label="Close modal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="site-details-grid">
          <div class="detail-group">
            <h3>Basic Information</h3>
            <p><strong>Display Name:</strong> ${this.escapeHtml(site.displayName)}</p>
            <p><strong>Short Name:</strong> ${this.escapeHtml(site.shortName)}</p>
            <p><strong>Site ID:</strong> ${this.escapeHtml(site.id)}</p>
            <p><strong>Status:</strong> ${site.isPublished ? 'Published' : 'Draft'}</p>
          </div>
          
          <div class="detail-group">
            <h3>Domains & URLs</h3>
            ${site.customDomain ? `<p><strong>Custom Domain:</strong> <a href="https://${site.customDomain}" target="_blank">${this.escapeHtml(site.customDomain)}</a></p>` : ''}
            ${site.previewUrl ? `<p><strong>Preview URL:</strong> <a href="${site.previewUrl}" target="_blank">${this.escapeHtml(site.previewUrl)}</a></p>` : ''}
            ${site.defaultDomain ? `<p><strong>Default Domain:</strong> <a href="https://${site.defaultDomain}" target="_blank">${this.escapeHtml(site.defaultDomain)}</a></p>` : ''}
          </div>
          
          <div class="detail-group">
            <h3>Timestamps</h3>
            <p><strong>Created:</strong> ${this.formatDate(site.createdOn)}</p>
            <p><strong>Last Updated:</strong> ${this.formatDate(site.lastUpdated)}</p>
            ${site.lastPublished ? `<p><strong>Last Published:</strong> ${this.formatDate(site.lastPublished)}</p>` : '<p><strong>Last Published:</strong> Never</p>'}
          </div>
          
          ${site.timezone ? `
            <div class="detail-group">
              <h3>Settings</h3>
              <p><strong>Timezone:</strong> ${this.escapeHtml(site.timezone)}</p>
            </div>
          ` : ''}
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-primary" id="manage-site-btn">Manage Site</button>
          <button class="btn btn-secondary" id="view-pages-btn">View Pages</button>
          <button class="btn btn-secondary close-modal">Close</button>
        </div>
      </div>
    `;

    // Add event listeners for modal buttons
    const manageSiteBtn = modalContent.querySelector<HTMLElement>('#manage-site-btn');
    const viewPagesBtn = modalContent.querySelector<HTMLElement>('#view-pages-btn');
    const closeButtons = modalContent.querySelectorAll<HTMLElement>('.close-modal');

    if (manageSiteBtn) {
      this.addEventListener(manageSiteBtn, 'click', () => {
        this.manageSite(site);
      });
    }

    if (viewPagesBtn) {
      this.addEventListener(viewPagesBtn, 'click', () => {
        this.viewSitePages(site);
      });
    }

    closeButtons.forEach(btn => {
      this.addEventListener(btn, 'click', () => {
        this.closeModal();
      });
    });

    // Show modal
    this.showElement(modal);
    document.body.style.overflow = 'hidden';
  }

  private closeModal(): void {
    const modal = this.getElement('#site-modal');
    if (modal) {
      this.hideElement(modal);
      document.body.style.overflow = '';
    }

  }

  private manageSite(site: Site): void {
    // This would typically navigate to a site management page
    // For now, just show a placeholder
    alert(`Site management for "${site.displayName}" would be implemented here`);
  }

  private viewSitePages(site: Site): void {
    // Navigate to elements page with site context
    window.location.href = `/pages/elements.html?siteId=${site.id}`;
  }

  private setLoadingState(loading: boolean): void {
    this.loading = loading;
    const loadingSpinner = this.getElement('#loading-spinner');
    const loadSitesBtn = this.getElement('#load-sites-btn');
    const refreshBtn = this.getElement('#refresh-btn');

    if (loadingSpinner) {
      this.toggleElement(loadingSpinner, loading);
    }

    if (loadSitesBtn) {
      (loadSitesBtn as HTMLButtonElement).disabled = loading;
      this.updateText(loadSitesBtn, loading ? 'Loading...' : 'Load Sites');
    }

    if (refreshBtn) {
      (refreshBtn as HTMLButtonElement).disabled = loading;
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
    // Cleanup any sites-specific resources
    this.sites = [];
    this.filteredSites = [];

    this.loading = false;
    this.currentFilter = '';
    
    // Restore body overflow
    document.body.style.overflow = '';
  }
}

// Initialize the sites controller when the script loads
const sitesController = new SitesController();
sitesController.initialize().catch(error => {
  console.error('Failed to initialize sites controller:', error);
});

export { SitesController };