import express, { Router, Request, Response, NextFunction } from 'express';

const router: Router = express.Router();

import { generateAuthorizeUrl } from '../services/webflowClient';

// GET /auth/authorize
router.get('/authorize', (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = process.env.WEBFLOW_CLIENT_ID;
    if (!clientId) {
      throw new Error('WEBFLOW_CLIENT_ID is not defined in environment variables.');
    }
    const isDesigner = req.query.state === 'webflow_designer';
    const authorizeUrl = generateAuthorizeUrl(clientId, isDesigner);
    res.redirect(authorizeUrl);
  } catch (error) {
    next(error);
  }
});

import { getAccessToken as getWebflowAccessToken, createWebflowClient } from '../services/webflowClient';
import db from '../utils/database';

// GET /auth/callback
router.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  const { code, state } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const clientId = process.env.WEBFLOW_CLIENT_ID;
    const clientSecret = process.env.WEBFLOW_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('WEBFLOW_CLIENT_ID or WEBFLOW_CLIENT_SECRET is not defined.');
    }

    const accessToken = await getWebflowAccessToken(code, clientId, clientSecret);
    const webflow = createWebflowClient(accessToken);

    const sitesResponse = await webflow.sites.list();
    const authInfo = await webflow.token.introspect();

    const siteList = sitesResponse?.sites ?? [];
    if (siteList.length > 0) {
      await Promise.all(
        siteList.map((site) => db.insertSiteAuthorization(site.id, accessToken))
      );
    }

    const isAppPopup = state === 'webflow_designer';

    if (isAppPopup) {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Complete</title>
          </head>
          <body>
            <script>
              window.opener.postMessage('authComplete', '*');
              window.close();
            </script>
          </body>
        </html>
      `);
    } else {
      const workspaceIds = authInfo?.authorization?.authorizedTo?.workspaceIds ?? [];
      if (workspaceIds.length > 0) {
        return res.redirect(`https://webflow.com/dashboard?workspace=${workspaceIds[0]}`);
      }
      const firstSite = siteList[0];
      if (firstSite) {
        return res.redirect(
          `https://${firstSite.shortName}.design.webflow.com?app=${process.env.WEBFLOW_CLIENT_ID}`
        );
      }
      // Fallback redirect if no specific workspace or site found
      res.redirect('https://webflow.com/dashboard');
    }
  } catch (error) {
    console.error('Error in callback:', error);
    next(error);
  }
});

import jwt from '../utils/jwt';

// POST /auth/token
router.post('/token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken, siteId } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    if (!siteId) {
      return res.status(400).json({ error: 'Site ID is required' });
    }

    // Get access token for the site ID
    const accessToken = await jwt.getAccessToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the ID token with Webflow's API using the access token
    const response = await fetch('https://api.webflow.com/beta/token/resolve', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid ID token' });
    }

    const user = await response.json();
    console.log('User:', user);

    // Generate a session token
    const tokenPayload = await jwt.createSessionToken(user);

    // Store the user authorization
    await db.insertUserAuthorization(user.id, accessToken);

    // Return the session token and expiration time
    res.json({
      sessionToken: tokenPayload.sessionToken,
      exp: tokenPayload.exp,
    });
  } catch (error) {
    console.error('Error in token exchange:', error);
    res.status(401).json({
      error: 'Error: User is not associated with authorization for this site',
    });
  }
});

export default router;