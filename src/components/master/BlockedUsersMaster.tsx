import { useState } from 'react';
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
  Tabs,
  Tab,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Search as SearchIcon,
  Clear as ClearIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { useBlockedUsers, type BlockedUserRecord } from '../../hooks/useBlockedUsers';

function BlockedUserRow({
  record,
  onUnblock,
}: {
  record: BlockedUserRecord;
  onUnblock: (record: BlockedUserRecord) => void;
}) {
  const [open, setOpen] = useState(false);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={600}>{record.userName}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            ID: {record.userId}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            label={record.userRole}
            size="small"
            color={record.userRole === 'Worker' ? 'secondary' : 'default'}
          />
        </TableCell>
        <TableCell sx={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={record.violationReason}>
          {record.violationReason}
        </TableCell>
        <TableCell>
          <Chip
            label={record.blockType}
            size="small"
            color={record.blockType === 'Permanent' ? 'error' : 'warning'}
            variant="outlined"
          />
        </TableCell>
        <TableCell>
          <Chip
            label={record.status}
            size="small"
            color={
              record.status === 'Active Block'
                ? 'error'
                : record.status === 'Scheduled Block'
                ? 'warning'
                : 'success'
            }
          />
        </TableCell>
        <TableCell>
          {record.blockType === 'Permanent' ? 'Permanent' : formatDate(record.unblockDate)}
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          {record.status !== 'Unblocked' && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<LockOpenIcon fontSize="small" />}
              onClick={() => onUnblock(record)}
            >
              Unblock
            </Button>
          )}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Paper variant="outlined" sx={{ margin: 2, p: 2.5, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mb: 2 }}>
                Full Blocking & Violation Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Target User Name:</Typography>
                  <Typography variant="body2" fontWeight={600}>{record.userName}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">User ID:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{record.userId}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Role / Email / Phone:</Typography>
                  <Typography variant="body2">{record.userRole} | {record.userEmail} | {record.userPhone}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Warning Notification Title:</Typography>
                  <Typography variant="body2" fontWeight={600}>{record.title}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Warning Message Sent:</Typography>
                  <Typography variant="body2" sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    {record.message}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Mandatory Violation Reason:</Typography>
                  <Typography variant="body2" sx={{ bgcolor: 'amber.50', p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'warning.light', fontWeight: 500 }}>
                    {record.violationReason}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Execution Timing:</Typography>
                  <Typography variant="body2" fontWeight={600}>{record.executionTime}</Typography>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Block Type & Duration:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {record.blockType} {record.blockDuration ? `(${record.blockDuration})` : ''}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Blocked At / Scheduled Date:</Typography>
                  <Typography variant="body2">
                    {record.blockedAt ? formatDate(record.blockedAt) : formatDate(record.scheduledBlockDate)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Unblock Expiry Date:</Typography>
                  <Typography variant="body2" fontWeight={600} color={record.blockType === 'Permanent' ? 'error.main' : 'text.primary'}>
                    {record.blockType === 'Permanent' ? 'Permanent' : formatDate(record.unblockDate)}
                  </Typography>
                </Grid>
              </Grid>

              {record.status !== 'Unblocked' && (
                <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<LockOpenIcon />}
                    onClick={() => onUnblock(record)}
                  >
                    Unblock User Now
                  </Button>
                </Box>
              )}
            </Paper>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function BlockedUsersMaster() {
  const { blockedUsers, loading, error, unblockUser } = useBlockedUsers();

  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [unblockTarget, setUnblockTarget] = useState<BlockedUserRecord | null>(null);
  const [unblocking, setUnblocking] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredUsers = blockedUsers.filter((record) => {
    // Tab filter
    if (tabValue === 1 && record.blockType !== 'Temporary') return false;
    if (tabValue === 2 && record.blockType !== 'Permanent') return false;
    if (tabValue === 3 && record.status !== 'Scheduled Block') return false;

    // Search filter
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      record.userName?.toLowerCase().includes(query) ||
      record.userId?.toLowerCase().includes(query) ||
      record.violationReason?.toLowerCase().includes(query)
    );
  });

  const handleConfirmUnblock = async () => {
    if (!unblockTarget) return;
    setUnblocking(true);
    await unblockUser(unblockTarget.id || '', unblockTarget.userId);
    setUnblocking(false);
    setUnblockTarget(null);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <BlockIcon color="error" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={600}>
          Blocked Users & Karigars
        </Typography>
      </Box>

      {/* Categories Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root.Mui-selected': {
              color: 'error.main',
              fontWeight: 600,
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'error.main',
            },
          }}
        >
          <Tab label={`All (${blockedUsers.length})`} />
          <Tab label={`Temporary (Limited Time) (${blockedUsers.filter(u => u.blockType === 'Temporary').length})`} />
          <Tab label={`Permanent (${blockedUsers.filter(u => u.blockType === 'Permanent').length})`} />
          <Tab label={`Scheduled (${blockedUsers.filter(u => u.status === 'Scheduled Block').length})`} />
        </Tabs>
      </Paper>

      {/* Search Box */}
      <Box sx={{ mb: 3 }}>
        <TextField
          size="small"
          variant="outlined"
          placeholder="Filter by Name, User ID or Reason..."
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
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              maxHeight: 'calc(100vh - 290px)',
              overflowY: 'auto',
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell width="5%"></TableCell>
                  <TableCell>Name & ID</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Violation Reason</TableCell>
                  <TableCell>Block Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Unblock Expiry</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((record) => (
                    <BlockedUserRow
                      key={record.id || record.userId}
                      record={record}
                      onUnblock={(r) => setUnblockTarget(r)}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      {searchTerm ? 'No matching blocked records found' : 'No blocked users/karigars found in this category'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Unblock Confirmation Dialog */}
      <Dialog open={Boolean(unblockTarget)} onClose={() => setUnblockTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
          <CheckCircleIcon /> Confirm Unblock
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1">
            Are you sure you want to unblock <strong>{unblockTarget?.userName}</strong> (ID: {unblockTarget?.userId})?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            This will reactivate their account and allow them to use the app again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnblockTarget(null)}>Cancel</Button>
          <Button onClick={handleConfirmUnblock} color="success" variant="contained" disabled={unblocking}>
            {unblocking ? <CircularProgress size={20} color="inherit" /> : 'Unblock Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
