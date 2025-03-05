const router = require('express').Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const pool = require('../config/db');

// Get all tutors
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tutor_profiles');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tutors' });
  }
});

// Get tutor profile
router.get('/profile', authenticateToken, requireRole('tutor'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tutor_profiles WHERE user_id = $1', [req.user.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update tutor profile
router.post('/profile', authenticateToken, requireRole('tutor'), async (req, res) => {
  const { name, bio, subjects, availability, rate } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tutor_profiles (user_id, name, bio, subjects, availability, rate) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (user_id) 
       DO UPDATE SET name = $2, bio = $3, subjects = $4, availability = $5, rate = $6 
       RETURNING *`,
      [req.user.id, name || '', bio || '', subjects || [], availability || [], rate || 0]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload notes
router.post('/notes', authenticateToken, requireRole('tutor'), async (req, res) => {
  const { filename, file_type, file_data } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tutor_notes (tutor_id, filename, file_type, file_data) VALUES ($1, $2, $3, $4) RETURNING id, filename, file_type, uploaded_at',
      [req.user.id, filename, file_type, Buffer.from(file_data, 'base64')]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload note' });
  }
});

// Get tutor notes
router.get('/notes', authenticateToken, requireRole('tutor'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, filename, file_type, uploaded_at FROM tutor_notes WHERE tutor_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get tutor's students
router.get('/students', authenticateToken, requireRole('tutor'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT u.id, u.email 
       FROM users u 
       JOIN bookings b ON u.id = b.student_id 
       WHERE b.tutor_id = $1 AND u.role = 'student'`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

module.exports = router;
