import React from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import styles from '../../styles/Page.module.css';

const NotFoundPage = () => {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Page Not Found</h1>
          <p className={styles.subtitle}>The page you are looking for does not exist.</p>
        </div>
      </div>
      <Stack spacing={2} className={styles.placeholder}>
        <Typography variant="body1">
          Check the URL or return to the dashboard to continue working in Asharvi Admin.
        </Typography>
        <Button variant="contained" component={RouterLink} to="/dashboard" sx={{ alignSelf: 'flex-start' }}>
          Back to Dashboard
        </Button>
      </Stack>
    </div>
  );
};

export default NotFoundPage;
