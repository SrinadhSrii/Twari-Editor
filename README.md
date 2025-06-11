# Hybrid App Starter

A starter project for creating a Webflow Hybrid App that demonstrates OAuth authentication from the Webflow UI and basic Data and Designer API interactions. This project provides a simple example of how to:

- [Set up a Webflow Data Client server](https://developers.webflow.com/v2.0.0/data/docs/getting-started-data-clients)
- [Set up a Webflow Designer Extension frontend](https://developers.webflow.com/v2.0.0/designer/docs/getting-started-designer-extensions)
- [Authenticate from the Designer Extension](https://developers.webflow.com/v2.0.0/data/docs/authenticating-users-with-id-tokens)
- [Make Data API calls](https://developers.webflow.com/designer/reference/introduction)
- [Make Designer API calls](https://developers.webflow.com/designer/reference/introduction)

## 🚀 Quick start

1. Create a Webflow site if you haven't already at [webflow.com](https://webflow.com)
2. Register your app in [your Workspace](https://developers.webflow.com/v2.0.0/data/docs/register-an-app) Be sure to add a redirect URI to `localhost:3000/api/auth/callback` and the required scopes:
   
   - `authorized_user: read`
   - `sites:read` `sites:write`
   - `custom_code:read` `custom_code:write`

3. Clone this repository and install the dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

4. Install the Webflow CLI:

   ```bash
   npm install -g @webflow/cli
   # or
   yarn global add @webflow/cli
   ```

5. Navigate to the `/data-client` folder and create a `.env` file by copying `.env.example`. Fill in your app credentials, which can be found in your Webflow Dashboard under Integrations > App Development > Your App Details:

   ```env
   WEBFLOW_CLIENT_ID=xxx
   WEBFLOW_CLIENT_SECRET=xxx
   DESIGNER_EXTENSION_URI=xxx
   PORT=3000
   ```

6. Run the Data Client and Designer Extension together as a Hybrid App. The run command will install the dependencies and start the server and the designer extension:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

7. Install your app by navigating to `http://localhost:3000` in your web browser. This will redirect you to the Webflow Authorization page where you can authorize the app for your workspace.

8. Open your Webflow Site. Open the Apps panel and click on your App. When the panel opens click the "Launch Development App" button

9. Click the Authorize button to authenticate your App and start using the Data and Designer APIs

## 🛠️ Tech Stack

- Data Client:
  - **[Webflow SDK](https://github.com/webflow/js-webflow-api)** - Official Webflow API client
- Designer Extension:
  - **[Webflow Designer API](https://www.npmjs.com/package/@webflow/designer-extension-typings?activeTab=readme)** - Official Webflow Designer API client
  - **[Vite](https://vitejs.dev/)** - Build tool for modern web development
  - **[JWT-Decode](https://github.com/auth0/jwt-decode)** - Decode JWT tokens
  - **[React](https://reactjs.org/)** - JavaScript library for building user interfaces

## 📝 Important Notes

- This is a **development-only** example and should not be used in production
- The database is cleared when the server stops (see `cleanup` function)
- Access tokens are stored unencrypted - in production, you should:
  - Encrypt sensitive data
  - Use a proper database
  - Implement token refresh
  - Add error handling
  - Add user sessions

## 🔍 Project Structure

```
.
├── data-client/                      # Backend server
│   ├── app/
│   │   ├── api/                     # API Routes
│   │   │   ├── auth/               # Auth endpoints
│   │   │   └── custom-code/        # Custom code endpoints
│   │   ├── lib/                    # Server utilities
│   │   │   ├── controllers/        # Logic for handling requests and responses using the Webflow SDK
│   │   └── db/                     # Database
│   ├── .env.example                # Environment template
│   └── package.json
│
├── designer-extension/              # Frontend app
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── hooks/                  # Custom hooks
│   │   ├── services/               # API services/logic
│   │   ├── types/                  # TypeScript types
│   │   └── App.tsx                 # Main app component
│   ├── .env.development            # Dev environment variables
│   └── package.json
│└── package.json                     # Root package.json
```

## 📚 Additional Resources

- [OAuth 2.0 Implementation Guide](https://developers.webflow.com/v2.0.0/data/docs/oauth)
- [Hybrid App Authentication](https://developers.webflow.com/v2.0.0/data/docs/authenticating-users-with-id-tokens)
- [Available API Scopes](https://developers.webflow.com/v2.0.0/data/reference/scopes)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is MIT licensed.
