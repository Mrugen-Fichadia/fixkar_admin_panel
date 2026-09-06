import { useUsers } from '../../hooks/useUsers';
import type { User } from '../../hooks/useUsers';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
} from '@mui/material';
import { 
  KeyboardArrowDown, 
  KeyboardArrowUp, 
  Search as SearchIcon, 
  Clear as ClearIcon 
} from '@mui/icons-material';
import { useState } from 'react';
import ServiceManagement from './ServiceManagement';

function WorkerRow({ worker }: { worker: User }) {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Avatar
            src={worker.selfieImageUrl}
            alt={worker.name}
            sx={{
              width: 40,
              height: 40,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {worker.name?.[0]}
          </Avatar>
        </TableCell>
        <TableCell>{worker.name}</TableCell>
        <TableCell>{worker.email}</TableCell>
        <TableCell>{worker.phone || 'N/A'}</TableCell>
        <TableCell>
          <Box sx={{ 
            display: 'inline-block', 
            px: 1, 
            py: 0.5, 
            borderRadius: 1,
            backgroundColor: worker.isActive ? 'success.light' : 'grey.300',
            color: worker.isActive ? 'success.contrastText' : 'text.secondary',
            fontSize: '0.75rem',
            fontWeight: 'medium'
          }}>
            {worker.isActive ? 'Active' : 'Inactive'}
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                mb: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1, 
                border: '1px solid', 
                borderColor: 'divider',
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5 
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  User ID:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                  {worker.id || worker.uid || 'N/A'}
                </Typography>
              </Box>
              <ServiceManagement 
                workerId={worker.id || ''} 
                workerData={worker} 
              />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function KarigarMaster() {
  const { 
    users, 
    loading, 
    error
  } = useUsers();

  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter users to only show Workers
  const workerUsers = users.filter(user => user.role === 'Worker');

  // Filter workers by User ID or Name
  const filteredWorkers = workerUsers.filter(worker => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    const userIdMatch = Boolean(
      (worker.id && worker.id.toLowerCase().includes(query)) ||
      (worker.uid && worker.uid.toLowerCase().includes(query))
    );
    const nameMatch = Boolean(worker.name && worker.name.toLowerCase().includes(query));
    return userIdMatch || nameMatch;
  });

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Worker Management</Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          size="small"
          variant="outlined"
          placeholder="Search by User ID or Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 350, maxWidth: '100%' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <TableContainer component={Paper} sx={{
            maxHeight: 'calc(100vh - 250px)',
            overflowY: 'auto',
          }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Photo</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWorkers.length > 0 ? (
                  filteredWorkers.map((worker) => (
                    <WorkerRow key={worker.uid || worker.id} worker={worker} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {searchTerm ? 'No matching workers found' : 'No workers found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}
