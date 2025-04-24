import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const GroupManagement = () => {
  const { token } = useAuth();
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogSuccess, setDialogSuccess] = useState('');
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    level: '',
    startDate: '',
    timeSlot: '',
    name: ''
  });

  const timeSlots = [
    { value: 'MO', label: 'Matin' },
    { value: 'MI', label: 'Midi' },
    { value: 'NM', label: 'Après-midi' },
    { value: 'AB', label: 'Soir' }
  ];

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération des groupes');
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleOpen = () => {
    setOpen(true);
    setEditingGroup(null);
    setError('');
    setDialogSuccess('');
    setFormData({
      level: '',
      startDate: '',
      timeSlot: '',
      name: ''
    });
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
    setDialogSuccess('');
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      level: group.level,
      startDate: new Date(group.startDate).toISOString().split('T')[0],
      timeSlot: group.timeSlot,
      name: group.name
    });
    setOpen(true);
  };

  const handleDelete = async (groupId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression du groupe');
      
      setGroups(groups.filter(g => g._id !== groupId));
      setSuccess('Groupe supprimé avec succès');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDialogSuccess('');
    setSuccess('');

    try {
      const url = editingGroup 
        ? `${process.env.REACT_APP_API_URL}/api/groups/${editingGroup._id}`
        : `${process.env.REACT_APP_API_URL}/api/groups`;
      
      const response = await fetch(url, {
        method: editingGroup ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde du groupe');
      }
      
      const savedGroup = await response.json();
      
      if (editingGroup) {
        setGroups(groups.map(g => g._id === savedGroup._id ? savedGroup : g));
      } else {
        setGroups([...groups, savedGroup]);
      }

      const successMessage = `Groupe ${editingGroup ? 'modifié' : 'créé'} avec succès`;
      setDialogSuccess(successMessage);
      setSuccess(successMessage);
      
      // Fermer la boîte de dialogue après un délai
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Gestion des Groupes</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Nouveau Groupe
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code du Groupe</TableCell>
              <TableCell>Niveau</TableCell>
              <TableCell>Date de début</TableCell>
              <TableCell>Horaire</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group._id}>
                <TableCell>{group.groupCode}</TableCell>
                <TableCell>{group.level}</TableCell>
                <TableCell>{formatDate(group.startDate)}</TableCell>
                <TableCell>
                  {timeSlots.find(slot => slot.value === group.timeSlot)?.label}
                </TableCell>
                <TableCell>{group.name}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(group)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(group._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGroup ? 'Modifier le Groupe' : 'Nouveau Groupe'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {dialogSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {dialogSuccess}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Niveau</InputLabel>
                <Select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  label="Niveau"
                  required
                >
                  {levels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                type="date"
                label="Date de début"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <FormControl fullWidth>
                <InputLabel>Horaire</InputLabel>
                <Select
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  label="Horaire"
                  required
                >
                  {timeSlots.map((slot) => (
                    <MenuItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Nom"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Annuler</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={!!dialogSuccess}
            >
              {editingGroup ? 'Modifier' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default GroupManagement; 