import React, { useState } from 'react';
import { Alert, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import styles from '../styles/Page.module.css';
import DiagnosticsModal from '../features/diagnostics/DiagnosticsModal';
import { APP_VERSION } from '../config/version';

const SettingsPage = () => {
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Configure platform behavior and preferences.</p>
        </div>
      </div>
      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Diagnostics
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Access recent client-side events for troubleshooting. No personal data is captured.
            </Typography>
            <Button variant="contained" onClick={() => setDiagnosticsOpen(true)}>
              Open diagnostics
            </Button>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Application version
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You are running Asharvi Admin version <strong>{APP_VERSION}</strong>.
            </Typography>
            <Alert severity="info" sx={{ mt: 1 }}>
              Ensure backend deployments accept the correlation headers documented in the README.
            </Alert>
          </CardContent>
        </Card>
      </Stack>
      <DiagnosticsModal open={diagnosticsOpen} onClose={() => setDiagnosticsOpen(false)} />
    </div>
  );
};

export default SettingsPage;
