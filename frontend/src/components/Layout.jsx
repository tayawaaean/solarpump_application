import { Outlet } from 'react-router-dom';
import { AppBar, Toolbar } from '@mui/material';

export default function Layout() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {/* Any global nav here */}
        </Toolbar>
      </AppBar>
      <Outlet />
    </>
  );
}