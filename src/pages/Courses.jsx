import React from 'react';
import { Alert, Stack, Typography } from '@mui/material';
import styles from '../styles/Page.module.css';

const CoursesPage = () => {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Courses</h1>
          <p className={styles.subtitle}>Manage catalog, pricing, and availability.</p>
        </div>
      </div>
      <Stack spacing={2} className={styles.placeholder}>
        <Typography variant="body1">
          Course management will live here. For now, this placeholder outlines future functionality:
        </Typography>
        <Alert severity="info" variant="outlined">
          Add, edit, and disable courses across environments with audit trails and approval flows.
        </Alert>
        <Alert severity="info" variant="outlined">
          Bulk import/export, scheduling, and visibility toggles will be added in later milestones.
        </Alert>
      </Stack>
    </div>
  );
};

export default CoursesPage;
