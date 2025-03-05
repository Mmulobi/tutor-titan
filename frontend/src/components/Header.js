import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Badge, Avatar, Box, Switch, Tooltip } from '@mui/material';
import { Settings as SettingsIcon, Notifications as NotificationsIcon, Brightness4, Brightness7, Logout } from '@mui/icons-material';

const Header = ({ title = 'Tutor Titan', user, notifications = [], theme, setTheme, handleLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogoutClick = () => {
    handleClose();
    if (handleLogout) {
      handleLogout();
      navigate('/welcome');
    }
  };

  const handleSettingsClick = () => {
    handleClose();
    navigate('/settings');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <AppBar position="static" color="transparent" elevation={0} 
      sx={{
        backdropFilter: 'blur(10px)',
        backgroundColor: theme === 'dark' ? 'rgba(26, 26, 26, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        borderBottom: theme === 'dark' ? '1px solid #333' : '1px solid #ddd'
      }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography 
          variant="h5" 
          component="div"
          sx={{
            fontWeight: 'bold',
            background: theme === 'dark' ? 'linear-gradient(135deg, #ff007a, #00ffcc)' : 'linear-gradient(135deg, #ff99cc, #00cc99)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: theme === 'dark' ? '0px 0px 8px rgba(255, 0, 122, 0.3)' : '0px 0px 8px rgba(0, 204, 153, 0.3)'
          }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {notifications && (
            <Tooltip title="Notifications">
              <IconButton color="inherit" sx={{ mr: 1 }}>
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon sx={{ color: theme === 'dark' ? '#fff' : '#333' }} />
                </Badge>
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
            <IconButton onClick={handleThemeToggle} color="inherit" sx={{ mr: 1 }}>
              {theme === 'dark' ? 
                <Brightness7 sx={{ color: '#fff' }} /> : 
                <Brightness4 sx={{ color: '#333' }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings & Account">
            <IconButton
              onClick={handleMenu}
              size="small"
              sx={{ ml: 1 }}
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  background: theme === 'dark' ? 'linear-gradient(135deg, #ff007a, #00ffcc)' : 'linear-gradient(135deg, #ff99cc, #00cc99)',
                  color: theme === 'dark' ? '#fff' : '#333',
                  fontWeight: 'bold'
                }}>
                {user ? getInitials(user.name) : <SettingsIcon />}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          id="account-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              backgroundColor: theme === 'dark' ? '#333' : '#fff',
              color: theme === 'dark' ? '#fff' : '#333',
              '& .MuiMenuItem-root': {
                '&:hover': {
                  backgroundColor: theme === 'dark' ? '#444' : '#f5f5f5',
                },
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: theme === 'dark' ? '#333' : '#fff',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleSettingsClick}>
            <SettingsIcon sx={{ mr: 1 }} />
            Settings
          </MenuItem>
          {handleLogout && (
            <MenuItem onClick={handleLogoutClick}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
