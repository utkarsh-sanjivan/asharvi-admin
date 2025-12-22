import React, { useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { APP_VERSION } from '../../config/version';
import { useDiagnosticsEvents } from './diagnosticsStore';

const DiagnosticsModal = ({ open, onClose }) => {
  const events = useDiagnosticsEvents();
  const [copied, setCopied] = useState(false);

  const formatted = useMemo(
    () =>
      events
        .slice()
        .reverse()
        .map((event) => ({
          ...event,
          payload: event.payload || undefined,
        })),
    [events]
  );

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(formatted, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Diagnostics</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Version: <strong>{APP_VERSION}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Recent events (newest first). No PII is recorded here.
          </Typography>
          <Box
            sx={{
              maxHeight: 360,
              overflow: 'auto',
              borderRadius: 1,
              border: '1px solid #e5e7eb',
              padding: 1.5,
              fontFamily: 'monospace',
              fontSize: 12,
              color: '#111827',
              backgroundColor: '#f8fafc',
            }}
          >
            {formatted.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No diagnostics yet.
              </Typography>
            ) : (
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(formatted, null, 2)}</pre>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={copyToClipboard} variant="contained">
          {copied ? 'Copied' : 'Copy to clipboard'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiagnosticsModal;
