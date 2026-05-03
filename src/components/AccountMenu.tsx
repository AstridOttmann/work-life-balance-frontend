import { useState } from 'react';
import { IconButton, Menu, MenuItem, Typography } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../context/AuthContext';

export default function AccountMenu() {
  const { token, email, logout } = useAuth();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  if (!token) return null;

  return (
    <>
      <IconButton color="inherit" onClick={e => setAnchor(e.currentTarget)}>
        <AccountCircleIcon />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        <MenuItem disabled>
          <Typography variant="body2" color="text.secondary">
            {email}
          </Typography>
        </MenuItem>
        <MenuItem onClick={() => { setAnchor(null); logout(); }}>
          Log out
        </MenuItem>
      </Menu>
    </>
  );
}
