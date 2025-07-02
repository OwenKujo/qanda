import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import QandA from './QandA';
import SongRequest from './SongRequest';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<QandA />} />
        <Route path="/song" element={<SongRequest />} />
      </Routes>
    </Router>
  );
}

export default App;
