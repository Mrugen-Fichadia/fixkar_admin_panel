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
  Snackbar,
  Alert,
  IconButton,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon, 
  Clear as ClearIcon 
} from '@mui/icons-material';
import { useUsers } from '../../hooks/useUsers';
import type { User } from '../../hooks/useUsers';

export default function UserMaster() {
  const { 
    users, 
    loading, 
    error,
    updateUser, 
    deleteUser 
  } = useUsers();

  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter users to only show Customers
  const customerUsers = users.filter(user => user.role === 'Customer');
  
  // Filter customers by User ID or Name
  const filteredCustomers = customerUsers.filter(user => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    const userIdMatch = Boolean(
      (user.id && user.id.toLowerCase().includes(query)) ||
      (user.uid && user.uid.toLowerCase().includes(query))
    );
    const nameMatch = Boolean(user.name && user.name.toLowerCase().includes(query));
    return userIdMatch || nameMatch;
  });
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({ 
    name: '', 
    email: '',
    phone: '',
    address: '',
    role: 'Customer',
    isActive: true
  });

  const userRoles = [
    { value: 'Super Admin', label: 'Super Admin' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Support Staff', label: 'Support Staff' },
    { value: 'Customer', label: 'Customer' }
  ];
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const handleUpdateUser = async () => {
    if (!editingUser?.id) return;
    
    try {
      const result = await updateUser(editingUser.id, formData as Omit<User, 'id' | 'createdAt'>);
      if (result.success) {
        setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
        handleCloseModal();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Failed to update user', 
        severity: 'error' 
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const result = await deleteUser(id);
        if (result.success) {
          setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        setSnackbar({ 
          open: true, 
          message: error instanceof Error ? error.message : 'Failed to delete user', 
          severity: 'error' 
        });
      }
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role || 'Customer',
      isActive: user.isActive !== undefined ? user.isActive : true
    });
    setIsAddModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === 'isActive' ? value === 'true' : value
    }));
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingUser(null);
    setFormData({ 
      name: '', 
      email: '',
      phone: '',
      address: '',
      role: 'Customer',
      isActive: true
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Customer Management</Typography>
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: '300px' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : (
        <TableContainer 
          component={Paper} 
          sx={{ 
            maxHeight: 'calc(100vh - 250px)', 
            overflowY: 'auto',
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((user) => (
                  <TableRow key={user.uid || user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell sx={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} 
                              title={user.address}>
                      {user.address || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'inline-block', 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1,
                        backgroundColor: user.isActive ? 'success.light' : 'grey.300',
                        color: user.isActive ? 'success.contrastText' : 'text.secondary',
                        fontSize: '0.75rem',
                        fontWeight: 'medium'
                      }}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditClick(user)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteUser(user.id || '')} size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {searchTerm ? 'No matching customers found' : 'No customers found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={isAddModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                label="Role"
              >
                {userRoles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                name="isActive"
                value={formData.isActive?.toString() || 'true'}
                onChange={handleInputChange}
                label="Status"
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button 
            onClick={handleUpdateUser} 
            variant="contained" 
            color="primary"
            disabled={!formData.name || !formData.email}
          >
            {editingUser ? 'Update' : 'Add'} Customer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
