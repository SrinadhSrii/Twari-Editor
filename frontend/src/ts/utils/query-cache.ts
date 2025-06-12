interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleTime: number;
  gcTime: number;
}

interface QueryOptions {
  staleTime?: number;
  gcTime?: number;
  retry?: boolean;
  enabled?: boolean;
}

export class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private subscribers = new Map<string, Set<(data: any) => void>>();
  private loadingQueries = new Set<string>();

  async query<T>(
    key: string[],
    queryFn: () => Promise<T>,
    options: QueryOptions = {}
  ): Promise<T> {
    const cacheKey = JSON.stringify(key);
    const {
      staleTime = 0,
      gcTime = 5 * 60 * 1000,
      retry = true,
      enabled = true
    } = options;

    if (!enabled) {
      throw new Error('Query is disabled');
    }

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.staleTime) {
      return cached.data;
    }

    // Prevent duplicate requests
    if (this.loadingQueries.has(cacheKey)) {
      return new Promise((resolve, _reject) => {
        const checkCache = () => {
          const entry = this.cache.get(cacheKey);
          if (entry) {
            resolve(entry.data);
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }

    this.loadingQueries.add(cacheKey);

    try {
      const data = await queryFn();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        staleTime,
        gcTime
      });

      // Notify subscribers
      this.notifySubscribers(cacheKey, data);
      
      return data;
    } catch (error) {
      if (retry && cached) {
        return cached.data;
      }
      throw error;
    } finally {
      this.loadingQueries.delete(cacheKey);
    }
  }

  subscribe(key: string[], callback: (data: any) => void): () => void {
    const cacheKey = JSON.stringify(key);
    
    if (!this.subscribers.has(cacheKey)) {
      this.subscribers.set(cacheKey, new Set());
    }
    
    this.subscribers.get(cacheKey)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(cacheKey);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(cacheKey);
        }
      }
    };
  }

  private notifySubscribers(cacheKey: string, data: any): void {
    const subscribers = this.subscribers.get(cacheKey);
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }
  }

  invalidate(key: string[]): void {
    const cacheKey = JSON.stringify(key);
    this.cache.delete(cacheKey);
  }

  clear(): void {
    this.cache.clear();
    this.subscribers.clear();
  }
}

export const queryCache = new QueryCache();