# Frontend - Static HTML + TypeScript Implementation

This is the static HTML + TypeScript implementation of the Webflow Designer Extension frontend, designed as an alternative to the React-based implementation in the `designer-extension` folder.

## Overview

This frontend provides a lightweight, vanilla TypeScript implementation with static HTML pages that can be served directly or integrated into existing web applications. It includes:

- **Static HTML Pages**: Pre-built HTML pages for different application views
- **TypeScript Controllers**: Page-specific controllers that handle UI logic and API interactions
- **Modular Architecture**: Clean separation of concerns with reusable components
- **Modern Build System**: Vite-powered development and build process
- **Authentication Flow**: Complete OAuth integration with Webflow
- **Data Management**: Query caching and local storage utilities

## Project Structure

```
frontend/
├── pages/                    # Static HTML pages
│   ├── index.html           # Dashboard page
│   ├── auth.html            # Authentication page
│   ├── custom-code.html     # Custom code management
│   ├── elements.html        # Element inspector
│   └── sites.html           # Sites management
├── src/
│   ├── ts/                  # TypeScript source code
│   │   ├── auth/            # Authentication management
│   │   ├── api/             # API client utilities
│   │   ├── pages/           # Page controllers
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript interfaces
│   │   └── main.ts          # Application entry point
│   ├── css/                 # Stylesheets
│   │   ├── components/      # Component-specific styles
│   │   ├── pages/           # Page-specific styles
│   │   ├── themes/          # Theme configurations
│   │   └── main.css         # Main stylesheet
│   └── assets/              # Static assets
│       └── icons/           # Icon files
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
└── README.md                # This file
```

## Features

### 🔐 Authentication
- Complete Webflow OAuth 2.0 integration
- JWT token management with automatic refresh
- Secure token storage with expiration handling
- Authentication state management across pages

### 📊 Dashboard
- User welcome interface
- Quick access to authorized Webflow sites
- Application status monitoring
- Development tools for debugging

### 🌐 Sites Management
- List and filter Webflow sites
- Detailed site information modal
- Site status indicators (published/draft)
- Direct links to site preview and management

### 🔧 Custom Code Management
- Register custom JavaScript/CSS code snippets
- Organize code by location (head, body, etc.)
- View and manage registered scripts
- Application status monitoring

### 🔍 Element Inspector
- Browse Webflow pages and elements
- Inspect element properties and styles
- Element manipulation capabilities
- Real-time element information display

### 🛠 Technical Features
- **Query Caching**: Intelligent data caching with configurable TTL
- **Local Storage**: Persistent storage with expiration support
- **Error Handling**: Comprehensive error management and user feedback
- **Responsive Design**: Mobile-friendly interface
- **Type Safety**: Full TypeScript implementation with strict typing

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Webflow application with OAuth credentials
- Backend API server running (see `../backend/README.md`)

### Installation

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment:**
   Create a `.env` file in the frontend directory:
   ```env
   VITE_WEBFLOW_CLIENT_ID=your_webflow_client_id
   VITE_API_BASE_URL=http://localhost:3000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Preview production build:**
   ```bash
   npm run preview
   ```

### Development Workflow

1. **Start the backend server** (see `../backend/README.md`)
2. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
3. **Open your browser** to `http://localhost:5173`
4. **Begin authentication flow** by clicking "Login with Webflow"

## Architecture

### Page Controllers

Each HTML page has a corresponding TypeScript controller that extends the `BasePageController` class:

- **DashboardController**: Manages the main dashboard interface
- **AuthController**: Handles OAuth authentication flow
- **CustomCodeController**: Manages custom code registration and display
- **ElementsController**: Provides element inspection capabilities
- **SitesController**: Handles site listing and management

### Core Services

- **AuthManager**: Centralized authentication state and token management
- **QueryCache**: Intelligent data caching with automatic invalidation
- **StorageManager**: Local storage abstraction with expiration support
- **Application**: Main application coordinator and global error handler

### Data Flow

1. **Authentication**: OAuth flow managed by `AuthManager`
2. **API Calls**: Authenticated requests through `QueryCache`
3. **State Management**: Local state in controllers, global auth state in `AuthManager`
4. **UI Updates**: Direct DOM manipulation through `BasePageController` utilities

## Configuration

### Vite Configuration

The `vite.config.ts` file configures:
- Multiple entry points for different HTML pages
- TypeScript compilation settings
- Development server options
- Build optimization

### TypeScript Configuration

The `tsconfig.json` provides:
- Strict type checking
- ES2020 target for modern browser support
- Path mapping for clean imports
- Source map generation for debugging

## API Integration

The frontend expects a backend API with the following endpoints:

- `GET /api/sites` - List authorized Webflow sites
- `GET /api/pages` - List pages for a site
- `GET /api/pages/:id/elements` - List elements on a page
- `GET /api/elements/:id` - Get element details
- `POST /api/custom-code` - Register custom code
- `GET /api/custom-code` - List registered code
- `DELETE /api/custom-code/:id` - Delete custom code
- `GET /api/status` - Application status

## Deployment

### Static Hosting

After building, the `dist/` folder contains static files that can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting service

### Server Integration

The built files can also be integrated into existing server applications:
- Copy `dist/` contents to your web server
- Configure routing to serve HTML pages
- Ensure API endpoints are accessible

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

The application uses modern JavaScript features and requires ES2020 support.

## Development Tips

### Debugging

1. **Enable development tools** in the dashboard (visible in dev mode)
2. **Use browser DevTools** for debugging TypeScript (source maps included)
3. **Check console logs** for detailed error information
4. **Monitor network requests** to debug API interactions

### Adding New Pages

1. Create HTML file in `pages/` directory
2. Create corresponding controller in `src/ts/pages/`
3. Add entry point to `vite.config.ts`
4. Update navigation in existing pages

### Styling

- Main styles in `src/css/main.css`
- Component styles in `src/css/components/`
- Page-specific styles in `src/css/pages/`
- Follow BEM methodology for CSS classes

## Troubleshooting

### Common Issues

1. **Authentication fails**: Check Webflow OAuth configuration and redirect URLs
2. **API requests fail**: Verify backend server is running and CORS is configured
3. **Build errors**: Check TypeScript types and import paths
4. **Styling issues**: Verify CSS imports and class names

### Performance

- Use query cache to minimize API requests
- Implement proper error boundaries
- Optimize images and assets
- Enable gzip compression in production

## Contributing

When contributing to this frontend:

1. Follow TypeScript best practices
2. Maintain consistent code style
3. Add proper error handling
4. Update documentation for new features
5. Test across supported browsers

## License

This project is part of the Hybrid App Starter and follows the same license terms.