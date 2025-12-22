import React, { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import PublishIcon from '@mui/icons-material/Publish';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';

const ActionConfirmDialog = ({ open, title, description, onCancel, onConfirm, confirmLabel, color = 'primary' }) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent dividers>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancel</Button>
      <Button onClick={onConfirm} variant="contained" color={color}>
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

const CourseActionsMenu = ({ anchorEl, onClose, onPublish, onArchive, onDelete, environment, isOpen }) => {
  const [dialog, setDialog] = useState(null);

  const handleAction = (type) => {
    setDialog(type);
    onClose();
  };

  const closeDialog = () => setDialog(null);

  const confirmCopy = environment === 'production'
    ? 'This will affect students in production. Please confirm you want to proceed.'
    : 'Confirm this action.';

  return (
    <>
      <Menu anchorEl={anchorEl} open={isOpen} onClose={onClose}>
        <MenuItem onClick={() => handleAction('publish')}>
          <ListItemIcon>
            <PublishIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Publish</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('archive')}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Archive</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" primaryTypographyProps={{ color: 'error.main' }} />
        </MenuItem>
      </Menu>

      <ActionConfirmDialog
        open={dialog === 'publish'}
        title="Publish course"
        description={`${confirmCopy} Publishing will make this course publicly accessible if visibility is public.`}
        onCancel={closeDialog}
        onConfirm={onPublish}
        confirmLabel="Publish"
      />
      <ActionConfirmDialog
        open={dialog === 'archive'}
        title="Archive course"
        description={`${confirmCopy} Students will lose active access.`}
        onCancel={closeDialog}
        onConfirm={onArchive}
        confirmLabel="Archive"
        color="warning"
      />
      <Dialog open={dialog === 'delete'} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete course</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity={environment === 'production' ? 'error' : 'warning'}>
              {environment === 'production'
                ? 'Production delete is irreversible. Consider archiving instead.'
                : 'Deleting will remove this draft permanently.'}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to delete this course? This action cannot be undone.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={onDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CourseActionsMenu;
