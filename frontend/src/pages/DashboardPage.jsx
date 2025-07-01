// src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get('/data', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      navigate('/'); // If token invalid or expired
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 3 }}>Dashboard</Typography>
      <Button variant="contained" color="secondary" onClick={handleLogout} sx={{ mt: 2 }}>
        Logout
      </Button>
      <pre style={{ marginTop: '20px' }}>{JSON.stringify(data, null, 2)}</pre>
    </Container>
  );
}
