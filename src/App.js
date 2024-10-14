import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Importing Material-UI components
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  TextField,
  CircularProgress,
  Snackbar,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Alert } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LogoutIcon from '@mui/icons-material/Logout';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StyleIcon from '@mui/icons-material/Style';

// Configuration Constants
const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI;
const API_URI = process.env.REACT_APP_API_URI;
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'code';
const SCOPES = [
  'playlist-modify-public',
  'playlist-modify-private',
  // Add more scopes if needed
].join(' ');

// Custom theme with palette and typography
const theme = createTheme({
  palette: {
    primary: {
      main: '#1DB954', // Spotify Green
    },
    secondary: {
      main: '#191414', // Spotify Black
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial',
  },
});

// Home Component
function Home() {
  const handleSpotifyAuth = () => {
    const authURL = `${AUTH_ENDPOINT}?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(
      SCOPES
    )}`;
    window.location.href = authURL;
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="home-container">
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar>
            <MusicNoteIcon fontSize="large" color="primary" />
            <Typography variant="h6" style={{ flexGrow: 1, marginLeft: '10px' }}>
              Playlist Creator
            </Typography>
            <Button color="primary" variant="outlined" onClick={handleSpotifyAuth}>
              Login with Spotify
            </Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" className="home-content">
          <Typography variant="h2" gutterBottom style={{ fontWeight: 'bold' }}>
            Craft Your Perfect Playlist
          </Typography>
          <Typography variant="h6" gutterBottom>
            Generate personalized playlists based on your preferred duration and music style.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSpotifyAuth}
            startIcon={<PlaylistAddIcon />}
            style={{ marginTop: '30px' }}
          >
            Get Started
          </Button>
        </Container>
      </div>
    </ThemeProvider>
  );
}

// Callback Component
function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const code = query.get('code');

    if (code) {
      axios
        .post(`${API_URI}/register`, { code, redirect_uri: REDIRECT_URI })
        .then((response) => {
          localStorage.setItem('spotify_token', response.data.access_token);
          navigate('/form');
        })
        .catch((error) => {
          console.error('Spotify authentication failed', error);
          navigate('/');
        });
    }
  }, [navigate]);

  return (
    <ThemeProvider theme={theme}>
      <div className="loading-container">
        <CircularProgress color="primary" size={60} />
        <Typography variant="h6" style={{ marginTop: '20px' }}>
          Authenticating with Spotify...
        </Typography>
      </div>
    </ThemeProvider>
  );
}

// Form Component
function Form() {
  const [minutes, setMinutes] = useState('');
  const [style, setStyle] = useState('');
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Your playlist is being created...');
  const [error, setError] = useState(null);
  const token = localStorage.getItem('spotify_token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);

  useEffect(() => {
    if (loading) {
      const messages = [
        'Your playlist is being created...',
        'Hang tight, we are picking the best tracks...',
        'Almost there, your tunes are coming...',
      ];
      let index = 0;
      const interval = setInterval(() => {
        setLoadingMessage(messages[index % messages.length]);
        index++;
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleSubmit = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_URI}/playlists/generate`,
        { minutes, style, redirect_uri: REDIRECT_URI },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlaylist(response.data);
    } catch (error) {
      console.error('Submission failed', error);
      setError('An error occurred while creating your playlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('spotify_token');
    navigate('/');
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <div className="loading-container">
          <CircularProgress color="primary" size={80} />
          <Typography variant="h6" style={{ marginTop: '20px' }}>
            {loadingMessage}
          </Typography>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <MusicNoteIcon fontSize="large" />
          <Typography variant="h6" style={{ flexGrow: 1, marginLeft: '10px' }}>
            Playlist Creator
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" className="form-container">
        <Typography variant="h4" gutterBottom style={{ marginTop: '30px', fontWeight: 'bold' }}>
          Customize Your Playlist
        </Typography>
        <Typography variant="body1" gutterBottom>
          Specify the duration and style to generate a playlist tailored just for you.
        </Typography>
        <TextField
          label="Duration (Minutes)"
          type="number"
          fullWidth
          margin="normal"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccessTimeIcon />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Music Style"
          fullWidth
          margin="normal"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          placeholder="e.g., Rock, Hip-hop, Chill"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <StyleIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSubmit}
          style={{ marginTop: '20px' }}
          fullWidth
          disabled={!minutes || !style}
        >
          Generate Playlist
        </Button>
      </Container>
      {/* Snackbar for Error Messages */}
      <Snackbar open={Boolean(error)} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
      {/* Success Dialog */}
      {playlist && (
        <div className="success-container">
          <Container maxWidth="sm" className="success-content">
            <Typography variant="h4" gutterBottom style={{ fontWeight: 'bold' }}>
              Your Playlist is Ready!
            </Typography>
            <Typography variant="body1" gutterBottom>
              Enjoy your personalized playlist.
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Playlist Name: <strong>{playlist.name}</strong>
            </Typography>
            <Button
              variant="contained"
              color="primary"
              href={playlist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<MusicNoteIcon />}
              style={{ marginRight: '10px', marginTop: '20px' }}
            >
              Listen on Spotify
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setPlaylist(null)}
              style={{ marginTop: '20px' }}
            >
              Create Another Playlist
            </Button>
          </Container>
        </div>
      )}
    </ThemeProvider>
  );
}

// Main App Component
function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/form" element={<Form />} />
          {/* Redirect to home if route is not found */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
