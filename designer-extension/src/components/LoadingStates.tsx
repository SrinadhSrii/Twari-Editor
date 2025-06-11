import { Typography } from "@mui/material";

interface LoadingStatesProps {
  isLoading: boolean;
  isError: boolean;
  error?: string;
}

export function LoadingStates({
  isLoading,
  isError,
  error,
}: LoadingStatesProps) {
  if (isLoading) return <Typography>Loading...</Typography>;
  if (isError)
    return (
      <Typography color="error">{error || "An error occurred"}</Typography>
    );
  return null;
}
