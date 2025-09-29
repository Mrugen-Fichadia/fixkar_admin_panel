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
  IconButton
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
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
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
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
  
  // Filter users to only show Workers
  const workerUsers = users.filter(user => user.role === 'Worker');

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Worker Management</Typography>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workerUsers.length > 0 ? (
                  workerUsers.map((worker) => (
                    <WorkerRow key={worker.uid || worker.id} worker={worker} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No workers found
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
