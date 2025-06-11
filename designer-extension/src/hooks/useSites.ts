import { useQuery } from "@tanstack/react-query";

export interface Site {
  id: string;
  name: string;
}

/*
  Custom hook for fetching and managing sites from the Next.js API.
  This hook handles:
  - Getting current site info from Webflow Designer API
  - Fetching all accessible sites for the current user
  - Managing site selection state
*/
export function useSites(sessionToken: string, hasClickedFetch: boolean) {
  const base_url = import.meta.env.VITE_NEXTJS_API_URL;

  // Query for current site from Webflow Designer
  const currentSiteQuery = useQuery({
    queryKey: ["currentSite"],
    queryFn: async () => {
      const siteInfo = await webflow.getSiteInfo();
      return {
        id: siteInfo.siteId,
        name: siteInfo.siteName,
      };
    },
  });

  // Query for all accessible sites
  const sitesQuery = useQuery({
    queryKey: ["sites", sessionToken],
    queryFn: async () => {
      if (!sessionToken) {
        return [];
      }

      const response = await fetch(`${base_url}/api/sites`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sites: ${response.statusText}`);
      }

      // Parse response and return sites
      const data = await response.json();
      return data.data.sites || [];
    },
    enabled: Boolean(sessionToken) && hasClickedFetch,
  });

  return {
    // Current site from Webflow Designer
    currentSite: currentSiteQuery.data,
    isCurrentSiteLoading: currentSiteQuery.isLoading,

    // All accessible sites
    sites: sitesQuery.data || [],
    isLoading: sitesQuery.isLoading,
    isError: sitesQuery.isError,
    error: sitesQuery.error,
    fetchSites: sitesQuery.refetch,
  };
}
