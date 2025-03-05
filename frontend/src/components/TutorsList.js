import React from 'react';
import { Link } from 'react-router-dom';

const TutorsList = ({ tutors, token, theme }) => {
  return (
    <section className="tutors-list-container animate-fade-in">
      <nav className="navbar">
        <h2>Tutor Titan</h2>
        <div>
          <Link to="/student" className="nav-btn">Back to Dashboard</Link>
        </div>
      </nav>
      <div className="tutors-list-header">
        <h1>Available Tutors</h1>
        <p>Connect with the best, bro!</p>
      </div>
      <div className="tutor-list">
        {tutors.length ? tutors.map((tutor) => (
          <div key={tutor.id} className="tutor-card animate-bounce-in">
            <h3>{tutor.name}</h3>
            <p>{tutor.subjects.join(', ')}</p>
            <p>${tutor.rate}/hr</p>
            <div className="tutor-actions">
              <Link to={`/chat/${tutor.user_id}`} className="btn chat-btn">Chat</Link>
              <Link to={`/video/${tutor.user_id}`} className="btn video-btn">Start Video Call</Link>
            </div>
          </div>
        )) : (
          <p>No tutors available yet, bro!</p>
        )}
      </div>
    </section>
  );
};

export default TutorsList;