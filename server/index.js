const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('ws');
require('dotenv').config();
const pool = require('./db');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' })); // Increase limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const PORT = process.env.PORT || 5000;

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token, bro!' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Bad token, bro!' });
    req.user = user;
    next();
  });
};

// Register
app.post('/api/register', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Missing email, password, or role, bro!' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, hashedPassword, role]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
      dashboard: user.role === 'student' ? 'student' : 'tutor'
    });
  } catch (err) {
    res.status(400).json({ error: 'Registration failed: ' + err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password, bro!' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid creds, bro!' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
      dashboard: user.role === 'student' ? 'student' : 'tutor'
    });
  } catch (err) {
    res.status(400).json({ error: 'Login failed: ' + err.message });
  }
});

// Tutors
app.get('/api/tutors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tutor_profiles');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Tutors fetch failed: ' + err.message });
  }
});

app.get('/api/tutor/profile', authenticateToken, async (req, res) => {
  if (req.user.role !== 'tutor') return res.status(403).json({ error: 'Not a tutor, bro!' });
  try {
    const result = await pool.query('SELECT * FROM tutor_profiles WHERE user_id = $1', [req.user.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Profile fetch failed: ' + err.message });
  }
});

// Bookings
app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT b.*, tp.name AS tutor_name FROM bookings b JOIN tutor_profiles tp ON b.tutor_id = tp.user_id WHERE b.student_id = $1 OR b.tutor_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Bookings fetch failed: ' + err.message });
  }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Not a student, bro!' });
  const { tutor_id, time_slot } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO bookings (student_id, tutor_id, time_slot) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, tutor_id, time_slot]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Booking failed: ' + err.message });
  }
});

// Chat
app.get('/api/chat', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE sender_id = $1 OR receiver_id = $1 ORDER BY created_at',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Chat fetch failed: ' + err.message });
  }
});

app.post('/api/chat', authenticateToken, async (req, res) => {
  const { message } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, null, message]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Chat save failed: ' + err.message });
  }
});

// Tutor Profile
app.post('/api/tutor/profile', authenticateToken, async (req, res) => {
  if (req.user.role !== 'tutor') return res.status(403).json({ error: 'Not a tutor, bro!' });
  const { name, bio, subjects, availability, rate } = req.body;
  console.log('Saving tutor profile:', { user_id: req.user.id, name, bio, subjects, availability, rate });
  try {
    const result = await pool.query(
      'INSERT INTO tutor_profiles (user_id, name, bio, subjects, availability, rate) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id) DO UPDATE SET name = $2, bio = $3, subjects = $4, availability = $5, rate = $6 RETURNING *',
      [req.user.id, name || '', bio || '', subjects || [], availability || [], rate || 0]
    );
    console.log('Saved profile to DB:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Profile save error:', err);
    res.status(500).json({ error: 'Profile save failed: ' + err.message });
  }
});

// Upload Notes
app.post('/api/tutor/notes', authenticateToken, async (req, res) => {
  if (req.user.role !== 'tutor') return res.status(403).json({ error: 'Not a tutor, bro!' });
  const { filename, file_type, file_data } = req.body;
  console.log('Uploading note:', { tutor_id: req.user.id, filename, file_type });
  try {
    const result = await pool.query(
      'INSERT INTO tutor_notes (tutor_id, filename, file_type, file_data) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, filename, file_type, Buffer.from(file_data, 'base64')]
    );
    console.log('Saved note:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Note upload error:', err);
    res.status(500).json({ error: 'Note upload failed: ' + err.message });
  }
});

// Get Tutor Notes
app.get('/api/tutor/notes', authenticateToken, async (req, res) => {
  if (req.user.role !== 'tutor') return res.status(403).json({ error: 'Not a tutor, bro!' });
  try {
    const result = await pool.query('SELECT id, filename, file_type, uploaded_at FROM tutor_notes WHERE tutor_id = $1', [req.user.id]);
    res.json(result.rows.map(row => ({
      ...row,
      file_data: Buffer.from(row.file_data).toString('base64') // Return as base64
    })));
  } catch (err) {
    console.error('Notes fetch error:', err);
    res.status(500).json({ error: 'Notes fetch failed: ' + err.message });
  }
});

// Get Students for Tutor
app.get('/api/tutor/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'tutor') return res.status(403).json({ error: 'Not a tutor, bro!' });
  try {
    const result = await pool.query(
      'SELECT DISTINCT u.id, u.email FROM users u JOIN bookings b ON u.id = b.student_id WHERE b.tutor_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Students fetch error:', err);
    res.status(500).json({ error: 'Students fetch failed: ' + err.message });
  }
});

// ... (previous imports and setup unchanged)

// Student Profile Save
app.post('/api/student/profile', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Not a student, bro!' });
  const { name, age, gender, education_level, subjects } = req.body;
  console.log('Saving student profile:', { user_id: req.user.id, name, age, gender, education_level, subjects });
  try {
    const result = await pool.query(
      'INSERT INTO student_profiles (user_id, name, age, gender, education_level, subjects) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id) DO UPDATE SET name = $2, age = $3, gender = $4, education_level = $5, subjects = $6 RETURNING *',
      [req.user.id, name || '', age || 0, gender || '', education_level || '', subjects || []]
    );
    console.log('Saved student profile to DB:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Student profile save error:', err);
    res.status(500).json({ error: 'Student profile save failed: ' + err.message });
  }
});

