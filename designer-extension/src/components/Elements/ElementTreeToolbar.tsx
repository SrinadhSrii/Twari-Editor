import { Box, Button, ButtonGroup } from "@mui/material";
import {
  SaveAlt as SaveIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";

interface ElementTreeToolbarProps {
  onSave?: () => void;
  onCopy?: () => void;
}

export function ElementTreeToolbar({
  onSave,
  onCopy,
}: ElementTreeToolbarProps) {
  return (
    <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center", justifyContent: "center" }}>
      <ButtonGroup variant="contained">
        <Button startIcon={<SaveIcon />} onClick={onSave}>
          Save Structure
        </Button>
        <Button startIcon={<CopyIcon />} onClick={onCopy}>
          Copy to Clipboard
        </Button>
      </ButtonGroup>
    </Box>
  );
}
