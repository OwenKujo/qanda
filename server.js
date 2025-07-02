const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Store questions in memory (for demo)
let questions = [];
// Store song requests in memory
let songRequests = [];

io.on('connection', (socket) => {
  // Send existing questions to new client
  socket.emit('questions', questions);

  // Listen for new questions
  socket.on('new_question', (question) => {
    const q = { text: question, timestamp: Date.now() };
    questions.push(q);
    io.emit('new_question', q); // Broadcast to all clients
  });

  // Song request logic
  socket.emit('song_requests', songRequests);
  socket.on('new_song_request', (song) => {
    const s = { text: song, timestamp: Date.now() };
    songRequests.push(s);
    io.emit('new_song_request', s);
  });
});

// Serve React app (for production)
app.use(express.static(path.join(__dirname, 'client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 