// Student Profile Fetch
app.get('/api/student/profile', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Not a student, bro!' });
  try {
    const result = await pool.query('SELECT * FROM student_profiles WHERE user_id = $1', [req.user.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Student profile fetch error:', err);
    res.status(500).json({ error: 'Student profile fetch failed: ' + err.message });
  }
});

// ... (rest of the file unchanged)
// Add after other endpoints in server/index.js
app.get('/api/student/progress', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Not a student, bro!' });
  try {
    // Mock progress data—replace with real logic if DB tracking exists
    const mockProgress = [
      { subject: 'Math', score: 85 },
      { subject: 'Science', score: 92 },
    ];
    res.json(mockProgress);
  } catch (err) {
    console.error('Progress fetch error:', err);
    res.status(500).json({ error: 'Progress fetch failed: ' + err.message });
  }
});

// ... (previous imports and setup unchanged)

app.post('/api/student/profile', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Not a student, bro!' });
  const { name, bio } = req.body;
  console.log('Saving student profile:', { user_id: req.user.id, name, bio });
  try {
    const result = await pool.query(
      'INSERT INTO student_profiles (user_id, name, bio) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET name = $2, bio = $3 RETURNING *',
      [req.user.id, name || '', bio || '']
    );
    console.log('Saved student profile to DB:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Student profile save error:', err);
    res.status(500).json({ error: 'Student profile save failed: ' + err.message });
  }
});

app.get('/api/student/profile', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Not a student, bro!' });
  try {
    const result = await pool.query('SELECT * FROM student_profiles WHERE user_id = $1', [req.user.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Student profile fetch error:', err);
    res.status(500).json({ error: 'Student profile fetch failed: ' + err.message });
  }
});

// Update /api/tutor/notes to allow student access to their tutors' notes
app.get('/api/tutor/notes', authenticateToken, async (req, res) => {
  try {
    let query;
    if (req.user.role === 'tutor') {
      query = 'SELECT id, filename, file_type, uploaded_at FROM tutor_notes WHERE tutor_id = $1';
    } else if (req.user.role === 'student') {
      query = `
        SELECT DISTINCT tn.id, tn.filename, tn.file_type, tn.uploaded_at
        FROM tutor_notes tn
        JOIN bookings b ON tn.tutor_id = b.tutor_id
        WHERE b.student_id = $1
      `;
    } else {
      return res.status(403).json({ error: 'Not authorized, bro!' });
    }
    const result = await pool.query(query, [req.user.id]);
    res.json(result.rows.map(row => ({
      ...row,
      file_data: Buffer.from(row.file_data).toString('base64')
    })));
  } catch (err) {
    console.error('Notes fetch error:', err);
    res.status(500).json({ error: 'Notes fetch failed: ' + err.message });
  }
});

// Add after other endpoints in server/index.js
app.get('/api/tutor/posts', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT tp.name, p.content, p.created_at FROM tutor_posts p JOIN tutor_profiles tp ON p.tutor_id = tp.user_id ORDER BY p.created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Tutor posts fetch error:', err);
    res.status(500).json({ error: 'Tutor posts fetch failed: ' + err.message });
  }
});

app.post('/api/tutor/posts', authenticateToken, async (req, res) => {
  if (req.user.role !== 'tutor') return res.status(403).json({ error: 'Not a tutor, bro!' });
  const { content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tutor_posts (tutor_id, content) VALUES ($1, $2) RETURNING *',
      [req.user.id, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Tutor post creation error:', err);
    res.status(500).json({ error: 'Tutor post creation failed: ' + err.message });
  }
});

// Start server and WebSocket
const server = app.listen(PORT, () => {
  console.log(`Server’s up on port ${PORT}, bro!`);
});

const wss = new Server({ server });
const clients = new Map();

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const { token, text, recipientId } = JSON.parse(message);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const senderId = decoded.id;
      const result = await pool.query(
        'INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING *',
        [senderId, recipientId, text]
      );
      const msg = result.rows[0];
      const chatMsg = { id: msg.id, sender_id: msg.sender_id, receiver_id: msg.receiver_id, message: msg.message, created_at: msg.created_at };

      clients.set(senderId, ws);
      if (clients.has(senderId)) clients.get(senderId).send(JSON.stringify(chatMsg));
      if (recipientId && clients.has(recipientId)) clients.get(recipientId).send(JSON.stringify(chatMsg));
    } catch (err) {
      console.error('Chat message error:', err);
    }
  });

  ws.on('close', () => {
    for (let [id, client] of clients) {
      if (client === ws) clients.delete(id);
    }
  });
});

// In server/index.js, after WebSocket setup
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const msg = JSON.parse(message);
    if (msg.type === 'chat') {
      pool.query(
        'INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING *',
        [msg.senderId, msg.recipientId, msg.text]
      ).then((result) => {
        const chatMsg = result.rows[0];
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'chat', data: chatMsg }));
            client.send(JSON.stringify({ type: 'notification', data: { message: `New message from ${msg.senderId}` } }));
          }
        });
      });
    } else if (msg.type === 'booking') {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'notification', data: { message: `New booking for ${msg.time_slot}` } }));
        }
      });
    }
  });
});

// Add endpoint for tutor availability
app.get('/api/bookings/available', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, name, availability FROM tutor_profiles');
    res.json(result.rows.map(tutor => ({
      id: tutor.user_id,
      name: tutor.name,
      availability: tutor.availability,
    })));
  } catch (err) {
    console.error('Available tutors fetch error:', err);
    res.status(500).json({ error: 'Fetch failed: ' + err.message });
  }
});