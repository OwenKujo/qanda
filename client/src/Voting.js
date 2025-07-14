import React, { useState } from 'react';

const CHOICES = [
  'แฟรี่เทล'
,'กรีกโรมัน',
'อควาเรียม',
'Jurassic ',
'Smurfs','ชาวเอสกิโม(หิมะ เมืองหนาว)',
,'How to train dragon'
,'เมืองบนก้อนเมฆ'];

function Voting() {
  const [choice, setChoice] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleVote = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to vote.');
      return;
    }
    try {
      const res = await fetch('/voting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ choice })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Vote submitted!');
      } else {
        setError(data.error || 'Vote failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="voting-container">
      <h2>Vote for a Choice</h2>
      <form onSubmit={handleVote}>
        <select value={choice} onChange={e => setChoice(e.target.value)} required>
          <option value="">Select a choice</option>
          {CHOICES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit">Vote</button>
      </form>
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default Voting; 