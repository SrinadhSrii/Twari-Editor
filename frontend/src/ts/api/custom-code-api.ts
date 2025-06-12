import { apiClient } from './api-client';
import { ScriptRegistrationRequest, CodeApplication } from '../types/interfaces';

export const customCodeApi = {
  registerScript: (params: ScriptRegistrationRequest) => 
    apiClient.post('/api/custom-code/register', params),

  getScripts: (siteId: string) => 
    apiClient.get(`/api/custom-code/register?siteId=${siteId}`),

  applyScript: (params: CodeApplication) => 
    apiClient.post('/api/custom-code/apply', params),

  getSiteStatus: (siteId: string) => 
    apiClient.get<{ result: any }>(`/api/custom-code/status?targetType=site&targetId=${siteId}`),

  getPagesStatus: (pageIds: string[]) => 
    apiClient.get<{ result: any }>(`/api/custom-code/status?targetType=page&targetIds=${pageIds.join(',')}`),

  async getBatchStatus(siteId: string, pageIds: string[] = []) {
    try {
      if (!siteId || siteId === 'page') {
        console.warn('Invalid siteId provided to getBatchStatus:', siteId);
        return {};
      }

      if (!pageIds || pageIds.length === 0) {
        const siteStatus = await this.getSiteStatus(siteId);
        return siteStatus.result || {};
      }

      const batchSize = 5;
      const pagesBatches = [];

      for (let i = 0; i < pageIds.length; i += batchSize) {
        pagesBatches.push(pageIds.slice(i, i + batchSize));
      }

      const siteStatus = await this.getSiteStatus(siteId);
      const pagesStatus = { result: {} };
      
      for (const batch of pagesBatches) {
        const batchStatus = await this.getPagesStatus(batch);
        pagesStatus.result = { ...pagesStatus.result, ...batchStatus.result };
      }

      return {
        ...siteStatus.result,
        ...pagesStatus.result
      };
    } catch (error) {
      console.error('Error in getBatchStatus:', { siteId, pageIdsLength: pageIds?.length }, error);
      return {};
    }
  }
};