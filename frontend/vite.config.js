import { defineConfig, Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

// --- The Custom Webflow Plugin from the working project ---
const wfDesignerExtensionPlugin = (watchPatterns = []) => {
  let webflowHTML = '';
  const configPath = path.join('./webflow.json');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const webflowConfig = JSON.parse(configContent);

  return {
    name: 'wf-vite-combined-plugin',
    transformIndexHtml: {
      order: 'pre',
      handler: async (html, ctx) => {
        if (ctx.server) {
          if (!webflowHTML) {
            const { name, apiVersion, featureFlags } = webflowConfig;
            const template = apiVersion === '2' ? '/template/v2' : '/template';
            const flagQuery = buildFlagQuery(featureFlags);
            const url = `https://webflow-ext.com${template}?name=${name}${flagQuery}`;
            webflowHTML = await fetch(url).then((res) => res.text());
          }
          const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
          let match;
          let scripts = '';
          while ((match = scriptRegex.exec(webflowHTML)) !== null) {
            scripts += match[0] + '\n';
          }
          return html.replace('</head>', `${scripts}</head>`);
        }
      },
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/__webflow') {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
          });
          res.end(configContent);
        } else {
          next();
        }
      });
      const watcher = chokidar.watch(watchPatterns, { ignoreInitial: true, persistent: true });
      watcher.on('all', (event, filePath) => {
        console.log(`File ${filePath} has been ${event}, restarting server...`);
        server.restart();
      });
      server?.httpServer?.on('close', () => {
        watcher.close();
      });
    },
  };
};

const buildFlagQuery = (featureFlags) =>
  !featureFlags
    ? ''
    : Object.entries(featureFlags)
        .map(([key, value]) => `&ff_${value ? 'on' : 'off'}=${key}`)
        .join('');

// --- Main Vite Configuration ---
export default defineConfig({
  server: {
    port: 1337,
  },
  plugins: [
    // This plugin is the key. We pass an empty array because we don't need to watch extra files.
    wfDesignerExtensionPlugin([]), 
  ],
  root: './',
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        auth: path.resolve(__dirname, 'auth.html'),
      },
    },
  },
});