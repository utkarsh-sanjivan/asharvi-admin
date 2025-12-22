import React from 'react';
import { Alert, AlertTitle, Button, Stack } from '@mui/material';

const GlobalErrorBanner = ({ error, onRetry, onClose }) => {
  if (!error) return null;
  const { title, description, severity = 'error', suggestedAction, canRetry } = error;

  return (
    <Alert
      severity={severity}
      action={
        <Stack direction="row" spacing={1}>
          {canRetry && (
            <Button color="inherit" size="small" onClick={onRetry} disabled={!onRetry}>
              Retry
            </Button>
          )}
          {onClose && (
            <Button color="inherit" size="small" onClick={onClose}>
              Dismiss
            </Button>
          )}
        </Stack>
      }
      sx={{ mb: 2 }}
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      {description}
      {suggestedAction ? ` ${suggestedAction}` : ''}
    </Alert>
  );
};

export default GlobalErrorBanner;
