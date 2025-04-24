import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import CertificateForm from './CertificateForm';
import CertificateHistory from './CertificateHistory';
import ImportCertificates from './ImportCertificates';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  Grid,
  TablePagination,
  InputAdornment,
  Checkbox,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import HistoryIcon from '@mui/icons-material/History';
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

const SearchReferenceField = memo(({ value, onChange }) => (
  <TextField
    fullWidth
    label="Rechercher par numéro de référence"
    value={value}
    onChange={onChange}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon />
        </InputAdornment>
      ),
    }}
    sx={{
      '& .MuiInputBase-root': {
        '&.Mui-focused': {
          '& > input': {
            caretColor: 'auto',
          },
        },
      },
    }}
  />
));

const SearchGroupCodeField = memo(({ value, onChange }) => (
  <TextField
    fullWidth
    label="Groupe cde"
    value={value}
    onChange={onChange}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon />
        </InputAdornment>
      ),
    }}
    sx={{
      '& .MuiInputBase-root': {
        '&.Mui-focused': {
          '& > input': {
            caretColor: 'auto',
          },
        },
      },
    }}
  />
));

const CertificateList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchName, setSearchName] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchReference, setSearchReference] = useState('');
  const [searchGroupCode, setSearchGroupCode] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedCertificates, setSelectedCertificates] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressDialog, setProgressDialog] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { token, user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [certificatesToDelete, setCertificatesToDelete] = useState(null);
  const [groups, setGroups] = useState([]);

  const canModify = user.role === 'admin' || user.role === 'manager';
  const isAdmin = user.role === 'admin';

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/certificates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch certificates';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setCertificates(data);
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // Charger les groupes au chargement du composant
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(`${API_URL}/groups`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des groupes');
        const data = await response.json();
        setGroups(data);
      } catch (error) {
        console.error('Erreur:', error);
      }
    };
    fetchGroups();
  }, [token]);

  // Filtrage et tri des certificats
  useEffect(() => {
    let filtered = [...certificates];

    // Filtrage par nom
    if (searchName) {
      filtered = filtered.filter(cert => 
        cert.fullName.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filtrage par référence
    if (searchReference) {
      filtered = filtered.filter(cert => 
        cert.referenceNumber && cert.referenceNumber.toLowerCase().includes(searchReference.toLowerCase())
      );
    }

    // Filtrage par groupe
    if (searchGroupCode) {
      filtered = filtered.filter(cert => 
        cert.groupCode && cert.groupCode.toLowerCase().includes(searchGroupCode.toLowerCase())
      );
    }

    // Filtrage par date
    if (searchDate) {
      const searchDateObj = new Date(searchDate);
      filtered = filtered.filter(cert => {
        const certDate = new Date(cert.courseStartDate);
        return certDate.toDateString() === searchDateObj.toDateString();
      });
    }

    // Tri alphabétique
    filtered.sort((a, b) => {
      if (!a.fullName && !b.fullName) return 0;
      if (!a.fullName) return 1;
      if (!b.fullName) return -1;
      const comparison = a.fullName.localeCompare(b.fullName);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredCertificates(filtered);
  }, [certificates, searchName, searchReference, searchGroupCode, searchDate, sortOrder]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleFormSubmit = async (formData) => {
    try {
      const method = selectedCertificate ? 'PUT' : 'POST';
      const url = selectedCertificate 
        ? `${API_URL}/certificates/${selectedCertificate._id}`
        : `${API_URL}/certificates`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save certificate');
      }

      await response.json();
      
      // Rafraîchir la liste complète des certificats
      await fetchCertificates();

      setSnackbar({
        open: true,
        message: selectedCertificate ? 'Attestation modifiée avec succès' : 'Attestation créée avec succès',
        severity: 'success'
      });

      setIsFormOpen(false);
      setSelectedCertificate(null);
    } catch (err) {
      console.error('Error saving certificate:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Erreur lors de la sauvegarde de l\'attestation',
        severity: 'error'
      });
    }
  };

  const handleDeleteSelected = () => {
    // Trouver les objets certificats complets correspondant aux IDs sélectionnés
    const certsToDelete = certificates.filter(cert => 
      selectedCertificates.includes(cert._id)
    );
    setCertificatesToDelete(certsToDelete);
    setDeleteDialogOpen(true);
  };

  const handleDelete = (certificate) => {
    setCertificatesToDelete([certificate]);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;

      // Supprimer chaque certificat individuellement
      for (const certificate of certificatesToDelete) {
        const response = await fetch(`${API_URL}/certificates/${certificate._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Erreur lors de la suppression du certificat ${certificate._id}:`, errorData);
          errorCount++;
        } else {
          successCount++;
        }
      }

      // Mettre à jour la liste des certificats
      setCertificates(prevCertificates => 
        prevCertificates.filter(cert => 
          !certificatesToDelete.some(toDelete => toDelete._id === cert._id)
        )
      );
      
      // Afficher le message approprié
      if (errorCount === 0) {
        setSnackbar({
          open: true,
          message: `${successCount} certificat(s) supprimé(s) avec succès`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: `${successCount} certificat(s) supprimé(s), ${errorCount} échec(s)`,
          severity: 'warning'
        });
      }

      // Réinitialiser les états
      setSelectedCertificates([]);
      setCertificatesToDelete(null);
      setDeleteDialogOpen(false);
      
      // Rafraîchir la liste
      fetchCertificates();
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Erreur lors de la suppression des certificats',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (certificate) => {
    setSelectedCertificate(certificate);
    setIsFormOpen(true);
  };

  const handleDownloadPDF = async (certificateId) => {
    try {
      console.log('Début du téléchargement pour le certificat:', certificateId);
      console.log('Token utilisé:', token);
      
      const response = await axios.get(`${API_URL}/certificates/${certificateId}/pdf`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Vérifier si la réponse est bien un PDF
      if (response.data.type !== 'application/pdf') {
        // Si ce n'est pas un PDF, essayer de lire le message d'erreur
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            setSnackbar({
              open: true,
              message: errorData.error || 'Erreur lors du téléchargement du PDF',
              severity: 'error'
            });
          } catch (e) {
            setSnackbar({
              open: true,
              message: 'Erreur lors du téléchargement du PDF',
              severity: 'error'
            });
          }
        };
        reader.readAsText(response.data);
        return;
      }

      // Créer un blob à partir de la réponse
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificat_${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'PDF téléchargé avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur détaillée:', error);
      console.error('Réponse d\'erreur:', error.response);
      
      let errorMessage = 'Erreur lors du téléchargement du PDF';
      
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'Vous n\'avez pas les permissions nécessaires pour télécharger ce certificat';
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleViewHistory = (certificate) => {
    setSelectedCertificate(certificate);
    setHistoryOpen(true);
  };

  const handleSelectCertificate = (certificateId) => {
    setSelectedCertificates(prev => {
      if (prev.includes(certificateId)) {
        return prev.filter(id => id !== certificateId);
      } else {
        return [...prev, certificateId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCertificates.length === filteredCertificates.length) {
      setSelectedCertificates([]);
    } else {
      setSelectedCertificates(filteredCertificates.map(cert => cert._id));
    }
  };

  const handleGenerateSelected = async () => {
    if (selectedCertificates.length === 0) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner au moins un certificat',
        severity: 'warning'
      });
      return;
    }

    setIsGenerating(true);
    setProgressDialog(true);
    setProgress(0);
    let successCount = 0;
    let errorCount = 0;
    let retryCount = 0;
    const maxRetries = 3;
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const totalCertificates = selectedCertificates.length;
    const failedCertificates = [];

    // Fonction pour télécharger un seul PDF avec système de réessai
    const downloadSinglePDF = async (certificateId, attemptNumber = 1) => {
      try {
        // Attendre avant chaque tentative (sauf la première)
        if (attemptNumber > 1) {
          await delay(3000); // 3 secondes entre les tentatives
        }

        const response = await fetch(`http://localhost:5000/api/certificates/${certificateId}/pdf`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to download PDF for certificate ${certificateId}`);
        }

        const blob = await response.blob();
        
        // Vérifier que le blob n'est pas vide
        if (blob.size === 0) {
          throw new Error('Empty PDF received');
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate_${certificateId}.pdf`;
        document.body.appendChild(a);
        await delay(500); // Petit délai avant le clic
        a.click();
        await delay(500); // Petit délai après le clic
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        successCount++;
        const currentProgress = Math.round((successCount + errorCount) * 100 / totalCertificates);
        setProgress(currentProgress);
        return true;
      } catch (err) {
        console.error(`Error downloading PDF for certificate ${certificateId} (attempt ${attemptNumber}):`, err);
        
        // Réessayer si on n'a pas atteint le nombre maximum de tentatives
        if (attemptNumber < maxRetries) {
          retryCount++;
          // Augmenter le délai entre les tentatives
          await delay(3000 * attemptNumber); // Le délai augmente à chaque tentative
          return downloadSinglePDF(certificateId, attemptNumber + 1);
        }
        
        errorCount++;
        failedCertificates.push(certificateId);
        const currentProgress = Math.round((successCount + errorCount) * 100 / totalCertificates);
        setProgress(currentProgress);
        return false;
      }
    };

    try {
      // Traiter les certificats un par un avec un délai plus long entre chaque
      for (let i = 0; i < selectedCertificates.length; i++) {
        const certificateId = selectedCertificates[i];
        
        // Mettre à jour le message de progression
        setSnackbar({
          open: true,
          message: `Traitement du PDF ${i + 1}/${selectedCertificates.length}`,
          severity: 'info'
        });

        await downloadSinglePDF(certificateId);
        
        // Ajouter un délai plus long entre chaque téléchargement
        if (i < selectedCertificates.length - 1) {
          await delay(3000); // 3 secondes entre chaque téléchargement
        }
      }
    } catch (err) {
      console.error('Error in batch processing:', err);
    } finally {
      setIsGenerating(false);
      setProgressDialog(false);
      setProgress(0);
      
      // Message final avec informations sur les réessais et les échecs
      if (errorCount === 0) {
        setSnackbar({
          open: true,
          message: `${successCount} PDF(s) téléchargé(s) avec succès${retryCount > 0 ? ` (${retryCount} réessais réussis)` : ''}`,
          severity: 'success'
        });
      } else {
        // Si certains PDFs ont échoué, proposer de réessayer
        setSnackbar({
          open: true,
          message: `${successCount} PDF(s) téléchargé(s), ${errorCount} échec(s). ${failedCertificates.length > 0 ? 'Vous pouvez réessayer les PDFs qui ont échoué.' : ''}`,
          severity: 'warning'
        });
        
        // Mettre à jour la sélection pour ne garder que les PDFs qui ont échoué
        if (failedCertificates.length > 0) {
          setSelectedCertificates(failedCertificates);
        }
      }
    }
  };

  // Composant pour afficher un certificat en mode mobile (carte)
  const CertificateMobileCard = ({ certificate }) => (
    <Card sx={{ mb: 2, width: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {certificate.fullName}
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2">
            Niveau: {certificate.referenceLevel}
          </Typography>
          <Typography variant="body2">
            Début: {formatDate(certificate.courseStartDate)}
          </Typography>
          <Typography variant="body2">
            Fin: {formatDate(certificate.courseEndDate)}
          </Typography>
          {user?.role === 'admin' && (
            <Typography variant="body2">
              Créé par: {certificate.createdBy?.username || 'Inconnu'}
            </Typography>
          )}
        </Stack>
      </CardContent>
      <CardActions>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 1 }}>
          <Checkbox
            checked={selectedCertificates.includes(certificate._id)}
            onChange={() => handleSelectCertificate(certificate._id)}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Télécharger PDF">
              <IconButton 
                onClick={() => handleDownloadPDF(certificate._id)}
                size="small"
              >
                <PictureAsPdfIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Modifier">
              <IconButton
                onClick={() => handleEdit(certificate)}
                size="small"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            {user?.role === 'admin' && (
              <>
                <Tooltip title="Voir l'historique">
                  <IconButton
                    onClick={() => handleViewHistory(certificate)}
                    size="small"
                  >
                    <HistoryIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton
                    onClick={() => handleDelete(certificate)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
      </CardActions>
    </Card>
  );

  const handleSearchReferenceChange = useCallback((e) => {
    setSearchReference(e.target.value);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error" align="center" gutterBottom>
          {error}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button onClick={fetchCertificates} variant="contained">
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4, px: isMobile ? 2 : 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Liste des Certificats</Typography>
        <Box>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsFormOpen(true)}
              sx={{ mr: 1 }}
            >
              Nouveau Certificat
            </Button>
          )}
          {canModify && (
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => setIsImportOpen(true)}
              sx={{ mr: 1 }}
              disabled={!isAdmin}
            >
              Importer
            </Button>
          )}
          {selectedCertificates.length > 0 && (
            <>
              {isAdmin && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteSelected}
                  sx={{ mr: 1 }}
                >
                  Supprimer la sélection
                </Button>
              )}
              <Button
                variant="contained"
                color="primary"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleGenerateSelected}
              >
                Générer {selectedCertificates.length} PDF(s)
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Rechercher par nom"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SearchReferenceField
            value={searchReference}
            onChange={handleSearchReferenceChange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="group-search-label">Groupe code</InputLabel>
            <Select
              labelId="group-search-label"
              value={searchGroupCode}
              onChange={(e) => setSearchGroupCode(e.target.value)}
              label="Groupe code"
              sx={{
                height: '56px',
                minWidth: '250px',
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '44px',
                  minHeight: '56px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                },
                '& .MuiMenuItem-root': {
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }
              }}
              startAdornment={
                <InputAdornment position="start" sx={{ position: 'absolute', left: '14px' }}>
                  <SearchIcon />
                </InputAdornment>
              }
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: '300px',
                    width: 'auto',
                    minWidth: '250px'
                  }
                }
              }}
            >
              <MenuItem value="">
                <em>Tous les groupes</em>
              </MenuItem>
              {groups.map(group => (
                <MenuItem 
                  key={group.groupCode} 
                  value={group.groupCode}
                  sx={{
                    minHeight: '48px',
                    padding: '12px 16px'
                  }}
                >
                  {group.groupCode}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Filtrer par date"
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      {isMobile ? (
        // Vue mobile avec des cartes
        <Box>
          {filteredCertificates
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((certificate) => (
              <CertificateMobileCard key={certificate._id} certificate={certificate} />
            ))}
        </Box>
      ) : (
        // Vue desktop avec tableau
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedCertificates.length > 0 && selectedCertificates.length === filteredCertificates.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Nom complet</TableCell>
              <TableCell>N° de référence</TableCell>
              <TableCell>Niveau</TableCell>
              <TableCell>Date de début</TableCell>
              <TableCell>Date de fin</TableCell>
              <TableCell>Groupe</TableCell>
              <TableCell>Actions</TableCell>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? filteredCertificates.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : filteredCertificates
              ).map((certificate) => (
                <TableRow key={certificate._id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedCertificates.includes(certificate._id)}
                      onChange={() => handleSelectCertificate(certificate._id)}
                    />
                  </TableCell>
                  <TableCell>{certificate.fullName}</TableCell>
                  <TableCell>{certificate.referenceNumber}</TableCell>
                  <TableCell>{certificate.referenceLevel}</TableCell>
                  <TableCell>{formatDate(certificate.courseStartDate)}</TableCell>
                  <TableCell>{formatDate(certificate.courseEndDate)}</TableCell>
                  <TableCell>{certificate.groupCode}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleGenerateSelected()}
                      size="small"
                      title="Générer PDF"
                    >
                      <PictureAsPdfIcon />
                    </IconButton>
                    
                    {canModify && (
                      <IconButton
                        onClick={() => handleEdit(certificate)}
                        size="small"
                        title="Modifier"
                      >
                        <EditIcon />
                      </IconButton>
                    )}

                    {isAdmin && (
                      <IconButton
                        onClick={() => handleDelete(certificate)}
                        size="small"
                        color="error"
                        title="Supprimer"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}

                    {isAdmin && (
                      <IconButton
                        onClick={() => handleViewHistory(certificate)}
                        size="small"
                        title="Historique"
                      >
                        <HistoryIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredCertificates.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage={isMobile ? "Par page" : "Lignes par page"}
      />

      <CertificateForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedCertificate(null);
        }}
        onSubmit={handleFormSubmit}
        certificate={selectedCertificate}
      />

      <CertificateHistory
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          setSelectedCertificate(null);
        }}
        certificate={selectedCertificate}
      />

      <ImportCertificates
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={fetchCertificates}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialog de progression */}
      <Dialog open={progressDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Génération des PDFs en cours</DialogTitle>
        <DialogContent>
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {`${progress}% Complété`}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="body2">
                Veuillez patienter pendant la génération des PDFs...
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {certificatesToDelete?.length > 1
              ? `Êtes-vous sûr de vouloir supprimer ces ${certificatesToDelete.length} certificats ?`
              : 'Êtes-vous sûr de vouloir supprimer ce certificat ?'
            }
            {certificatesToDelete?.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Certificats à supprimer :</Typography>
                <List dense>
                  {certificatesToDelete.map(cert => (
                    <ListItem key={cert._id}>
                      <ListItemText 
                        primary={cert.fullName}
                        secondary={`${cert.referenceNumber} - ${cert.referenceLevel}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertificateList; 