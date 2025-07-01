import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Button } from '@mui/material';

export default function Layout() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Button color="inherit" component={Link} to="/">Login</Button>
        <Button color="inherit" component={Link} to="/register">Register</Button>
      </Toolbar>
    </AppBar>
  );
}