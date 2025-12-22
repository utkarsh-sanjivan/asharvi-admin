import React from 'react';
import { Alert, Stack, Typography } from '@mui/material';
import styles from '../styles/Page.module.css';

const SettingsPage = () => {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Configure platform behavior and preferences.</p>
        </div>
      </div>
      <Stack spacing={2} className={styles.placeholder}>
        <Typography variant="body1">
          Global settings will be available soon. Future updates will include authentication policies,
          branding controls, API keys, and environment-specific configuration.
        </Typography>
        <Alert severity="info" variant="outlined">
          Keep an eye out for feature flags, RBAC controls, and audit logging in upcoming works.
        </Alert>
      </Stack>
    </div>
  );
};

export default SettingsPage;
