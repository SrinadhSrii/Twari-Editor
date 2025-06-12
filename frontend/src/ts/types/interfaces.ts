// Copy and adapt existing types from React version
export interface User {
  firstName: string;
  email: string;
}

export interface Site {
  id: string;
  displayName: string;
  shortName: string;
  createdOn: string;
  lastUpdated: string;
  lastPublished: string;
  isPublished: boolean;
  customDomain?: string;
  previewUrl?: string;
  defaultDomain?: string;
  timezone?: string;
}

export interface AuthState {
  user: User;
  sessionToken: string;
  isAuthenticated: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

// Page Controller interfaces
export interface PageController {
  initialize(): void;
  destroy(): void;
}

export interface NavigationConfig {
  currentPage: string;
  requiresAuth: boolean;
}

// Custom Code interfaces
export interface ScriptRegistrationRequest {
  name: string;
  code: string;
  location: 'head' | 'body' | 'footer';
  siteId: string;
}

export interface CodeApplication {
  scriptId: string;
  targetType: 'site' | 'page';
  targetId: string;
}

export interface DecodedToken {
  user: {
    firstName: string;
    email: string;
  };
  exp: number;
}

// Element interfaces
export interface ElementInfo {
  id: string;
  type: string;
  tag: string;
  classes: string[];
  attributes: Record<string, string>;
  styles: Record<string, string>;
}

// API interfaces
export interface WebflowElement {
  id: string;
  type: string;
  tag: string;
  classes: string[];
  attributes?: Record<string, string>;
  styles?: Record<string, string>;
  text?: string;
  children?: WebflowElement[];
}

export interface WebflowPage {
  id: string;
  title: string;
  slug: string;
  siteId: string;
  url?: string;
  lastModified?: string;
}

export interface CustomCode {
  id: string;
  name: string;
  location: string;
  description?: string;
  createdAt: string;
}

// Storage interfaces
export interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiry?: number;
}

// Query Cache interfaces
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleTime: number;
  gcTime: number;
}

export interface QueryOptions {
  staleTime?: number;
  gcTime?: number;
  retry?: boolean;
  enabled?: boolean;
}