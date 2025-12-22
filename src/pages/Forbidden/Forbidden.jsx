import React from 'react';
import { Alert, Stack, Typography } from '@mui/material';
import styles from '../../styles/Page.module.css';

const ForbiddenPage = () => {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Forbidden (403)</h1>
          <p className={styles.subtitle}>You do not have permission to access this page.</p>
        </div>
      </div>
      <Stack spacing={2} className={styles.placeholder}>
        <Typography variant="body1">
          This area is restricted to administrators. If you believe this is an error, contact your system
          administrator to update your access.
        </Typography>
        <Alert severity="warning" variant="outlined">
          Your session is active but missing the required <strong>admin</strong> role.
        </Alert>
      </Stack>
    </div>
  );
};

export default ForbiddenPage;
