import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState, useCallback, useRef } from "react";
import { useElementMapper } from "../../hooks/useElementMapper";
import { ElementMapping } from "../../types/element-mapping";
import { ElementTreeViewer } from "./ElementTreeViewer";
import { ElementTreeToolbar } from "./ElementTreeToolbar";

export function ElementsDashboard() {
  const [elementTree, setElementTree] = useState<ElementMapping | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { mapElement } = useElementMapper();
  const currentElementId = useRef<FullElementId | null>(null);
  const isMappingInProgress = useRef(false);

  const handleElementMapping = useCallback(
    async (element: AnyElement | null) => {
      if (!element) {
        return null;
      }
      return mapElement(element);
    },
    [mapElement]
  );

  const updateElementTree = useCallback(
    async (element: AnyElement | null) => {
      if (
        isMappingInProgress.current ||
        element?.id === currentElementId.current
      ) {
        return;
      }

      try {
        isMappingInProgress.current = true;
        setIsLoading(true);

        if (!element) {
          currentElementId.current = null;
          setElementTree(null);
          return;
        }

        currentElementId.current = element.id;
        const mappedTree = await handleElementMapping(element);
        setElementTree(mappedTree);
      } finally {
        isMappingInProgress.current = false;
        setIsLoading(false);
      }
    },
    [handleElementMapping]
  );

  useEffect(() => {
    webflow.getSelectedElement().then(updateElementTree);
    return webflow.subscribe("selectedelement", updateElementTree);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Elements & Styles Dashboard
      </Typography>

      <ElementTreeToolbar
        onSave={() => {
          const json = JSON.stringify(elementTree, null, 2);
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'element-tree.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }}
        onCopy={() => {
          const json = JSON.stringify(elementTree, null, 2);
          navigator.clipboard.writeText(json);
        }}
      />

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : elementTree ? (
        <ElementTreeViewer tree={elementTree} />
      ) : (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">
            Select an element to view its details
          </Typography>
        </Box>
      )}
    </Box>
  );
}
