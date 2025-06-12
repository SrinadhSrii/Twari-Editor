import { PageController } from '../types/interfaces';

export abstract class BasePageController implements PageController {
  private eventListeners: Array<{
    element: EventTarget;
    event: string;
    handler: EventListener;
  }> = [];
  protected initialized = false;

  abstract initialize(): void;

  destroy(): void {
    this.removeAllEventListeners();
    this.onDestroy();
    this.initialized = false;
  }

  protected onDestroy(): void {}

  // Helper method to safely get elements
  protected getElement<T extends HTMLElement>(selector: string): T | null {
    return document.querySelector<T>(selector);
  }

  protected getElements<T extends HTMLElement>(selector: string): NodeListOf<T> {
    return document.querySelectorAll<T>(selector);
  }

  // Helper method to add event listeners with automatic cleanup
  protected addEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener
  ): void {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }

  // Helper method to show/hide elements
  protected showElement(element: HTMLElement): void {
    element.classList.remove('hidden');
  }

  protected hideElement(element: HTMLElement): void {
    element.classList.add('hidden');
  }

  protected toggleElement(element: HTMLElement, show: boolean): void {
    if (show) {
      this.showElement(element);
    } else {
      this.hideElement(element);
    }
  }

  // Helper method to update text content safely
  protected updateText(element: HTMLElement, text: string): void {
    element.textContent = text;
  }

  // Helper method to update HTML content safely
  protected updateHTML(element: HTMLElement, html: string): void {
    element.innerHTML = html;
  }

  // Helper method to set element attributes
  protected setAttribute(element: HTMLElement, attribute: string, value: string): void {
    element.setAttribute(attribute, value);
  }

  // Helper method to add CSS classes
  protected addClass(element: HTMLElement, className: string): void {
    element.classList.add(className);
  }

  protected removeClass(element: HTMLElement, className: string): void {
    element.classList.remove(className);
  }

  // Clean up all event listeners
  private removeAllEventListeners(): void {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }

  // Utility method to wait for DOM ready
  protected async waitForDOMReady(): Promise<void> {
    if (document.readyState === 'loading') {
      return new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', () => resolve());
      });
    }
  }
}