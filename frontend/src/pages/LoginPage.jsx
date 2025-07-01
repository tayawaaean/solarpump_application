import { useState } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  IconButton,
  Box
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import API from '../api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await API.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      setError('');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleGoToRegister = () => {
    navigate('/register');
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
            <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
              <LockOutlinedIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" sx={{ mt: 2, mb: 3 }}>
              Login
            </Typography>
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
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
              label="Password"
              type={showPw ? 'text' : 'password'}
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPw(v => !v)}
                      edge="end"
                      aria-label="toggle password visibility"
                    >
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button
              variant="contained"
              onClick={handleLogin}
              fullWidth
              sx={{ mt: 2, py: 1.3, fontWeight: 600, fontSize: 16 }}
            >
              Login
            </Button>
            <Button
              variant="text"
              color="primary"
              onClick={handleGoToRegister}
              fullWidth
              sx={{ mt: 2 }}
            >
              Don't have an account? Register
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}