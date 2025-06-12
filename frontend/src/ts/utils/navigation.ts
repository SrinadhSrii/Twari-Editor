import { authManager } from '../auth/auth-manager';

class NavigationManager {
  private currentPage: string;

  constructor() {
    this.currentPage = this.getCurrentPageFromPath();
    this.setupEventListeners();
  }

  navigate(page: string): void {
    // Check authentication requirement
    if (this.requiresAuth(page) && !authManager.getAuthState().isAuthenticated) {
      this.redirectToAuth();
      return;
    }

    // Navigate to the page
    window.location.href = `${page}.html`;
  }

  private getCurrentPageFromPath(): string {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    return filename.replace('.html', '');
  }

  private requiresAuth(page: string): boolean {
    // All pages except auth require authentication
    return page !== 'auth';
  }

  private redirectToAuth(): void {
    window.location.href = 'auth.html';
  }

  private setupEventListeners(): void {
    // Handle navigation links
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href$=".html"]') as HTMLAnchorElement;
      
      if (link && this.isInternalLink(link)) {
        event.preventDefault();
        const page = link.getAttribute('href')?.replace('.html', '') || 'index';
        this.navigate(page);
      }
    });

    // Handle authentication state changes
    authManager.subscribe((authState) => {
      if (!authState.isAuthenticated && this.requiresAuth(this.currentPage)) {
        this.redirectToAuth();
      }
    });
  }

  private isInternalLink(link: HTMLAnchorElement): boolean {
    return !link.href.startsWith('http') || link.href.includes(window.location.origin);
  }

  getCurrentPage(): string {
    return this.currentPage;
  }
}

export const navigationManager = new NavigationManager();