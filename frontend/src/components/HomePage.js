import React from 'react';

const HomePage = ({ user, setView }) => {
  return (
    <section className="hero animate-slide-in">
      <div className="hero-text">
        <h1>Welcome, {user ? user.email : 'Bro'}!</h1>
        <p>{user && user.role === 'student' ? 'Find a tutor and crush it!' : 'Teach like a boss!'}</p>
        <button className="btn animate-btn" onClick={() => setView('student')}>Find a Tutor</button>
        {user && user.role === 'tutor' && <button className="btn animate-btn" onClick={() => setView('tutor')}>Tutor Dashboard</button>}
      </div>
    </section>
  );
};

export default HomePage;