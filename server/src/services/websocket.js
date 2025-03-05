const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Map to store client connections
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      ws.on('message', async (message) => {
        try {
          const { token, text, recipientId } = JSON.parse(message);
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // Store client connection with user ID
          this.clients.set(decoded.id, ws);

          // Save message to database
          const result = await pool.query(
            'INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING *',
            [decoded.id, recipientId, text]
          );

          const messageData = {
            id: result.rows[0].id,
            senderId: decoded.id,
            recipientId,
            text,
            timestamp: new Date().toISOString()
          };

          // Send to recipient if online
          const recipientWs = this.clients.get(recipientId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(JSON.stringify(messageData));
          }

          // Send confirmation back to sender
          ws.send(JSON.stringify({ 
            type: 'confirmation',
            messageId: result.rows[0].id 
          }));

        } catch (err) {
          ws.send(JSON.stringify({ 
            type: 'error',
            message: 'Failed to process message'
          }));
        }
      });

      ws.on('close', () => {
        // Remove client from connections map
        for (const [userId, client] of this.clients.entries()) {
          if (client === ws) {
            this.clients.delete(userId);
            break;
          }
        }
      });
    });
  }
}

module.exports = WebSocketService;
