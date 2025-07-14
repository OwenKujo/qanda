import React, { useState } from 'react';

function Admin() {
  const [history, setHistory] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchHistory = async () => {
    setError('');
    try {
      const res = await fetch('/vote-history');
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
      } else {
        setError(data.error || 'Failed to fetch history');
      }
    } catch {
      setError('Network error');
    }
  };

  const fetchRanking = async () => {
    setError('');
    try {
      const res = await fetch('/vote-ranking');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRanking(data);
      } else {
        setError(data.error || 'Failed to fetch ranking');
      }
    } catch {
      setError('Network error');
    }
  };

  const resetVotes = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/reset-votes', {
        method: 'POST'
      });
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
  };

  return (
    <div className="admin-container">
      <h2>Admin Panel</h2>
      <button onClick={fetchRanking}>Show Vote Ranking</button>
      {ranking.length > 0 && (
        <div style={{ margin: '18px 0' }}>
          <h3>Vote Ranking</h3>
          <ol>
            {ranking.map((r, i) => (
              <li key={r.choice}>
                <strong>{r.choice}</strong>: {r.count} vote{r.count !== 1 ? 's' : ''}
              </li>
            ))}
          </ol>
        </div>
      )}
      <button onClick={fetchHistory}>View Vote History</button>
      <button onClick={resetVotes}>Reset Votes</button>
      {success && <div className="success">{success}</div>}
      {error && <div className="error">{error}</div>}
      <ul>
        {history.map((h, i) => (
          <li key={i}>{h.studentId} ({h.nickname}) voted for {h.choice} at {new Date(h.timestamp).toLocaleString()}</li>
        ))}
      </ul>
    </div>
  );
}

export default Admin; 