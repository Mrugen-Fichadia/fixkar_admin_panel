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
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  TablePagination,
  Tooltip,
  Chip,
  Collapse
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useServices, type ServiceCategory, type ServiceSubCategory } from '../../hooks/useServices';

export default function ServicesMaster() {
  const { 
    categories, 
    loading, 
    error,
    addCategory,
    updateCategory,
    deleteCategory
  } = useServices();
  
  // Alias services to categories for backward compatibility
  const services = categories;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedService, setExpandedService] = useState<string | null>(null);
  
  // Service Dialog State
  const [serviceDialog, setServiceDialog] = useState<{
    open: boolean;
    service: Partial<Service> | null;
    isEdit: boolean;
  }>({ open: false, service: null, isEdit: false });

  // SubService Dialog State
  const [subServiceDialog, setSubServiceDialog] = useState<{
    open: boolean;
    serviceId: string;
    subService: Partial<SubService> | null;
    isEdit: boolean;
  }>({ open: false, serviceId: '', subService: null, isEdit: false });

  // Filter services based on search term
  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Service Handlers
  const handleAddService = () => {
    setServiceDialog({
      open: true,
      service: { 
        name: '',
        category: '',
        price: '',
        duration: '',
        status: 'Active',
        subServices: []
      },
      isEdit: false
    });
  };

  const handleEditService = (service: Service) => {
    setServiceDialog({
      open: true,
      service: { ...service },
      isEdit: true
    });
  };

  const handleSaveService = async () => {
    const { service, isEdit } = serviceDialog;
    if (!service) return;

    try {
      if (isEdit && service.id) {
        await updateCategory(service.id, { 
          name: service.name,
          status: service.status || 'Active'
        });
      } else {
        await addCategory({ 
          name: service.name,
          status: service.status || 'Active'
        });
      }
      
      setServiceDialog({ open: false, service: null, isEdit: false });
    } catch (error) {
      console.error('Error saving service:', error);
      // You might want to show an error message to the user here
    }
  };

  // Add this function to handle status toggle
  const handleStatusToggle = async (id: string, currentStatus: 'Active' | 'Inactive' = 'Active') => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      await updateCategory(id, { status: newStatus });
    } catch (error) {
      console.error('Error toggling status:', error);
      // You might want to show an error message to the user here
    }
  };

  // SubService Handlers
{{ ... }}
  const handleAddSubService = (serviceId: string) => {
    setSubServiceDialog({
      open: true,
      serviceId,
      subService: {
        name: '',
        price: '',
        duration: '',
        status: 'Active'
      },
      isEdit: false
    });
  };

  const handleEditSubService = (serviceId: string, subService: SubService) => {
    setSubServiceDialog({
      open: true,
      serviceId,
      subService: { ...subService },
      isEdit: true
    });
  };

  const handleSaveSubService = async () => {
    const { serviceId, subService, isEdit } = subServiceDialog;
    if (!subService) return;

    try {
      if (isEdit && subService.id) {
        await updateCategory(subService.id, { 
          name: subService.name,
          status: subService.status || 'Active',
          parentId: serviceId
        });
      } else if (serviceId) {
        await addCategory({ 
          name: subService.name, 
          status: subService.status || 'Active',
          parentId: serviceId
        });
      }
      
      setSubServiceDialog({ open: false, serviceId: '', subService: null, isEdit: false });
    } catch (error) {
      console.error('Error saving subservice:', error);
      // You might want to show an error message to the user here
    }
  };

  // Toggle service expansion
  const toggleServiceExpansion = (serviceId: string) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
  };

  // Format date
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">Services Master</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddService}
        >
          Add Service
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
          }}
        />
      </Box>

      {/* Services Table */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="5%"></TableCell>
                <TableCell>Service Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created On</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Loading services...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ color: 'error.main' }}>
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No services found
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((service) => (
                    <>
                      <TableRow key={service.id} hover>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => toggleServiceExpansion(service.id || '')}
                          >
                            {expandedService === service.id ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                        </TableCell>
                        <TableCell>{service.name}</TableCell>
                        <TableCell>{service.subCategories?.length || 0} subcategories</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Switch
                              checked={service.status === 'Active'}
                              onChange={() => handleStatusToggle(service.id || '', service.status || 'Active')}
                              color="primary"
                              size="small"
                            />
                            <Chip 
                              label={service.status}
                              color={service.status === 'Active' ? 'success' : 'default'}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>{formatDate(service.createdAt)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Edit Service">
                              <IconButton 
                                size="small" 
                                onClick={() => handleEditService(service)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Service">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => service.id && deleteService(service.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                      
                      {/* Subservices Row */}
                      <TableRow>
                        <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                          <Collapse in={expandedService === service.id} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle1">Subservices</Typography>
                                <Button 
                                  size="small" 
                                  startIcon={<AddIcon />}
                                  onClick={() => service.id && handleAddSubService(service.id)}
                                >
                                  Add Subservice
                                </Button>
                              </Box>
                              
                              {service.subCategories && service.subCategories.length > 0 ? (
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Subservice Name</TableCell>
                                      <TableCell>Price</TableCell>
                                      <TableCell>Duration</TableCell>
                                      <TableCell>Status</TableCell>
                                      <TableCell>Created On</TableCell>
                                      <TableCell>Actions</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {service.subCategories.map((sub) => (
                                      <TableRow key={sub.id}>
                                        <TableCell>{sub.name}</TableCell>
                                        <TableCell>-</TableCell>
                                        <TableCell>-</TableCell>
                                        <TableCell>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Switch
                                              checked={sub.status === 'Active'}
                                              onChange={() => handleStatusToggle(sub.id || '', sub.status || 'Active')}
                                              color="primary"
                                              size="small"
                                            />
                                            <Chip 
                                              label={sub.status}
                                              color={sub.status === 'Active' ? 'success' : 'default'}
                                              size="small"
                                              variant="outlined"
                                            />
                                          </Box>
                                        </TableCell>
                                        <TableCell>{formatDate(sub.createdAt)}</TableCell>
                                        <TableCell>
                                          <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title="Edit Subservice">
                                              <IconButton 
                                                size="small" 
                                                onClick={() => service.id && handleEditSubService(service.id, sub as ServiceSubCategory)}
                                              >
                                                <EditIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Subservice">
                                              <IconButton 
                                                size="small" 
                                                color="error"
                                                onClick={() => sub.id && deleteCategory(sub.id)}
                                              >
                                                <DeleteIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  No subservices added yet.
                                </Typography>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredServices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Service Dialog */}
      <Dialog 
        open={serviceDialog.open} 
        onClose={() => setServiceDialog({ ...serviceDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {serviceDialog.isEdit ? 'Edit Service' : 'Add New Service'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Service Name"
              fullWidth
              value={serviceDialog.service?.name || ''}
              onChange={(e) => setServiceDialog({
                ...serviceDialog,
                service: { ...serviceDialog.service, name: e.target.value }
              })}
            />
            <TextField
              label="Category"
              fullWidth
              value={serviceDialog.service?.category || ''}
              onChange={(e) => setServiceDialog({
                ...serviceDialog,
                service: { ...serviceDialog.service, category: e.target.value }
              })}
            />
            <TextField
              label="Price (₹)"
              type="number"
              fullWidth
              value={serviceDialog.service?.price || ''}
              onChange={(e) => setServiceDialog({
                ...serviceDialog,
                service: { ...serviceDialog.service, price: e.target.value }
              })}
            />
            <TextField
              label="Duration"
              placeholder="e.g., 1 hour"
              fullWidth
              value={serviceDialog.service?.duration || ''}
              onChange={(e) => setServiceDialog({
                ...serviceDialog,
                service: { ...serviceDialog.service, duration: e.target.value }
              })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={serviceDialog.service?.status === 'Active'}
                  onChange={(e) => setServiceDialog({
                    ...serviceDialog,
                    service: { 
                      ...serviceDialog.service, 
                      status: e.target.checked ? 'Active' : 'Inactive' 
                    }
                  })}
                  color="primary"
                />
              }
              label={serviceDialog.service?.status === 'Active' ? 'Active' : 'Inactive'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setServiceDialog({ ...serviceDialog, open: false })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveService} 
            variant="contained"
            disabled={!serviceDialog.service?.name || !serviceDialog.service?.category}
          >
            {serviceDialog.isEdit ? 'Update' : 'Add'} Service
          </Button>
        </DialogActions>
      </Dialog>

      {/* SubService Dialog */}
      <Dialog 
        open={subServiceDialog.open} 
        onClose={() => setSubServiceDialog({ ...subServiceDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {subServiceDialog.isEdit ? 'Edit Subservice' : 'Add New Subservice'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Subservice Name"
              fullWidth
              value={subServiceDialog.subService?.name || ''}
              onChange={(e) => setSubServiceDialog({
                ...subServiceDialog,
                subService: { ...subServiceDialog.subService, name: e.target.value }
              })}
            />
            <TextField
              label="Price (₹)"
              type="number"
              fullWidth
              value={subServiceDialog.subService?.price || ''}
              onChange={(e) => setSubServiceDialog({
                ...subServiceDialog,
                subService: { ...subServiceDialog.subService, price: e.target.value }
              })}
            />
            <TextField
              label="Duration"
              placeholder="e.g., 1 hour"
              fullWidth
              value={subServiceDialog.subService?.duration || ''}
              onChange={(e) => setSubServiceDialog({
                ...subServiceDialog,
                subService: { ...subServiceDialog.subService, duration: e.target.value }
              })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={subServiceDialog.subService?.status === 'Active'}
                  onChange={(e) => setSubServiceDialog({
                    ...subServiceDialog,
                    subService: { 
                      ...subServiceDialog.subService, 
                      status: e.target.checked ? 'Active' : 'Inactive' 
                    }
                  })}
                  color="primary"
                />
              }
              label={subServiceDialog.subService?.status === 'Active' ? 'Active' : 'Inactive'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setSubServiceDialog({ ...subServiceDialog, open: false })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSubService} 
            variant="contained"
            disabled={!subServiceDialog.subService?.name}
          >
            {subServiceDialog.isEdit ? 'Update' : 'Add'} Subservice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
