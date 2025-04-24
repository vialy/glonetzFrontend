import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import UserEdit from './UserEdit';
import UserCreate from './UserCreate';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const API_URL = `${process.env.REACT_APP_API_URL}/api`;

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const { token, user: currentUser } = useAuth();
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des utilisateurs');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEditClick = (user) => {
    setEditUser(user);
  };

  const handleEditClose = () => {
    setEditUser(null);
  };

  const handleUserUpdate = (updatedUser) => {
    setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
    setSnackbar({
      open: true,
      message: 'Utilisateur modifié avec succès',
      severity: 'success'
    });
    // If the current user was updated, we need to refresh the page
    if (updatedUser._id === currentUser._id) {
      window.location.reload();
    }
  };

  const handleDeleteClick = (user) => {
    setDeleteUser(user);
  };

  const handleDeleteClose = () => {
    setDeleteUser(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`${API_URL}/users/${deleteUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression de l\'utilisateur');
      }

      // Remove the deleted user from the list
      setUsers(users.filter(u => u._id !== deleteUser._id));
      
      setSnackbar({
        open: true,
        message: 'Utilisateur supprimé avec succès',
        severity: 'success'
      });
      
      // If the current user was deleted, redirect to login
      if (deleteUser._id === currentUser._id) {
        window.location.href = '/login';
      }
      
      handleDeleteClose();
    } catch (err) {
      console.error('Error deleting user:', err);
      setSnackbar({
        open: true,
        message: err.message,
        severity: 'error'
      });
    }
  };

  const handleCreateClick = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateClose = () => {
    setIsCreateDialogOpen(false);
  };

  const handleUserCreated = (newUser) => {
    setUsers([...users, newUser]);
    setSnackbar({
      open: true,
      message: 'Utilisateur créé avec succès',
      severity: 'success'
    });
  };

  if (error) {
    return (
      <Typography color="error" align="center">
        {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Liste des Utilisateurs
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          Nouvel Utilisateur
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom d'utilisateur</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Date de création</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditClick(user)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  {user._id !== currentUser._id && (
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteClick(user)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {editUser && (
        <UserEdit
          user={editUser}
          open={Boolean(editUser)}
          onClose={handleEditClose}
          onUpdate={handleUserUpdate}
        />
      )}

      <UserCreate
        open={isCreateDialogOpen}
        onClose={handleCreateClose}
        onUserCreated={handleUserCreated}
      />

      {/* Confirmation Dialog for Delete */}
      <Dialog
        open={Boolean(deleteUser)}
        onClose={handleDeleteClose}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l'utilisateur "{deleteUser?.username}" ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserList; 