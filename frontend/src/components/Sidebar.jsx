import {
    Box,
    Toolbar,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Switch,
    Tooltip as MuiTooltip,
  } from '@mui/material';
  import DashboardIcon from '@mui/icons-material/Dashboard';
  import BarChartIcon from '@mui/icons-material/BarChart';
  import LogoutIcon from '@mui/icons-material/Logout';
  import Brightness4Icon from '@mui/icons-material/Brightness4';
  import { useNavigate, useLocation } from 'react-router-dom';
  
  export default function Sidebar({ darkMode, setDarkMode }) {
    const navigate = useNavigate();
    const location = useLocation();
  
    return (
      <div>
        <Toolbar>
          <span style={{ fontWeight: 700, letterSpacing: 1 }}>
            <img src="/logo192.png" alt="Logo" height={28} style={{ verticalAlign: "middle", marginRight: 8 }} />
            My Dashboard
          </span>
        </Toolbar>
        <Divider />
        <List>
          <ListItem
            button
            selected={location.pathname === '/dashboard'}
            aria-current={location.pathname === '/dashboard' ? 'page' : undefined}
            onClick={() => navigate('/dashboard')}
          >
            <ListItemIcon>
              <DashboardIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Overview" />
          </ListItem>
          <ListItem
            button
            selected={location.pathname === '/reports'}
            aria-current={location.pathname === '/reports' ? 'page' : undefined}
            onClick={() => navigate('/reports')}
          >
            <ListItemIcon>
              <BarChartIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Reports" />
          </ListItem>
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Divider sx={{ my: 2 }} />
        <List>
          <ListItem>
            <MuiTooltip title="Dark Mode (coming soon!)">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Brightness4Icon sx={{ color: '#888', mr: 1 }} />
                <Switch
                  checked={darkMode}
                  onChange={() => setDarkMode(x => !x)}
                  inputProps={{ 'aria-label': 'dark mode toggle' }}
                  color="default"
                />
              </Box>
            </MuiTooltip>
          </ListItem>
          <ListItem
            button
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/');
            }}
          >
            <ListItemIcon>
              <LogoutIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Logout" sx={{ color: '#f44336' }} />
          </ListItem>
        </List>
      </div>
    );
  }