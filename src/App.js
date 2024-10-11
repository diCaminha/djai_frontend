import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import './styles.css';

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = "https://djai-frontend.onrender.com/callback";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "code";
const API_URI = "https://djai-run.onrender.com"

function Home() {
  const navigate = useNavigate();

  const handleSpotifyAuth = () => {
    window.location.href = `${AUTH_ENDPOINT}?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=playlist-modify-public playlist-modify-private`;
  };

  return (
    <div className="home-container">
      <div className="home-box">
        <h1 className="home-title">Create Your Perfect Playlist</h1>
        <p className="home-description">This app helps you create the perfect music playlist based on your preferences. Simply set the duration and style of playlist, and let us handle the rest!</p>
        <button className="button-primary" onClick={handleSpotifyAuth}>Create Playlist</button>
      </div>
    </div>
  );
}

function Callback() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const code = query.get("code");
    if (code) {
      axios
        .post(API_URI+"/register", { code, redirect_uri: REDIRECT_URI })
        .then((response) => {
          setToken(response.data.access_token);
          localStorage.setItem("spotify_token", response.data.access_token);
          navigate("/form");
        })
        .catch((error) => {
          console.error("Spotify authentication failed", error);
        });
    }
  }, [navigate]);

  return <div>Authenticating...</div>;
}

function Form() {
  const [minutes, setMinutes] = useState('');
  const [style, setStyle] = useState('');
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Your playlist is being created...");
  const [error, setError] = useState(null);
  const token = localStorage.getItem('spotify_token');
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      const messages = [
        "Your playlist is being created...",
        "Wait just a little bit more...",
        "Almost there, hang tight...",
      ];
      let index = 0;
      const interval = setInterval(() => {
        setLoadingMessage(messages[index % messages.length]);
        index++;
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleSubmit = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        API_URI+'/playlists/generate',
        { minutes, style, redirect_uri: REDIRECT_URI },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlaylist(response.data);
    } catch (error) {
      if (error.response && error.response.status === 500) {
        setError('internal');
      } else {
        console.error('Submission failed', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('spotify_token');
    navigate("/");
  };

  if (loading) {
    return (
      <div className="app-container loading-container centered-content">
        <div className="loading-box">
          <p className="loading-message">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (error === 'internal') {
    return (
      <div className="app-container error-container centered-content">
        <div className="error-box">
          <h2 className="error-title">Oops! Something went wrong</h2>
          <p className="error-description">We encountered an internal problem while creating your playlist. Please try again in a few moments.</p>
          <img src="/error_image.png" alt="Error" className="error-image" />
          <button className="button-primary" onClick={() => navigate("/form")}>Try Again</button>
        </div>
      </div>
    );
  }

  if (playlist) {
    return (
      <div className="app-container success-container centered-content">
        <div className="success-box">
          <h2 className="success-title">Playlist Created Successfully!</h2>
          <p className="success-description">Djai created a playlist just for you!</p>
          <p className="playlist-name">Playlist Name: {playlist.name}</p>
          <a className="button-primary" href={playlist.external_urls.spotify} target="_blank" rel="noopener noreferrer">Listen on Spotify</a>
          <button className="button-secondary" onClick={() => navigate("/form")}>Create Another Playlist</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar handleLogout={handleLogout} />
      <div className="form-container">
        <div className="form-box">
          <h2 className="form-title">Create Your Music Playlist</h2>
          <p className="form-description">Tell us how long you want your playlist to be and your favorite style of music. We'll craft the perfect playlist for you!</p>
          <input
            className="input-field"
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="Minutes"
          />
          <input
            className="input-field"
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="What type of music you like? (e.g., To sleep, To run, Rock, Hiphop)"
          />
          <button className="button-primary" onClick={handleSubmit}>Generate Playlist</button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ handleLogout }) {
  const navigate = useNavigate();
  return (
    <div className="sidebar">
      <button className="sidebar-button" onClick={() => navigate("/form")}>Create a Playlist</button>
      <button className="sidebar-button" onClick={handleLogout}>Logout</button>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/form" element={<Form />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;