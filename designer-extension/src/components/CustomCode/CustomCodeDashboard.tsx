import { useState, useEffect } from "react";
import { Box, Tab, Tabs, Paper, CircularProgress } from "@mui/material";
import {
  useScriptRegistration,
  useScriptSelection,
} from "../../hooks/useCustomCode";
import { ScriptRegistration, ScriptsList, SiteTab, PagesTab } from "./";
import { useAuth } from "../../hooks/useAuth";
import { CustomCode } from "../../types/types";
import { useSites } from "../../hooks/useSites";

/**
 * Props interface for the TabPanel component
 * @property {React.ReactNode} children - Content to be displayed in the tab panel
 * @property {number} index - Index of the tab panel
 * @property {number} value - Currently selected tab value
 */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * TabPanel component for managing content visibility based on selected tab
 * @param props - TabPanel properties
 */
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && children}
    </div>
  );
}

/**
 * CustomCodeDashboard is the main component for managing custom code scripts in a Webflow site.
 * It provides functionality to:
 * - Register new scripts (hosted or inline)
 * - View and select from existing scripts
 * - Apply scripts to either the entire site or specific pages
 * - Manage script locations (header/footer)
 *
 * The dashboard is organized into two main sections:
 * 1. Register Script: For adding new custom code
 * 2. Manage Scripts: For applying and managing existing scripts
 *
 * @example
 * ```tsx
 * // Basic usage in a React application
 * function App() {
 *   return (
 *     <CustomCodeDashboard />
 *   );
 * }
 * ```
 */
export function CustomCodeDashboard() {
  const { sessionToken } = useAuth();
  const {
    currentSite,
    isCurrentSiteLoading,
    isLoading: isSitesLoading,
  } = useSites(sessionToken, true);

  // Navigation state
  const [mainTab, setMainTab] = useState<"register" | "manage">("register");
  const [applicationTab, setApplicationTab] = useState(0);

  // Hook integrations for script management
  const {
    selectedScript,
    registeredScripts,
    fetchScripts,
    selectScript,
    applyScript,
  } = useScriptSelection();

  const { registerScript, isRegistering } = useScriptRegistration(
    sessionToken || "",
    currentSite?.id || ""
  );

  // Fetch scripts when switching to manage tab or when site/session changes
  useEffect(() => {
    if (mainTab === "manage" && currentSite?.id && sessionToken) {
      fetchScripts(currentSite.id, sessionToken);
    }
  }, [mainTab, currentSite?.id, sessionToken, fetchScripts]);

  // Show loading state while sites are being fetched
  if (isCurrentSiteLoading || isSitesLoading) {
    return (
      <Box sx={{ width: "100%", p: 2, textAlign: "center" }}>
        <CircularProgress size={20} sx={{ mr: 1 }} />
        Loading site information...
      </Box>
    );
  }

  // Show message if no current site is available
  if (!currentSite) {
    return (
      <Box sx={{ width: "100%", p: 2 }}>
        Unable to load site information. Please make sure you're in a Webflow
        Designer session.
      </Box>
    );
  }

  /**
   * Handles the registration of new custom code
   * @param code - The custom code to register
   * @param isHosted - Whether the code is hosted externally
   */
  const handleRegisterCode = async (code: string, isHosted: boolean) => {
    try {
      await registerScript(code, isHosted);
      await fetchScripts(currentSite?.id || "", sessionToken || "");
    } catch (error) {
      console.error("Error registering code:", error);
    }
  };

  /**
   * Handles navigation between main dashboard tabs
   * @param _event - React synthetic event
   * @param newValue - New tab value to switch to
   */
  const handleMainTabChange = (
    _event: React.SyntheticEvent,
    newValue: "register" | "manage"
  ) => {
    setMainTab(newValue);
  };

  /**
   * Handles navigation between application tabs (Site/Pages)
   * @param _event - React synthetic event
   * @param newValue - New tab index to switch to
   */
  const handleApplicationTabChange = (
    _event: React.SyntheticEvent,
    newValue: number
  ) => {
    setApplicationTab(newValue);
  };

  /**
   * Updates the currently selected script
   * @param script - The script to select for management
   */
  const handleScriptSelect = (script: CustomCode) => {
    selectScript(script);
  };

  /**
   * Wrapper for applying scripts to site
   */
  const handleApplyToSite = (
    targetType: "site",
    targetId: string,
    location: "header" | "footer",
    sessionToken: string
  ) => {
    return applyScript({
      targetType,
      targetId,
      location,
      sessionToken,
    });
  };

  /**
   * Wrapper for applying scripts to pages
   */
  const handleApplyToPages = (
    targetType: "page",
    pageIds: string[],
    location: "header" | "footer"
  ) => {
    return applyScript({
      targetType,
      targetId: pageIds,
      location,
      sessionToken: sessionToken || "",
    });
  };

  return (
    <Box sx={{ width: "100%", pb: "100px" }}>
      <Tabs value={mainTab} onChange={handleMainTabChange}>
        <Tab value="register" label="Register Script" />
        <Tab value="manage" label="Manage Scripts" />
      </Tabs>

      {mainTab === "register" && (
        <ScriptRegistration
          onRegister={handleRegisterCode}
          isRegistering={isRegistering}
        />
      )}

      {mainTab === "manage" && (
        <>
          <Paper elevation={0} sx={{ mb: 2 }}>
            <ScriptsList
              scripts={registeredScripts}
              selectedScript={selectedScript}
              onScriptSelect={handleScriptSelect}
            />
          </Paper>

          {registeredScripts.length > 0 && (
            <Paper elevation={0}>
              <Tabs
                value={applicationTab}
                onChange={handleApplicationTabChange}
                sx={{ borderBottom: 1, borderColor: "divider" }}
              >
                <Tab label="Apply to Site" />
                <Tab label="Apply to Pages" />
              </Tabs>

              <TabPanel value={applicationTab} index={0}>
                <SiteTab
                  currentSite={currentSite}
                  selectedScript={selectedScript}
                  onApplyCode={handleApplyToSite}
                />
              </TabPanel>

              <TabPanel value={applicationTab} index={1}>
                <PagesTab
                  selectedScript={selectedScript}
                  onApplyCode={handleApplyToPages}
                />
              </TabPanel>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}
