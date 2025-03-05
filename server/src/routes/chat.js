const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/db');

// Get chat history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cm.*, 
        u_sender.email as sender_email,
        u_receiver.email as receiver_email
       FROM chat_messages cm
       JOIN users u_sender ON cm.sender_id = u_sender.id
       LEFT JOIN users u_receiver ON cm.receiver_id = u_receiver.id
       WHERE cm.sender_id = $1 OR cm.receiver_id = $1
       ORDER BY cm.created_at DESC`,
      [req.user.id]
    );
    
    const messages = result.rows.map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      senderEmail: msg.sender_email,
      receiverId: msg.receiver_id,
      receiverEmail: msg.receiver_email,
      message: msg.message,
      timestamp: msg.created_at
    }));
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

module.exports = router;
