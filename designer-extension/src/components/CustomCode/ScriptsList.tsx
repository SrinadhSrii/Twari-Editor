import { CustomCode } from "../../types/types";
import {
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

/**
 * Props interface for the ScriptsList component
 * @property {CustomCode[]} scripts - Array of registered custom code scripts
 * @property {CustomCode | null} selectedScript - Currently selected script
 * @property {Function} onScriptSelect - Callback function when a script is selected
 */
interface ScriptsListProps {
  scripts: CustomCode[];
  selectedScript: CustomCode | null;
  onScriptSelect: (script: CustomCode) => void;
}

/**
 * ScriptsList component displays a list of registered custom code scripts.
 * It allows users to:
 * - View all registered scripts
 * - Select a script for management
 * - See script details (name, version)
 *
 * The list highlights the currently selected script and shows relevant metadata
 * for each script entry.
 *
 * @example
 * ```tsx
 * <ScriptsList
 *   scripts={registeredScripts}
 *   selectedScript={currentScript}
 *   onScriptSelect={handleScriptSelect}
 * />
 * ```
 */
export function ScriptsList({
  scripts,
  selectedScript,
  onScriptSelect,
}: ScriptsListProps) {
  return (
    <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Registered Scripts
      </Typography>
      <List>
        {scripts?.map((script) => (
          <ListItemButton
            key={script.id}
            selected={selectedScript?.id === script.id}
            onClick={() => onScriptSelect(script)}
            sx={{
              borderRadius: 1,
              mb: 1,
            }}
          >
            <ListItemText
              primary={script.displayName || "Unnamed Script"}
              secondary={`Version: ${script.version} • Created: ${new Date(
                script.createdOn || ""
              ).toLocaleString()}`}
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}
