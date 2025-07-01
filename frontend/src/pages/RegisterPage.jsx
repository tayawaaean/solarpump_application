import { useState } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Box
} from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await API.post('/auth/register', { username, password });
      setMessage('Registration successful. You can now log in.');
      setTimeout(() => navigate('/'), 1200); // Redirect after short delay
    } catch (err) {
      setMessage(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleGoToLogin = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? '#f5f6fa'
            : theme.palette.background.default,
      }}
    >
      <Container maxWidth="xs">
        <Card elevation={4}>
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 4,
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56 }}>
              <PersonAddAlt1Icon fontSize="large" />
            </Avatar>
            <Typography variant="h5" sx={{ mt: 2, mb: 3 }}>
              Register
            </Typography>
            {message && (
              <Typography
                color={message.includes('successful') ? 'primary' : 'error'}
                sx={{ mb: 2 }}
              >
                {message}
              </Typography>
            )}
            <TextField
              fullWidth
              label="Username"
              margin="normal"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
            <TextField
              fullWidth
              type="password"
              label="Password"
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Button
              variant="contained"
              onClick={handleRegister}
              fullWidth
              sx={{ mt: 2, py: 1.3, fontWeight: 600, fontSize: 16 }}
            >
              Register
            </Button>
            <Button
              variant="text"
              color="primary"
              onClick={handleGoToLogin}
              fullWidth
              sx={{ mt: 2 }}
            >
              Already have an account? Login
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}