import React from 'react';
import {
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import styles from './CourseQuickView.module.css';

const CourseQuickView = ({ open, courses, onClose, onSelect }) => {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ className: styles.drawer }}>
      <Box className={styles.header}>
        <Typography variant="h6">Quick view</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />
      <List dense disablePadding>
        {courses.map((course) => (
          <ListItem key={course.id} button onClick={() => onSelect(course)} className={styles.listItem}>
            <ListItemAvatar>
              <Avatar>{course.title?.slice(0, 1) || '?'}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body1" className={styles.title}>
                    {course.title || 'Untitled'}
                  </Typography>
                  <Chip label={course.status} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                </Stack>
              }
              secondary={
                <Stack direction="row" spacing={1} alignItems="center" divider={<Divider orientation="vertical" flexItem />}>
                  <Typography variant="body2" color="text.secondary">
                    {course.slug || 'no-slug'}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                    <AccessTimeIcon fontSize="inherit" />
                    <Typography variant="caption">{course.durationMinutes || 0}m</Typography>
                  </Stack>
                </Stack>
              }
            />
          </ListItem>
        ))}
        {courses.length === 0 && (
          <Box className={styles.empty}>
            <Typography variant="body2" color="text.secondary">
              No courses loaded.
            </Typography>
          </Box>
        )}
      </List>
    </Drawer>
  );
};

export default CourseQuickView;
