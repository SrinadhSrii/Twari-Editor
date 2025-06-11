import express, { Request, Response, NextFunction } from 'express';
import { WebflowClient } from 'webflow-api';
import { ScriptController } from '../services/ScriptController';
import { createWebflowClient } from '../services/webflowClient';

const router = express.Router();

interface Script {
  id: string;
  location?: string;
}

// Helper function to format page results
function formatPageResults(results: Map<string, Script[]>) {
  const formatted: Record<string, Record<string, Script>> = {};
  for (const [pageId, scripts] of results) {
    formatted[pageId] = {};
    scripts.forEach((script) => {
      formatted[pageId][script.id] = {
        id: script.id,
        location: script.location,
      };
    });
  }
  return formatted;
}

// Helper function to format single page result
function formatSinglePageResult(
  scripts: Array<{ id: string; location?: string }>
) {
  const result: Record<string, { id: string; location?: string }> = {};
  scripts.forEach((script) => {
    result[script.id] = {
      id: script.id,
      location: script.location,
    };
  });
  return result;
}

// Helper function to get custom code status
async function getCustomCodeStatus(
  scriptController: ScriptController,
  targetType: string,
  targetId: string | null,
  targetIds: string[] | null
) {
  if (targetType === 'site') {
    return scriptController.getSiteCustomCode(targetId!);
  }

  if (targetType === 'page' && targetIds) {
    const results = await scriptController.getMultiplePageCustomCode(targetIds);
    return formatPageResults(results);
  }

  if (targetType === 'page' && targetId) {
    const scripts = await scriptController.getPageCustomCode(targetId);
    return formatSinglePageResult(scripts);
  }

  throw new Error('Invalid target type');
}

// Helper function to validate status request
function validateStatusRequest(req: Request) {
  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const targetType = searchParams.get('targetType');
  const targetId = searchParams.get('targetId');
  const targetIds = searchParams.get('targetIds')?.split(',');

  if (!targetType || (targetType !== 'site' && targetType !== 'page')) {
    throw new Error('Invalid or missing targetType');
  }

  if (targetType === 'site' && !targetId) {
    throw new Error('targetId is required for site targetType');
  }

  if (targetType === 'page' && !targetId && !targetIds) {
    throw new Error('Either targetId or targetIds is required for page targetType');
  }

  return { targetType, targetId, targetIds };
}

// GET /custom-code/status
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { targetType, targetId, targetIds } = validateStatusRequest(req);
    const webflow = createWebflowClient(req.accessToken);
    const scriptController = new ScriptController(webflow);

    const result = await getCustomCodeStatus(
      scriptController,
      targetType,
      targetId,
      targetIds || null
    );

    res.json({ result });
  } catch (error) {
    console.error('Error in status route:', error);
    const status = (error as Error).message === 'Unauthorized' ? 401 : 500;
    const message =
      (error as Error).message === 'Unauthorized' ? 'Unauthorized' : 'Internal server error';
    res.status(status).json({ error: message });
  }
});

// GET /custom-code/register
router.get('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { siteId } = req.query;

    if (!siteId || typeof siteId !== 'string') {
      return res.status(400).json({ error: 'Site ID is required' });
    }

    const webflow = createWebflowClient(req.accessToken);
    const scriptController = new ScriptController(webflow);
    const registeredScripts = await scriptController.getRegisteredScripts(siteId);

    res.json({ registeredScripts });
  } catch (error) {
    console.error('Error fetching registered scripts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /custom-code/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { siteId, isHosted, scriptData } = req.body;
    const scriptType = isHosted ? 'hosted' : 'inline';

    if (!siteId || !scriptData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const webflow = createWebflowClient(req.accessToken);
    const scriptController = new ScriptController(webflow);

    let result;
    if (scriptType === 'inline') {
      result = await scriptController.registerInlineScript(siteId, scriptData);
    } else if (scriptType === 'hosted') {
      result = await scriptController.registerHostedScript(siteId, scriptData);
    } else {
      return res.status(400).json({ error: 'Invalid script type' });
    }

    res.json({ result });
  } catch (error) {
    console.error('Error registering script:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /custom-code/apply
router.post('/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { targetType, targetId, scriptId, location, version } = req.body;
    console.log(targetType, targetId, scriptId, location, version, 'body');

    // Validate Request Body
    if (!targetType || !targetId || !scriptId || !location || !version) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['site', 'page'].includes(targetType)) {
      return res.status(400).json({ error: 'Invalid target type' });
    }

    if (!['header', 'footer'].includes(location)) {
      return res.status(400).json({ error: 'Invalid location' });
    }

    const webflow = createWebflowClient(req.accessToken);
    const scriptController = new ScriptController(webflow);

    let result;
    if (targetType === 'site') {
      result = await scriptController.upsertSiteCustomCode(
        targetId,
        scriptId,
        location,
        version
      );
    } else if (targetType === 'page') {
      result = await scriptController.upsertPageCustomCode(
        targetId,
        scriptId,
        location,
        version
      );
    }

    res.json({ result });
  } catch (error) {
    console.error('Error applying custom code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;