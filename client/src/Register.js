import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [studentId, setStudentId] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, nickname, password })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        // Auto-login after registration
        const loginRes = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, password })
        });
        const loginData = await loginRes.json();
        if (loginData.token) {
          localStorage.setItem('token', loginData.token);
          navigate('/voting');
        } else {
          setError('Registration succeeded but auto-login failed. Please login manually.');
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="auth-container register-card">
      <h2 style={{ color: '#43a047' }}>Register</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="รหัสนศ (6*0710xxx)" value={studentId} onChange={e => setStudentId(e.target.value)} required pattern="6[0-9]0710[0-9]{3}" />
        <input type="text" placeholder="ชื่อเล่น" value={nickname} onChange={e => setNickname(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button className="modern-btn green-btn" type="submit">Register</button>
      </form>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">Registration successful! Redirecting...</div>}
    </div>
  );
}

export default Register;
