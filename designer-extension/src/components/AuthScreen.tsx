import { Container, Typography, Button } from "@mui/material";
import { useAuth } from "../hooks/useAuth";

/**
 * AuthScreen Component
 *
 * Displays the initial authentication screen with a button to start the OAuth flow.
 * If a user clicks the button, this component will open a popup window and monitor its state.
 * Once the popup is closed, it will trigger the onAuth callback in the parent component.
 *
 * @param onAuth - Callback function that runs after successful authentication.
 *                 This allows the parent component to respond to the auth completion
 *                 (e.g., refreshing the app state, navigating to a new page).
 *
 * Usage example:
 * <AuthScreen onAuth={() => console.log('User authenticated!')} />
 */
export function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const base_url = import.meta.env.VITE_NEXTJS_API_URL;

  // Initialize the auth hook which provides methods for authentication
  const { user } = useAuth();

  // Function to open the authorization popup authorization window
  const openAuthScreen = () => {
    console.log("Opening auth window..."); // Debug
    const authWindow = window.open(
      `${base_url}/api/auth/authorize?state=webflow_designer`,
      "_blank",
      "width=600,height=600"
    );

    // Check if the authorization window is closed
    const checkWindow = setInterval(() => {
      if (authWindow?.closed) {
        console.log("Auth window closed"); // Debug
        clearInterval(checkWindow);
        // The token exchange will be handled by the message event listener in App.tsx
        onAuth();
      }
    }, 1000);
  };

  return (
    <Container sx={{ padding: "20px" }}>
      <Typography variant="h1">
        {user.firstName
          ? `Welcome back ${user.firstName} 👋🏾`
          : "Hello Stranger 👋🏾"}
      </Typography>
      <Button
        variant="contained"
        sx={{ margin: "10px 20px" }}
        onClick={openAuthScreen}
      >
        Authorize App
      </Button>
    </Container>
  );
}
