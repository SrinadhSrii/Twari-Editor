import { WebflowClient } from 'webflow-api';
import { OauthScope } from 'webflow-api/api/types/OAuthScope';

export const scopes = [
  'sites:read',
  'sites:write',
  'custom_code:read',
  'custom_code:write',
  'authorized_user:read',
] as OauthScope[];

export function createWebflowClient(accessToken?: string) {
  // Ensure you only initialize the client if the access token exists.
  if (!accessToken) {
    throw new Error("Cannot create Webflow client without an access token."); 
  }
  
  // Now TypeScript knows accessToken is a string.
  return new WebflowClient({ accessToken });
}

export function generateAuthorizeUrl(clientId: string, isDesigner: boolean = false) {
  return WebflowClient.authorizeURL({
    scope: scopes,
    clientId,
    state: isDesigner ? 'webflow_designer' : undefined,
  });
}

export async function getAccessToken(code: string, clientId: string, clientSecret: string) {
  return WebflowClient.getAccessToken({
    clientId,
    clientSecret,
    code,
  });
}