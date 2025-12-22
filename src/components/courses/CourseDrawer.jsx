import React from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Stack,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublishIcon from '@mui/icons-material/Publish';
import ArchiveIcon from '@mui/icons-material/Archive';
import styles from './CourseDrawer.module.css';

const CourseDrawer = ({ course, open, onClose, onEdit, onDelete, onPublish, onArchive }) => {
  if (!course) return null;
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ className: styles.drawer }}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h6">{course.title || 'Untitled course'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {course.slug || 'no-slug'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />
      <Box className={styles.body}>
        <Stack spacing={1} direction="row" alignItems="center" flexWrap="wrap">
          <Chip label={course.status} size="small" sx={{ textTransform: 'capitalize' }} />
          <Chip label={`${course.durationMinutes || 0} minutes`} size="small" variant="outlined" />
          <Chip label={`${course.modules?.length || 0} modules`} size="small" variant="outlined" />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ marginTop: 1 }}>
          {course.description || 'No description provided.'}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={1}>
          <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>
            Open editor
          </Button>
          <Button startIcon={<PublishIcon />} onClick={onPublish}>
            Publish
          </Button>
          <Button startIcon={<ArchiveIcon />} onClick={onArchive}>
            Archive
          </Button>
          <Button startIcon={<DeleteIcon />} color="error" onClick={onDelete}>
            Delete
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default CourseDrawer;
