import React from 'react';
import { Box, Button, Chip, Divider, IconButton, Stack, TextField, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';

const statuses = ['draft', 'published', 'archived'];

const CourseFilters = ({ filters, onChange, onReset, onToggleDrawer }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <TextField
        size="small"
        placeholder="Search courses"
        value={filters.search || ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
        InputProps={{
          startAdornment: <SearchIcon fontSize="small" sx={{ marginRight: 1, color: 'text.secondary' }} />,
        }}
        sx={{ minWidth: 220 }}
      />

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Stack direction="row" spacing={1} alignItems="center">
        {statuses.map((status) => {
          const active = filters.status === status;
          return (
            <Chip
              key={status}
              label={status}
              color={active ? 'primary' : 'default'}
              variant={active ? 'filled' : 'outlined'}
              onClick={() => onChange({ ...filters, status: active ? undefined : status, page: 1 })}
              size="small"
              sx={{ textTransform: 'capitalize' }}
            />
          );
        })}
      </Stack>

      <Tooltip title="Reset filters">
        <span>
          <IconButton size="small" onClick={onReset} disabled={!filters.search && !filters.status && !filters.tag}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Box sx={{ flex: 1 }} />

      <Button
        variant="outlined"
        size="small"
        startIcon={<FilterListIcon fontSize="small" />}
        onClick={onToggleDrawer}
      >
        Quick view
      </Button>
    </Box>
  );
};

export default CourseFilters;
