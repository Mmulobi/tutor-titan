const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/db');

// Get user's bookings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, tp.name AS tutor_name 
       FROM bookings b 
       JOIN tutor_profiles tp ON b.tutor_id = tp.user_id 
       WHERE b.student_id = $1 OR b.tutor_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create new booking
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can create bookings' });
  }

  const { tutor_id, time_slot } = req.body;
  if (!tutor_id || !time_slot) {
    return res.status(400).json({ error: 'Tutor ID and time slot are required' });
  }

  try {
    // Check if the time slot is available
    const existing = await pool.query(
      'SELECT * FROM bookings WHERE tutor_id = $1 AND time_slot = $2',
      [tutor_id, time_slot]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Time slot is already booked' });
    }

    const result = await pool.query(
      'INSERT INTO bookings (student_id, tutor_id, time_slot) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, tutor_id, time_slot]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Update booking status
router.patch('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const booking = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (!booking.rows.length) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.rows[0].student_id !== req.user.id && booking.rows[0].tutor_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

module.exports = router;
