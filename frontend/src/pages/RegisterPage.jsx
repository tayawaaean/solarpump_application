import { useState } from 'react';
import { TextField, Button, Container, Typography } from '@mui/material';
import API from '../api';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    try {
      await API.post('/auth/register', { username, password });
      setMessage('Registration successful. You can now log in.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" sx={{ my: 2 }}>Register</Typography>
      {message && <Typography color={message.includes('successful') ? 'primary' : 'error'}>{message}</Typography>}
      <TextField fullWidth label="Username" margin="normal" value={username} onChange={e => setUsername(e.target.value)} />
      <TextField fullWidth type="password" label="Password" margin="normal" value={password} onChange={e => setPassword(e.target.value)} />
      <Button variant="contained" onClick={handleRegister} fullWidth sx={{ mt: 2 }}>Register</Button>
    </Container>
  );
}

