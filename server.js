require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const SECRET = process.env.JWT_SECRET || 'supersecret';
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true
});

// Mongoose Models
const userSchema = new mongoose.Schema({
  studentId: { type: String, unique: true, required: true },
  nickname: { type: String, required: true },
  password: { type: String, required: true },
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
app.use(cors());
app.use(express.json());

// JWT Auth Middleware
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
    admin.password = hash;
    await admin.save();
  }
}
ensureAdmin();

// Register endpoint
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

// Login endpoint
app.post('/login', async (req, res) => {
  const { studentId, password } = req.body;
  if (studentId === 'admin') {
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

// Voting endpoint
app.post('/voting', authenticate, async (req, res) => {
  const { choice } = req.body;
  if (!choice) return res.status(400).json({ error: 'No choice' });
  try {
    const existing = await Vote.findOne({ studentId: req.user.studentId, choice });
    if (existing) return res.status(400).json({ error: 'Already voted for this choice' });
    await Vote.create({ studentId: req.user.studentId, choice, timestamp: Date.now() });
    await VoteHistory.create({ studentId: req.user.studentId, nickname: req.user.nickname, choice, timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Voting failed' });
  }
});

// Get vote history (no auth required)
app.get('/vote-history', async (req, res) => {
  try {
    const history = await VoteHistory.find({});
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vote history' });
  }
});

// Vote ranking (count per choice, sorted by count desc)
app.get('/vote-ranking', async (req, res) => {
  try {
    const history = await VoteHistory.find({});
    const counts = {};
    for (const h of history) {
      counts[h.choice] = (counts[h.choice] || 0) + 1;
    }
    const ranking = Object.entries(counts)
      .map(([choice, count]) => ({ choice, count }))
      .sort((a, b) => b.count - a.count);
    res.json(ranking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ranking' });
  }
});

// Reset votes (no auth required)
app.post('/reset-votes', async (req, res) => {
  try {
    await Vote.deleteMany({});
    await VoteHistory.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset votes' });
  }
});

// Serve React app (for production)
app.use(express.static(path.join(__dirname, 'client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 