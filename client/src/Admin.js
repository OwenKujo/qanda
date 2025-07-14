import React, { useState } from 'react';

function Admin() {
  const [history, setHistory] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/vote-history');
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
        fetchRanking();
      } else {
        setError(data.error || 'Failed to fetch history');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  const fetchRanking = async () => {
    try {
      const res = await fetch('/vote-ranking');
      const data = await res.json();
      setRanking(data);
    } catch {
      setRanking([]);
    }
  };

  const resetVotes = async () => {
    if (!window.confirm('Are you sure you want to reset all votes?')) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/reset-votes', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSuccess('Votes reset!');
        setHistory([]);
        setRanking([]);
      } else {
        setError(data.error || 'Failed to reset');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="admin-container">
      <h2>Admin Panel</h2>
      <button onClick={fetchHistory} disabled={loading}>View Vote History</button>
      <button onClick={resetVotes} disabled={loading}>Reset Votes</button>
      {success && <div className="success">{success}</div>}
      {error && <div className="error">{error}</div>}

      <h3>Vote Ranking</h3>
      <table style={{ width: '100%', marginBottom: 20 }}>
        <thead>
          <tr>
            <th>อันดับ</th>
            <th>ตัวเลือก</th>
            <th>คะแนน</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.choice}>
              <td>{i + 1}</td>
              <td>{r.choice}</td>
              <td>{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Vote History</h3>
      <ul>
        {history.map((h, i) => (
          <li key={i}>
            {h.studentId} ({h.nickname}) voted for {h.choice} at {new Date(h.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Admin; 