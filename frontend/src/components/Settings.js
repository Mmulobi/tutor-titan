import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Settings = ({ token, user, setTutorProfile, handleLogout, theme, setTheme }) => {
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({ name: '', age: '', gender: '', education_level: '', subjects: [], bio: '', availability: [], rate: '' });
  const [subjectsAvailable] = useState(['Math', 'Science', 'English', 'History', 'Code', 'Physics', 'Chemistry', 'Biology']);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [availability, setAvailability] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const endpoint = user.role === 'student' ? '/api/student/profile' : '/api/tutor/profile';
        const res = await fetch(`http://localhost:5000${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const updatedProfile = data || (user.role === 'student' ? 
          { name: '', age: '', gender: '', education_level: '', subjects: [] } : 
          { name: '', bio: '', subjects: [], availability: [], rate: '' });
        setProfile(updatedProfile);
        setSelectedSubjects(updatedProfile.subjects || []);
        setAvailability(updatedProfile.availability ? updatedProfile.availability.join(', ') : '');
        if (user.role === 'tutor') setTutorProfile(updatedProfile);
      } catch (err) {
        console.error('Profile fetch failed:', err);
      }
    };
    fetchProfile();
  }, [token, user, setTutorProfile]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: name === 'age' || name === 'rate' ? parseInt(value) || '' : value });
  };

  const handleSubjectChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) selected.push(options[i].value);
    }
    setSelectedSubjects(selected);
    setProfile({ ...profile, subjects: selected });
  };

  const handleAvailabilityChange = (e) => {
    setAvailability(e.target.value);
    setProfile({ ...profile, availability: e.target.value ? e.target.value.split(', ') : [] });
  };

  const saveProfile = async () => {
    try {
      const endpoint = user.role === 'student' ? '/api/student/profile' : '/api/tutor/profile';
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      setProfile(data);
      setSelectedSubjects(data.subjects || []);
      setAvailability(data.availability ? data.availability.join(', ') : '');
      if (user.role === 'tutor') setTutorProfile(data);
      setEditMode(false);
    } catch (err) {
      console.error('Profile save failed:', err);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleBack = () => {
    navigate(user.role === 'student' ? '/student' : '/tutor');
  };

  return (
    <section className="settings-container animate-fade-in">
      <nav className="navbar">
        <h2>Tutor Titan</h2>
        <div>
          <button className="nav-btn" onClick={handleBack}>Back</button>
        </div>
      </nav>
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Tweak your Titan experience, bro!</p>
      </div>
      <div className="settings-content">
        <div className="settings-card">
          <h2>Appearance</h2>
          <button className="btn theme-btn" onClick={toggleTheme}>
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>
        <div className="settings-card">
          <h2>Profile</h2>
          {editMode ? (
            <div className="edit-form">
              <input name="name" value={profile.name || ''} onChange={handleProfileChange} placeholder="Name" />
              {user.role === 'student' && (
                <>
                  <input name="age" type="number" value={profile.age || ''} onChange={handleProfileChange} placeholder="Age" />
                  <select name="gender" value={profile.gender || ''} onChange={handleProfileChange}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <select name="education_level" value={profile.education_level || ''} onChange={handleProfileChange}>
                    <option value="">Select Education Level</option>
                    <option value="High School">High School</option>
                    <option value="College">College</option>
                    <option value="University">University</option>
                    <option value="Other">Other</option>
                  </select>
                </>
              )}
              {user.role === 'tutor' && (
                <textarea name="bio" value={profile.bio || ''} onChange={handleProfileChange} placeholder="Bio" />
              )}
              <select multiple value={selectedSubjects} onChange={handleSubjectChange}>
                {subjectsAvailable.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              {user.role === 'tutor' && (
                <>
                  <input
                    name="availability"
                    value={availability}
                    onChange={handleAvailabilityChange}
                    placeholder="Availability (e.g., Mon 10-12)"
                  />
                  <input name="rate" type="number" value={profile.rate || ''} onChange={handleProfileChange} placeholder="Rate ($/hr)" />
                </>
              )}
              <div className="form-buttons">
                <button className="btn save-btn" onClick={saveProfile}>Save</button>
                <button className="btn cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p><strong>Name:</strong> {profile.name || 'Not set'}</p>
              {user.role === 'student' && (
                <>
                  <p><strong>Age:</strong> {profile.age || 'Not set'}</p>
                  <p><strong>Gender:</strong> {profile.gender || 'Not set'}</p>
                  <p><strong>Education:</strong> {profile.education_level || 'Not set'}</p>
                </>
              )}
              {user.role === 'tutor' && (
                <p><strong>Bio:</strong> {profile.bio || 'Not set'}</p>
              )}
              <p><strong>Subjects:</strong> {profile.subjects && profile.subjects.length ? profile.subjects.join(', ') : 'Not set'}</p>
              {user.role === 'tutor' && (
                <>
                  <p><strong>Availability:</strong> {profile.availability && profile.availability.length ? profile.availability.join(', ') : 'Not set'}</p>
                  <p><strong>Rate:</strong> ${profile.rate || 'Not set'}</p>
                </>
              )}
              <button className="btn edit-btn" onClick={() => setEditMode(true)}>Edit Profile</button>
            </>
          )}
        </div>
        <div className="settings-card">
          <h2>Account</h2>
          <button className="btn logout-btn" onClick={() => { handleLogout(); navigate('/welcome'); }}>Logout</button>
        </div>
      </div>
    </section>
  );
};

export default Settings;