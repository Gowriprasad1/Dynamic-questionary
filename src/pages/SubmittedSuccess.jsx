import React from 'react';
import { Container, Paper, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const SubmittedSuccess = () => {
  const navigate = useNavigate();
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>Submitted Successfully</Typography>
        <Typography variant="body1" color="text.secondary" paragraph>Your responses have been submitted.</Typography>
      </Paper>
    </Container>
  );
};

export default SubmittedSuccess;
