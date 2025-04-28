import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography
} from '@mui/material';

const API_URL = `${process.env.REACT_APP_API_URL}/api`;

const UserEdit = ({ user, open, onClose, onUpdate }) => {
  const { token, user: currentUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'classique');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditingOwnProfile = currentUser._id === user._id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updateData = {
        username
      };

      // Only include password if it's not empty
      if (password) {
        updateData.password = password;
      }

      // Only include role if not editing own profile
      if (!isEditingOwnProfile) {
        updateData.role = role;
      }

      const response = await fetch(`${API_URL}/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      onUpdate(updatedUser);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Modifier l'Utilisateur</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              helperText="Laissez vide pour conserver le mot de passe actuel"
            />
            {!isEditingOwnProfile && (
              <FormControl fullWidth>
                <InputLabel>Rôle</InputLabel>
                <Select
                  value={role}
                  label="Rôle"
                  onChange={(e) => setRole(e.target.value)}
                >
                  <MenuItem value="admin">Administrateur</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="classique">Classique</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Modification...' : 'Modifier'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserEdit; 