import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  LinearProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = `${process.env.REACT_APP_API_URL}/api`;

// Constantes pour la conversion des dates Excel
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const excelEpoch = new Date(1900, 0, 1);

// Fonction pour convertir un numéro Excel en date lisible
const excelDateToString = (excelDate) => {
  if (!excelDate || typeof excelDate !== 'number') return excelDate;
  
  const daysSinceExcelEpoch = excelDate - 2; // Correction du bug Excel
  const date = new Date(excelEpoch.getTime() + (daysSinceExcelEpoch * millisecondsPerDay));
  
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Composant pour afficher une ligne de l'aperçu
const PreviewRow = ({ row }) => {
  // Convertir les dates pour l'affichage
  const birthDate = excelDateToString(row['Date de naissance']);
  const startDate = excelDateToString(row['Date de début']);
  const endDate = excelDateToString(row['Date de fin']);

  return (
    <TableRow>
      <TableCell>{row['Nom complet']}</TableCell>
      <TableCell style={{ color: typeof row['Date de naissance'] === 'number' ? 'green' : 'inherit' }}>
        {birthDate}
      </TableCell>
      <TableCell>{row['Lieu de naissance']}</TableCell>
      <TableCell>{row['Niveau de référence']}</TableCell>
      <TableCell style={{ color: typeof row['Date de début'] === 'number' ? 'green' : 'inherit' }}>
        {startDate}
      </TableCell>
      <TableCell style={{ color: typeof row['Date de fin'] === 'number' ? 'green' : 'inherit' }}>
        {endDate}
      </TableCell>
      <TableCell>{row['Nombre de leçons']}</TableCell>
      <TableCell>{row['Leçons suivies']}</TableCell>
      <TableCell>{row['Commentaires']}</TableCell>
    </TableRow>
  );
};

const ImportCertificates = ({ open, onClose, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importResults, setImportResults] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get(`${API_URL}/groups`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setGroups(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des groupes:', error);
        setError('Erreur lors de la récupération des groupes');
      }
    };

    if (open) {
      fetchGroups();
    }
  }, [open]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setSuccess('');
      setImportResults(null);
      
      // Lecture du fichier Excel
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: false, raw: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convertir en JSON en utilisant les en-têtes existants
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: true,
            defval: null
          });

          // Filtrer la première ligne qui contient les en-têtes
          const filteredData = jsonData.filter(row => 
            row['Nom complet'] !== 'Nom complet' && 
            row['Date de naissance'] !== 'Date de naissance'
          );

          // Afficher les données brutes pour le débogage
          console.log('Données Excel lues:', filteredData);
          
          // Mettre à jour l'aperçu avec les données filtrées
          setPreview(filteredData);
          
        } catch (err) {
          console.error('Erreur lors de la lecture du fichier:', err);
          setError('Format de fichier non valide. Veuillez utiliser un fichier Excel (.xlsx)');
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    if (!selectedGroup) {
      setError('Veuillez sélectionner un groupe');
      return;
    }

    // Valider les données avant l'envoi
    const validatedData = preview.map(row => {
      const validations = [];
      
      // Vérification de l'âge
      if (typeof row['Date de naissance'] === 'number') {
        const birthDate = new Date(excelEpoch.getTime() + ((row['Date de naissance'] - 2) * millisecondsPerDay));
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const isOldEnough = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
          ? age - 1 >= 14 
          : age >= 14;

        if (!isOldEnough) {
          validations.push("L'âge minimum requis est de 14 ans");
        }
      }

      // Vérification des dates de début et de fin
      if (typeof row['Date de début'] === 'number' && typeof row['Date de fin'] === 'number') {
        if (row['Date de début'] >= row['Date de fin']) {
          validations.push("La date de début doit être antérieure à la date de fin");
        }
      }

      return {
        data: row,
        isValid: validations.length === 0,
        validationErrors: validations
      };
    });

    // Vérifier s'il y a des erreurs de validation
    const hasValidationErrors = validatedData.some(item => !item.isValid);
    
    if (hasValidationErrors) {
      // Créer les résultats d'importation pour afficher les erreurs
      setImportResults({
        results: validatedData.map(item => ({
          fullName: item.data['Nom complet'],
          success: item.isValid,
          message: item.isValid ? 'Validation réussie' : item.validationErrors.join(', ')
        })),
        success: validatedData.filter(item => item.isValid).length,
        total: validatedData.length
      });
      
      setError('Certaines lignes contiennent des erreurs. Veuillez corriger les erreurs et réessayer.');
      return;
    }

    setLoading(true);
    setProgress(0);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('groupCode', selectedGroup);

    let progressInterval;

    try {
      // Simuler la progression
      progressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prevProgress + 10;
        });
      }, 500);

      const response = await axios.post(`${API_URL}/certificates/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      setImportResults(response.data);
      setSuccess(`${response.data.success} certificats importés avec succès sur un total de ${response.data.total}`);
      setLoading(false);
      
    } catch (err) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setLoading(false);
      setError(err.response?.data?.error || 'Erreur lors de l\'importation');
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setError('');
    setSuccess('');
    setImportResults(null);
    setProgress(0);
    setSelectedGroup('');
    if (onImportComplete) {
      onImportComplete();
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Importer des certificats</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            Importez un fichier Excel contenant les informations des certificats à créer.
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Le fichier doit contenir les colonnes suivantes : Nom complet, Date de naissance, Lieu de naissance, 
            Niveau de référence, Date de début, Date de fin, Nombre de leçons, Commentaires, Évaluation.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="group-select-label">Sélectionner un groupe</InputLabel>
            <Select
              labelId="group-select-label"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              label="Sélectionner un groupe"
              disabled={loading}
            >
              {groups.map((group) => (
                <MenuItem key={group.groupCode} value={group.groupCode}>
                  {group.groupCode}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <input
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            id="raised-button-file"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="raised-button-file">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
              disabled={loading}
            >
              Sélectionner un fichier
            </Button>
          </label>
          {file && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Fichier sélectionné : {file.name}
            </Typography>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {loading && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              {progress}% complété
            </Typography>
          </Box>
        )}

        {preview.length > 0 && !loading && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Aperçu du fichier :
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom complet</TableCell>
                    <TableCell>Date de naissance</TableCell>
                    <TableCell>Lieu de naissance</TableCell>
                    <TableCell>Niveau</TableCell>
                    <TableCell>Date de début</TableCell>
                    <TableCell>Date de fin</TableCell>
                    <TableCell>Nombre de leçons</TableCell>
                    <TableCell>Leçons suivies</TableCell>
                    <TableCell>Commentaires</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.map((row, index) => (
                    <PreviewRow key={index} row={row} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {importResults && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
              Résultats de l'importation :
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importResults.results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.fullName}</TableCell>
                      <TableCell>
                        {result.success ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </TableCell>
                      <TableCell>{result.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {!loading && (
          <>
            <Button onClick={handleClose}>
              {importResults ? 'Fermer' : 'Annuler'}
            </Button>
            {!importResults && (
              <Button 
                onClick={handleImport} 
                variant="contained" 
                color="primary"
                disabled={!file || !selectedGroup || loading}
              >
                Importer
              </Button>
            )}
          </>
        )}
        {loading && (
          <Button 
            variant="contained" 
            color="primary"
            disabled
          >
            Importation en cours...
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportCertificates; 