import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import styles from './EmptyState.module.css';

const EmptyState = ({ onCreate }) => (
  <Box className={styles.emptyBox}>
    <Typography variant="h6" gutterBottom>
      No courses yet
    </Typography>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      Create your first course to get started.
    </Typography>
    <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate}>
      New Course
    </Button>
  </Box>
);

export default EmptyState;
