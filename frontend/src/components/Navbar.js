import React from 'react';

const Navbar = ({ setView, handleLogout, user }) => {
  return (
    <nav className="navbar">
      <h2>Tutor Titan</h2>
      <div>
        <button className="nav-btn" onClick={() => setView('home')}>Home</button>
        <button className="nav-btn" onClick={() => setView('student')}>Student</button>
        {user && user.role === 'tutor' && <button className="nav-btn" onClick={() => setView('tutor')}>Tutor</button>}
        <button className="nav-btn" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;