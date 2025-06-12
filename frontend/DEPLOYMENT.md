# Deployment Guide

## Prerequisites

1. Node.js 18+ installed
2. Backend server running (see backend README)
3. Environment variables configured

## Build Process

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Deployment Options

### Option 1: Static Hosting (Netlify, Vercel)

1. Upload the `dist` folder contents
2. Configure redirects for SPA routing:
   ```
   /*    /index.html   200
   ```

### Option 2: Traditional Web Server

1. Copy `dist` contents to web root
2. Configure server to serve static files
3. Ensure HTTPS is enabled

### Option 3: CDN Deployment

1. Upload assets to CDN
2. Update asset URLs in HTML files
3. Configure caching headers

## Environment Variables

- `VITE_API_BASE_URL`: Backend API URL
- `VITE_WEBFLOW_CLIENT_ID`: Webflow OAuth client ID
- `VITE_REDIRECT_URI`: OAuth redirect URI

## Performance Optimization

1. Enable gzip compression
2. Set appropriate cache headers
3. Use CDN for static assets
4. Monitor Core Web Vitals

## Security Considerations

1. Serve over HTTPS only
2. Set security headers
3. Validate environment variables
4. Monitor for XSS vulnerabilities