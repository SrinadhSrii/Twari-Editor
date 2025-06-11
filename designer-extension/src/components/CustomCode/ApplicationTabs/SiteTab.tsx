import { Box, Button, Typography, CircularProgress } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { green } from "@mui/material/colors";
import { CustomCode } from "../../../types/types";
import { useAuth } from "../../../hooks/useAuth";
import { useApplicationStatus } from "../../../hooks/useCustomCode/useApplicationStatus";

/**
 * Props for the SiteTab component
 * @property {Object} currentSite - Current Webflow site information
 * @property {CustomCode | null} selectedScript - Currently selected script to apply
 * @property {Function} onApplyCode - Callback function to apply script to site
 */
interface SiteTabProps {
  currentSite?: {
    id: string;
    name: string;
  } | null;
  selectedScript: CustomCode | null;
  onApplyCode: (
    targetType: "site",
    targetId: string,
    location: "header" | "footer",
    sessionToken: string
  ) => Promise<void>;
}

/**
 * SiteTab component handles the application of scripts at the site level.
 * It provides functionality to:
 * - View current script application status for the site
 * - Apply scripts to either the header or footer of the site
 * - Display real-time feedback on script application status
 */
export function SiteTab({
  currentSite,
  selectedScript,
  onApplyCode,
}: Omit<SiteTabProps, "applicationStatus">) {
  // Get authentication token for API calls
  const { sessionToken } = useAuth();

  // Use React Query hook to manage script application status
  // This automatically handles:
  // - Fetching the current status
  // - Caching the results
  // - Updating when dependencies change
  // - Showing loading states
  const { applicationStatus, isLoading: isStatusLoading } =
    useApplicationStatus(
      sessionToken,
      selectedScript?.id,
      currentSite?.id,
      [] // Empty array since we're checking site-level status (no page IDs needed)
    );

  // Show loading state while fetching application status
  if (!currentSite || isStatusLoading) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <CircularProgress size={20} sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Loading site information...
        </Typography>
      </Box>
    );
  }

  /**
   * Handles applying the selected script to the site
   * The mutation in useScriptSelection will automatically:
   * - Apply the script via the API
   * - Invalidate the status cache
   * - Trigger a refetch of the status
   */
  const handleApplyCode = async (location: "header" | "footer") => {
    if (!selectedScript || !currentSite) return;

    try {
      await onApplyCode("site", currentSite.id, location, sessionToken);
      // Status will automatically update via React Query's cache invalidation
    } catch (error) {
      console.error("Error applying code to site:", error);
    }
  };

  // Get the application status for this specific site
  // This includes whether the script is applied and its location (header/footer)
  const siteStatus = applicationStatus[currentSite.id];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Apply to Site: {currentSite.name}
      </Typography>

      {/* Display current application status if script is applied */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        {selectedScript && siteStatus?.isApplied && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon sx={{ color: green[500] }} />
            <Typography variant="body2" color="text.secondary">
              Applied • Location: {siteStatus.location}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Action buttons for applying script */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => handleApplyCode("header")}
          disabled={!selectedScript}
        >
          Apply to Header
        </Button>
        <Button
          variant="contained"
          onClick={() => handleApplyCode("footer")}
          disabled={!selectedScript}
        >
          Apply to Footer
        </Button>
      </Box>
    </Box>
  );
}
