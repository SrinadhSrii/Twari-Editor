import { useState, useCallback } from "react";

export function useScriptVersions(sessionToken: string) {
  const [versions, setVersions] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchVersions = useCallback(
    async (scriptId: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_NEXTJS_API_URL
          }/api/custom-code/versions/${scriptId}`,
          {
            headers: {
              Authorization: `Bearer ${sessionToken}`,
            },
          }
        );
        const { versions: scriptVersions } = await response.json();

        setVersions((prev) => ({
          ...prev,
          [scriptId]: scriptVersions,
        }));

        return scriptVersions;
      } catch (error) {
        console.error("Error fetching versions:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [sessionToken]
  );

  return {
    versions,
    isLoading,
    fetchVersions,
  };
}
