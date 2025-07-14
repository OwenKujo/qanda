require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const SECRET = process.env.JWT_SECRET || 'supersecret';

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  studentId: { type: String, unique: true },
  nickname: String,
  password: String,
});
const User = mongoose.model('User', userSchema);

const voteSchema = new mongoose.Schema({
  studentId: String,
  choice: String,
  timestamp: Number,
});
const Vote = mongoose.model('Vote', voteSchema);

const voteHistorySchema = new mongoose.Schema({
  studentId: String,
  nickname: String,
  choice: String,
  timestamp: Number,
});
const VoteHistory = mongoose.model('VoteHistory', voteHistorySchema);

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

// Helper: authenticate middleware
function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(auth.split(' ')[1], SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Ensure admin user exists
async function ensureAdmin() {
  const hash = await bcrypt.hash('adminpass', 10);
  const admin = await User.findOne({ studentId: 'admin' });
  if (!admin) {
    await User.create({ studentId: 'admin', nickname: 'admin', password: hash });
  } else {
    // Always set admin password to 'adminpass' for easy login
    admin.password = hash;
    await admin.save();
  }
}
ensureAdmin();

// Register
app.post('/register', async (req, res) => {
  const { studentId, nickname, password } = req.body;
  if (studentId === 'admin') return res.status(400).json({ error: 'Cannot register as admin' });
  if (!/^6[0-9]0710\d{3}$/.test(studentId)) return res.status(400).json({ error: 'Invalid studentId' });
  if (!nickname || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await User.create({ studentId, nickname, password: hash });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Already registered' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { studentId, password } = req.body;
  if (studentId === 'admin') {
    // Allow any password for admin, or just 'adminpass'
    const user = await User.findOne({ studentId: 'admin' });
    if (!user) return res.status(400).json({ error: 'Admin user not found' });
    const token = jwt.sign({ studentId: user.studentId, nickname: user.nickname }, SECRET);
    return res.json({ token });
  }
  const user = await User.findOne({ studentId });
  if (!user) return res.status(400).json({ error: 'User not found' });
  if (!(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'Wrong password' });
  const token = jwt.sign({ studentId: user.studentId, nickname: user.nickname }, SECRET);
  res.json({ token });
});

// Voting
app.post('/voting', authenticate, async (req, res) => {
  const { choice } = req.body;
  if (!choice) return res.status(400).json({ error: 'No choice' });
  // Only one vote per choice per user
  const existing = await Vote.findOne({ studentId: req.user.studentId, choice });
  if (existing) return res.status(400).json({ error: 'Already voted for this choice' });
  await Vote.create({ studentId: req.user.studentId, choice, timestamp: Date.now() });
  await VoteHistory.create({ studentId: req.user.studentId, nickname: req.user.nickname, choice, timestamp: Date.now() });
  res.json({ success: true });
});

// Get vote history (no auth required)
app.get('/vote-history', async (req, res) => {
  const history = await VoteHistory.find({});
  res.json(history);
});

// Vote ranking (count per choice, sorted by count desc)
app.get('/vote-ranking', async (req, res) => {
  const history = await VoteHistory.find({});
  const counts = {};
  for (const h of history) {
    counts[h.choice] = (counts[h.choice] || 0) + 1;
  }
  const ranking = Object.entries(counts)
    .map(([choice, count]) => ({ choice, count }))
    .sort((a, b) => b.count - a.count);
  res.json(ranking);
});

// Reset votes (no auth required)
app.post('/reset-votes', async (req, res) =>{
  await Vote.deleteMany({});
  await VoteHistory.deleteMany({});
  res.json({ success: true });
});

// --- Socket.io and static serving remain unchanged ---

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