import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import config from './config';
import Welcome from './components/Welcome';
import StudentDashboard from './components/StudentDashboard';
import TutorDashboard from './components/TutorDashboard';
import Settings from './components/Settings';
import TutorsList from './components/TutorsList';
import ChatPage from './components/ChatPage';
import VideoCallPage from './components/VideoCallPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [tutorProfile, setTutorProfile] = useState({ name: '', bio: '', subjects: [], availability: [], rate: '' });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
    if (token && user) {
      fetch(`${config.API_URL}/api/tutors`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => setTutors(data))
        .catch((err) => console.error('Tutors fetch failed:', err));

      fetch(`${config.API_URL}/api/bookings`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => setBookings(data))
        .catch((err) => console.error('Bookings fetch failed:', err));

      if (user.role === 'tutor') {
        fetch(`${config.API_URL}/api/tutor/profile`, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.json())
          .then((data) => setTutorProfile(data))
          .catch((err) => console.error('Profile fetch failed:', err));
      }
    }
  }, [token, user, theme]);

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route exact path="/welcome" element={<Welcome setToken={setToken} setUser={setUser} theme={theme} setTheme={setTheme} />} />
          <Route
            path="/student"
            element={
              token && user && user.role === 'student' ? (
                <StudentDashboard
                  tutors={tutors}
                  selectedTutor={selectedTutor}
                  setSelectedTutor={setSelectedTutor}
                  bookings={bookings}
                  setBookings={setBookings}
                  token={token}
                  theme={theme}
                />
              ) : (
                <Navigate to="/welcome" />
              )
            }
          />
          <Route
            path="/tutor"
            element={
              token && user && user.role === 'tutor' ? (
                <TutorDashboard
                  tutorProfile={tutorProfile}
                  setTutorProfile={setTutorProfile}
                  token={token}
                  theme={theme}
                />
              ) : (
                <Navigate to="/welcome" />
              )
            }
          />
          <Route
            path="/settings"
            element={
              token && user ? (
                <Settings
                  token={token}
                  user={user}
                  setTutorProfile={setTutorProfile}
                  handleLogout={handleLogout}
                  theme={theme}
                  setTheme={setTheme}
                />
              ) : (
                <Navigate to="/welcome" />
              )
            }
          />
          <Route
            path="/tutors"
            element={
              token && user && user.role === 'student' ? (
                <TutorsList tutors={tutors} token={token} theme={theme} />
              ) : (
                <Navigate to="/welcome" />
              )
            }
          />
          <Route
            path="/chat/:tutorId"
            element={
              token && user ? (
                <ChatPage token={token} user={user} tutors={tutors} theme={theme} />
              ) : (
                <Navigate to="/welcome" />
              )
            }
          />
          <Route
            path="/video/:tutorId"
            element={
              token && user ? (
                <VideoCallPage token={token} user={user} tutors={tutors} theme={theme} />
              ) : (
                <Navigate to="/welcome" />
              )
            }
          />
          <Route path="*" element={<Navigate to="/welcome" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;