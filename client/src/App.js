import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import Voting from './Voting';
import Admin from './Admin';
import QandA from './QandA';
import SongRequest from './SongRequest';
import './App.css';

function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
  };

  function RequireAuth({ children }) {
    let location = useLocation();
    if (!loggedIn) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
  }
  function RequireAdmin({ children }) {
    let location = useLocation();
    if (!loggedIn) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    // No isAdmin check, allow all logged-in users
    return children;
  }

  return (
    <Router>
      <nav>
        <Link to="/">Q&A</Link>
        <Link to="/song">Song Request</Link>
        {!loggedIn && <Link to="/login">Login</Link>}
        {!loggedIn && <Link to="/register">Register</Link>}
        {loggedIn && <Link to="/voting">โหวตธีมมมม</Link>}
        {loggedIn && <button onClick={handleLogout} className="modern-btn blue-btn" style={{ marginLeft: 10, width: 'auto', padding: '6px 18px', fontSize: '1rem' }}>Logout</button>}
      </nav>
      <Routes>
        <Route path="/" element={<QandA />} />
        <Route path="/song" element={<SongRequest />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/voting" element={<RequireAuth><Voting /></RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
      </Routes>
    </Router>
  );
}

export default App;
