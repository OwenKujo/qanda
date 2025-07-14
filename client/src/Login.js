import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        // Optionally, check token validity here (already checked by backend)
        navigate('/voting');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="auth-container login-card">
      <h2 style={{ color: '#1976d2' }}>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="รหัสนศ (6*0710xxx)" value={studentId} onChange={e => setStudentId(e.target.value)} required pattern="6[0-9]0710[0-9]{3}" />
        <input type="password" placeholder="รหัสผ่าน" value={password} onChange={e => setPassword(e.target.value)} required />
        <button className="modern-btn blue-btn" type="submit">Login</button>
      </form>
      {error && <div className="error">{error}</div>}
      <div style={{ marginTop: 18, textAlign: 'center' }}>
        <span>Don't have an account?</span>
        <button className="modern-btn green-btn" style={{ marginTop: 8, width: 'auto', padding: '8px 18px', fontSize: '1rem' }} onClick={() => navigate('/register')}>
          Register here
        </button>
      </div>
    </div>
  );
}

export default Login; 