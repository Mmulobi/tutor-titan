import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import tutorImg from '../images/tutor.jpg';
import studentImg from '../images/student.jpg';

const Welcome = ({ setToken, setUser, theme, setTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [authError, setAuthError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password || !role) {
      setAuthError('Fill in email, password, and role, bro!');
      return;
    }
    try {
      const res = await fetch(`${config.API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }
      
      const data = await res.json();
      if (data.token && data.dashboard) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate(`/${data.dashboard}`);
        setAuthError('');
      } else {
        setAuthError(data.error || 'Login failed, bro!');
      }
    } catch (err) {
      setAuthError(err.message || 'Login crashed, bro! Try again!');
      console.error('Login error:', err);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !role) {
      setAuthError('Fill in email, password, and role, bro!');
      return;
    }
    try {
      const res = await fetch(`${config.API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Signup failed');
      }
      
      const data = await res.json();
      if (data.token && data.dashboard) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate(`/${data.dashboard}`);
        setAuthError('');
      } else {
        setAuthError(data.error || 'Signup failed, bro!');
      }
    } catch (err) {
      setAuthError(err.message || 'Signup crashed, bro! Try again!');
      console.error('Signup error:', err);
    }
  };

  return (
    <div className="landing-container animate-fade-in">
      <div className="landing-header">
        <h1>Tutor Titan</h1>
        <p>Welcome to the ultimate learning and teaching hub, bro!</p>
      </div>
      <div className="mission-section">
        <h2>Our Mission</h2>
        <p>
          At Tutor Titan, we're all about connecting badass tutors with eager students. 
          Whether you're here to level up your skills or share your knowledge, 
          we've got the tools—real-time chat, file sharing, and seamless bookings—to make it happen.
        </p>
        <div className="features">
          <div className="feature-card">
            <img src={tutorImg} alt="Tutors" />
            <h3>Expert Tutors</h3>
            <p>Find top-notch pros to guide you.</p>
          </div>
          <div className="feature-card">
            <img src={studentImg} alt="Students" />
            <h3>Student Power</h3>
            <p>Access notes, chat, and book sessions.</p>
          </div>
        </div>
      </div>
      <div className="auth-section">
        <h2>Join the Titan Crew</h2>
        <div className="auth-form">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">I am a...</option>
            <option value="student">Student</option>
            <option value="tutor">Tutor</option>
          </select>
          {authError && <p className="error-msg">{authError}</p>}
          <div className="auth-buttons">
            <button className="btn auth-btn" onClick={handleLogin}>Login</button>
            <button className="btn signup-btn" onClick={handleSignup}>Sign Up</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;