import { Container, Typography, Button } from "@mui/material";
import { LoadingStates } from "./LoadingStates.tsx";
import DataTable from "./DataTable";
import { Site } from "../types/types.ts";

interface DashboardProps {
  user: { firstName: string };
  sites: Site[];
  isLoading: boolean;
  isError: boolean;
  error: string;
  onFetchSites: () => void;
}

/**
 * Dashboard Component
 *
 * The main interface after user authentication. This component:
 * 1. Welcomes the user with their first name
 * 2. Provides controls to fetch and display authorized Webflow sites
 * 3. Handles loading and error states during data fetching
 * 4. Displays site data in a table format when available
 *
 * @param user - Contains user information (e.g., firstName)
 * @param sites - Array of Webflow sites the user has access to
 * @param isLoading - Indicates if sites are being fetched
 * @param isError - Indicates if an error occurred during fetch
 * @param error - Error message to display if fetch failed
 * @param onFetchSites - Callback to trigger site data fetching
 *
 */
export function Dashboard({
  user,
  sites,
  isLoading,
  isError,
  error,
  onFetchSites,
}: DashboardProps) {
  return (
    <Container>
      <Typography variant="h1">Hello {user.firstName} 👋🏾</Typography>
      <Button
        variant="contained"
        sx={{ margin: "10px 20px" }}
        onClick={onFetchSites} // Fetch sites when the button is clicked
        disabled={isLoading} // Disable the button while loading
      >
        {isLoading ? "Loading Sites..." : "List Authorized Sites"}{" "}
        {/* Button text */}
      </Button>

      {/* Display loading and error states */}
      <LoadingStates isLoading={isLoading} isError={isError} error={error} />

      {/* Display the sites data in a table format */}
      {!isLoading && !isError && sites && sites.length > 0 && (
        <DataTable data={sites} />
      )}
    </Container>
  );
}
