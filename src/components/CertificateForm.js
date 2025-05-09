import React, { useState, useEffect } from 'react';
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
  Grid,
  CircularProgress,
  Typography
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const API_URL = `${process.env.REACT_APP_API_URL}/api`;

const courseInfoOptions = [
  { value: 'Complete level', label: 'Complete level' },
  { value: 'Partially completed level', label: 'Partially completed level' },
  { value: 'Course dropped out', label: 'Course dropped out' },
  { value: 'No participation', label: 'No participation' }
];

const CertificateForm = ({ open, onClose, onSubmit, certificate = null }) => {
  const { token } = useAuth();
  const [groups, setGroups] = useState([]);
  const [dateError, setDateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fonction pour formater la date en YYYY-MM-DD sans décalage horaire
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    // Créer une date à partir de la chaîne de caractères
    const date = new Date(dateString);
    
    // Extraire année, mois et jour
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Retourner la date au format YYYY-MM-DD
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    fullName: certificate?.fullName || '',
    dateOfBirth: certificate?.dateOfBirth ? formatDateForInput(certificate.dateOfBirth) : '',
    placeOfBirth: certificate?.placeOfBirth || '',
    referenceLevel: certificate?.referenceLevel || 'A1',
    courseStartDate: certificate?.courseStartDate ? formatDateForInput(certificate.courseStartDate) : '',
    courseEndDate: certificate?.courseEndDate ? formatDateForInput(certificate.courseEndDate) : '',
    lessonUnits: certificate?.lessonUnits || '',
    lessonsAttended: certificate?.lessonsAttended || '',
    evaluation: certificate?.evaluation || 'Participant',
    courseInfo: certificate?.courseInfo || '',
    comments: certificate?.comments || '',
    groupCode: certificate?.groupCode || ''
  });

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

  // Mettre à jour les champs quand le certificat change
  useEffect(() => {
    if (certificate) {
      console.log('Certificate to edit:', certificate);
      const formattedData = {
        fullName: certificate.fullName || '',
        dateOfBirth: formatDateForInput(certificate.dateOfBirth) || '',
        placeOfBirth: certificate.placeOfBirth || '',
        referenceLevel: certificate.referenceLevel || '',
        courseStartDate: formatDateForInput(certificate.courseStartDate) || '',
        courseEndDate: formatDateForInput(certificate.courseEndDate) || '',
        lessonUnits: certificate.lessonUnits || '',
        lessonsAttended: certificate.lessonsAttended || '',
        comments: certificate.comments || '',
        evaluation: certificate.evaluation || '',
        courseInfo: certificate.courseInfo || '',
        groupCode: certificate.groupCode || ''
      };
      console.log('Formatted form data:', formattedData);
      setFormData(formattedData);
    } else {
      // Réinitialiser le formulaire quand on crée un nouveau certificat
      setFormData({
        fullName: '',
        dateOfBirth: '',
        placeOfBirth: '',
        referenceLevel: 'A1',
        courseStartDate: '',
        courseEndDate: '',
        lessonUnits: '',
        lessonsAttended: '',
        comments: '',
        evaluation: 'Participant',
        courseInfo: '',
        groupCode: ''
      });
    }
  }, [certificate]);

  const validateDates = (startDate, endDate) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return 'La date de fin ne peut pas être antérieure à la date de début';
      }
    }
    return '';
  };

  const validateGroupStartDate = (startDate, groupCode) => {
    if (startDate && groupCode) {
      const selectedGroup = groups.find(group => group.groupCode === groupCode);
      if (selectedGroup) {
        const certificateStart = new Date(startDate);
        const groupStart = new Date(selectedGroup.startDate);
        // Comparer uniquement les dates (sans l'heure)
        certificateStart.setHours(0, 0, 0, 0);
        groupStart.setHours(0, 0, 0, 0);
        if (certificateStart.getTime() !== groupStart.getTime()) {
          return `La date de début doit correspondre à la date de début du groupe (${groupStart.toLocaleDateString()})`;
        }
      }
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Field changed:', name, value);
    
    if (name === 'groupCode') {
      // Trouver le groupe sélectionné
      const selectedGroup = groups.find(group => group.groupCode === value);
      if (selectedGroup) {
        // Mettre à jour à la fois le groupCode et le niveau
        const newData = {
          ...formData,
          groupCode: value,
          referenceLevel: selectedGroup.level,
          courseStartDate: new Date(selectedGroup.startDate).toISOString().split('T')[0]
        };
        console.log('Updated form data after group selection:', newData);
        setFormData(newData);
      }
    } else {
      const newFormData = {
        ...formData,
        [name]: value
      };
      
      // Valider les dates si l'une des dates change
      if (name === 'courseStartDate' || name === 'courseEndDate') {
        const dateError = validateDates(
          name === 'courseStartDate' ? value : formData.courseStartDate,
          name === 'courseEndDate' ? value : formData.courseEndDate
        );
        const groupDateError = validateGroupStartDate(
          name === 'courseStartDate' ? value : formData.courseStartDate,
          formData.groupCode
        );
        setDateError(dateError || groupDateError);
      }
      
      console.log('Updated form data:', newFormData);
      setFormData(newFormData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    
    // Valider les dates avant la soumission
    const dateError = validateDates(formData.courseStartDate, formData.courseEndDate);
    const groupDateError = validateGroupStartDate(formData.courseStartDate, formData.groupCode);
    const error = dateError || groupDateError;
    
    if (error) {
      setDateError(error);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting certificate:', error);
      setError(error.message || 'Une erreur est survenue lors de la création du certificat');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {certificate ? 'Modifier le certificat' : 'Nouveau certificat'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Grid item xs={12}>
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            </Grid>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Place of Birth"
                name="placeOfBirth"
                value={formData.placeOfBirth}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Date de début"
                name="courseStartDate"
                type="date"
                value={formData.courseStartDate}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                error={!!dateError}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Date de fin"
                name="courseEndDate"
                type="date"
                value={formData.courseEndDate}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                error={!!dateError}
                helperText={dateError}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Lesson Units (45 min)"
                name="lessonUnits"
                type="number"
                value={formData.lessonUnits}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Reference Level</InputLabel>
                <Select
                  name="referenceLevel"
                  value={formData.referenceLevel}
                  onChange={handleChange}
                  label="Reference Level"
                >
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Groupe name</InputLabel>
                <Select
                  name="groupCode"
                  value={formData.groupCode}
                  onChange={handleChange}
                  label="Groupe"
                  sx={{
                    minHeight: '70px',
                    width: '100%',
                    '& .MuiSelect-select': {
                      fontSize: '1.2rem',
                      padding: '20px 24px',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap !important',
                      overflow: 'visible',
                      textOverflow: 'unset'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: '2px'
                    }
                  }}
                  renderValue={(selected) => {
                    if (!selected) {
                      return <em>Sélectionnez un groupe</em>;
                    }
                    return selected;
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 400,
                        width: 'auto',
                        minWidth: '500px',
                        '& .MuiMenuItem-root': {
                          fontSize: '1.2rem',
                          padding: '20px 24px',
                          minHeight: '60px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>Sélectionnez un groupe</em>
                  </MenuItem>
                  {groups.map(group => (
                    <MenuItem 
                      key={group.groupCode} 
                      value={group.groupCode}
                      sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {group.groupCode}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Course Information</InputLabel>
                <Select
                  value={formData.courseInfo}
                  label="Course Information"
                  name="courseInfo"
                  onChange={(e) => handleChange({ target: { name: 'courseInfo', value: e.target.value } })}
                  required
                  sx={{
                    minHeight: '70px',
                    width: '100%',
                    '& .MuiSelect-select': {
                      fontSize: '1.2rem',
                      padding: '20px 24px',
                      lineHeight: '1.5',
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: '200px'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: '2px'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        '& .MuiMenuItem-root': {
                          fontSize: '1.2rem',
                          padding: '20px 24px',
                          minHeight: '60px'
                        }
                      }
                    }
                  }}
                >
                  {courseInfoOptions.map((option) => (
                    <MenuItem 
                      key={option.value} 
                      value={option.value}
                      sx={{
                        fontSize: '1.2rem',
                        padding: '20px 24px',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word'
                      }}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comments"
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Lessons Attended"
                name="lessonsAttended"
                type="number"
                value={formData.lessonsAttended}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Evaluation</InputLabel>
                <Select
                  name="evaluation"
                  value={formData.evaluation}
                  onChange={handleChange}
                  label="Evaluation"
                >
                  <MenuItem value="Outstanding">Outstanding</MenuItem>
                  <MenuItem value="Good">Good</MenuItem>
                  <MenuItem value="Satisfactory">Satisfactory</MenuItem>
                  <MenuItem value="Participant">Participant</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={onClose} 
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={!!dateError || isSubmitting}
            sx={{ position: 'relative' }}
          >
            {isSubmitting ? (
              <>
                {certificate ? 'Modification en cours...' : 'Création en cours...'}
                <CircularProgress 
                  size={24} 
                  sx={{ 
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: '-12px',
                    marginLeft: '-12px'
                  }} 
                />
              </>
            ) : (
              certificate ? 'Modifier' : 'Créer'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CertificateForm; 