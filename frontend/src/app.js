import { jwtDecode } from 'jwt-decode';

window.addEventListener('DOMContentLoaded', () => {
    // --- Helper Functions to manage the session token ---
    const storageKey = 'app_token';
    function saveToken(token) {
        localStorage.setItem(storageKey, token);
    }
    function getToken() {
        const token = localStorage.getItem(storageKey);
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                console.log('Decoded token:', decodedToken);
            } catch (error) {
                console.error('Error decoding token:', error);
                // Optionally, clear the invalid token
                // clearToken(); 
                // return null;
            }
        }
        return token;
    }
    function clearToken() {
        localStorage.removeItem(storageKey);
    }

    // --- Authentication Flow ---

    /**
     * This function is called after the popup sends 'authComplete'.
     * It uses the Webflow Designer API to get the needed tokens and 
     * exchanges them for a session token from our backend.
     */
    async function getSessionToken() {
        try {
            console.log("Auth complete, attempting to get session token...");

            // 1. Get the idToken and siteId from the Webflow Designer API
            const idToken = await window.webflow.getIdToken();
            console.log(idToken);
            
            const siteInfo = await window.webflow.getSiteInfo();
            const siteId = siteInfo.siteId;

            if (!idToken || !siteId) {
                throw new Error("Could not retrieve idToken or siteId from Webflow.");
            }

            console.log("Successfully retrieved idToken and siteId.");

            // 2. Send these tokens to our backend's /api/auth/token endpoint
            const response = await fetch('http://localhost:3000/api/auth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken, siteId }),
            });

            if (!response.ok) {
                throw new Error('Backend could not exchange tokens for a session token.');
            }

            const data = await response.json();
            const sessionToken = data.sessionToken;
            
            if (sessionToken) {
                console.log("Session token received and saved!");
                saveToken(sessionToken);
                // Redirect to the dashboard on success
                window.location.href = '/index.html';
            } else {
                 throw new Error("Backend response did not include a sessionToken.");
            }

        } catch (error) {
            console.error("Error during getSessionToken:", error);
            alert("An error occurred during authentication. Please check the console.");
        }
    }


    // --- Page-Specific Logic ---

    // Logic for the LOGIN page (auth.html)
    if (document.getElementById('login-button')) {
        document.getElementById('login-button').addEventListener('click', () => {
            // Correct backend endpoint for authorization
            const authUrl = 'http://localhost:3000/api/auth/authorize?state=webflow_designer';
            
            // Open the auth URL in a new popup window
            const width = 600, height = 800;
            const left = (screen.width / 2) - (width / 2);
            const top = (screen.height / 2) - (height / 2);
            window.open(authUrl, 'webflowAuth', `width=${width},height=${height},top=${top},left=${left}`);
        });

        // Listen for the 'authComplete' message from the popup
        window.addEventListener('message', (event) => {
            if (event.data === 'authComplete') {
                getSessionToken();
            }
        }, false);
    }

    // Logic for the DASHBOARD page (index.html)
    if (document.getElementById('logout-button')) {
        // If the user lands here but has no token, send them to log in
        const token = getToken();
        if (!token) {
            window.location.href = '/auth.html';
            return;
        }

        // Example of using jwtDecode directly in the page logic
        try {
            const decoded = jwtDecode(token);
            console.log('Decoded token on dashboard:', decoded);
            // You can now use `decoded` to access claims, e.g., decoded.userId
            // For example, to display a welcome message:
            // const welcomeMessage = document.createElement('p');
            // welcomeMessage.textContent = `Welcome, user ${decoded.sub}!`; // Assuming 'sub' claim exists
            // document.body.insertBefore(welcomeMessage, document.getElementById('logout-button'));
        } catch (error) {
            console.error('Error decoding token on dashboard:', error);
        }

        // Handle logout
        document.getElementById('logout-button').addEventListener('click', () => {
            clearToken();
            window.location.href = '/auth.html';
        });
    }
});