const router = require('express').Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const pool = require('../config/db');

// Get student progress
router.get('/progress', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, tp.name as tutor_name, tp.subjects
       FROM bookings b 
       JOIN tutor_profiles tp ON b.tutor_id = tp.user_id 
       WHERE b.student_id = $1 
       ORDER BY b.time_slot DESC`,
      [req.user.id]
    );
    
    const progress = result.rows.map(booking => ({
      id: booking.id,
      tutorName: booking.tutor_name,
      subject: booking.subjects[0],
      date: booking.time_slot,
      status: 'completed',
      score: Math.floor(Math.random() * 30) + 70 // Mock score - replace with actual logic
    }));
    
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

module.exports = router;
