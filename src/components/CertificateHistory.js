import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  CircularProgress,
  Paper
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import CreateIcon from '@mui/icons-material/Create';

const API_URL = `${process.env.REACT_APP_API_URL}/api`;

const CertificateHistory = ({ certificate, open, onClose }) => {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/certificates/${certificate._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch certificate history');
      }

      const data = await response.json();
      setHistory(data.generationHistory || []);
    } catch (err) {
      console.error('Error fetching certificate history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [certificate, token]);

  useEffect(() => {
    if (open && certificate) {
      fetchHistory();
    }
  }, [open, certificate, fetchHistory]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HistoryIcon sx={{ mr: 1 }} />
          Historique du certificat
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : !certificate ? (
          <Typography>Aucune information disponible</Typography>
        ) : (
          <>
            {/* Informations de création */}
            <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CreateIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  Création du certificat
                </Typography>
              </Box>
              <Typography>
                Créé par: {certificate.createdBy?.username || 'Utilisateur inconnu'}
              </Typography>
              <Typography>
                Date de création: {formatDate(certificate.createdAt)}
              </Typography>
            </Paper>

            {/* Historique des générations */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Historique des générations de PDF
            </Typography>
            
            {history.length === 0 ? (
              <Typography>Aucune génération de PDF enregistrée</Typography>
            ) : (
              <List>
                {history.map((entry, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={`Généré par ${entry.generatedBy?.username || 'Utilisateur inconnu'}`}
                        secondary={formatDate(entry.generatedAt)}
                      />
                    </ListItem>
                    {index < history.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CertificateHistory; 