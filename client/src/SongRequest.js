import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io();

function SongRequest() {
  const [song, setSong] = useState('');
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    socket.on('song_requests', (ss) => setSongs(ss));
    socket.on('new_song_request', (s) => setSongs((prev) => [...prev, s]));
    return () => {
      socket.off('song_requests');
      socket.off('new_song_request');
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (song.trim()) {
      socket.emit('new_song_request', song.trim());
      setSong('');
    }
  };

  return (
    <div className="App">
      <h1>Request a Song</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={song}
          onChange={e => setSong(e.target.value)}
          placeholder="Type your song request (e.g., 'Let It Be by The Beatles')..."
        />
        <button type="submit">Send</button>
      </form>
      <h2>Song Requests</h2>
      <ul>
        {songs.map((s, i) => (
          <li key={i}>
            <span>{s.text}</span>
            <span>{new Date(s.timestamp).toLocaleTimeString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SongRequest; 