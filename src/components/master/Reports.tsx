import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  type SelectChangeEvent, 
  CircularProgress,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TablePagination,
  Button
} from '@mui/material';
import { KeyboardArrowDown } from '@mui/icons-material';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import CloseIcon from '@mui/icons-material/Close';

interface AreaCount {
  area: string;
  count: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  [key: string]: any;
}

const Reports = () => {
  const [reportType, setReportType] = useState<string>('users');
  const [areaCounts, setAreaCounts] = useState<AreaCount[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<UserData | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const collectionName = reportType === 'users' ? 'users' : 'karigars';
      const snapshot = await getDocs(collection(db, collectionName));
      
      // Process the data to get area-wise counts
      const counts: Record<string, number> = {};
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const area = data.area || 'Unknown';
        counts[area] = (counts[area] || 0) + 1;
      });
      
      // Convert to array of objects
      const areaCountsArray = Object.entries(counts).map(([area, count]) => ({
        area,
        count
      }));
      
      setAreaCounts(areaCountsArray);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportTypeChange = (event: SelectChangeEvent) => {
    setReportType(event.target.value);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const handleViewDetails = async (area: string) => {
    try {
      const collectionName = reportType === 'users' ? 'users' : 'karigars';
      const q = query(
        collection(db, collectionName),
        where('area', '==', area === 'Unknown' ? '' : area)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      
      if (items.length > 0) {
        setSelectedItem(items[0]);
        setModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };

  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Reports
        </Typography>
        
        <FormControl sx={{ minWidth: 200, position: 'absolute', right: 24 }} size="small">
          <InputLabel id="report-type-label">Report Type</InputLabel>
          <Select
            labelId="report-type-label"
            id="report-type"
            value={reportType}
            label="Report Type"
            onChange={handleReportTypeChange}
            sx={{
              backgroundColor: 'background.paper',
              borderRadius: 1,
              '& .MuiOutlinedInput-notchedOutline': {
                border: '1px solid rgba(0, 0, 0, 0.23)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
            }}
          >
            <MenuItem value="users">Users</MenuItem>
            <MenuItem value="karigars">Karigars</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : areaCounts.length > 0 ? (
          <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Area</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {areaCounts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow hover key={item.area}>
                      <TableCell>{item.area}</TableCell>
                      <TableCell align="right">{item.count}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewDetails(item.area)}
                          endIcon={<KeyboardArrowDown />}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={areaCounts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>
        ) : (
          <Box p={4} textAlign="center">
            <Typography color="textSecondary">
              No data available for the selected report type
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Modal for showing item details */}
      <Modal
        open={modalOpen && !!selectedItem}
        onClose={handleCloseModal}
        aria-labelledby="item-details-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 800,
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          boxShadow: 24,
          borderRadius: 2,
          p: 3,
          overflow: 'auto'
        }}>
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="h6" component="h2">
              {selectedItem?.name || 'Details'}
            </Typography>
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ '& > div': { mb: 2 } }}>
            <Box display="flex">
              <Typography variant="subtitle2" sx={{ minWidth: 150, color: 'text.secondary' }}>Name:</Typography>
              <Typography>{selectedItem?.name || 'N/A'}</Typography>
            </Box>
            <Box display="flex">
              <Typography variant="subtitle2" sx={{ minWidth: 150, color: 'text.secondary' }}>Email:</Typography>
              <Typography>{selectedItem?.email || 'N/A'}</Typography>
            </Box>
            <Box display="flex">
              <Typography variant="subtitle2" sx={{ minWidth: 150, color: 'text.secondary' }}>Phone:</Typography>
              <Typography>{selectedItem?.phone || 'N/A'}</Typography>
            </Box>
            {reportType === 'karigars' && (
              <Box display="flex">
                <Typography variant="subtitle2" sx={{ minWidth: 150, color: 'text.secondary' }}>Service:</Typography>
                <Typography>{selectedItem?.service || 'N/A'}</Typography>
              </Box>
            )}
            <Box display="flex">
              <Typography variant="subtitle2" sx={{ minWidth: 150, color: 'text.secondary' }}>Status:</Typography>
              <Box 
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: selectedItem?.status === 'active' ? 'success.light' : 'error.light',
                  color: 'common.white',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}
              >
                {selectedItem?.status || 'inactive'}
              </Box>
            </Box>
            {/* Add more fields as needed */}
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCloseModal} variant="outlined">
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Reports;
