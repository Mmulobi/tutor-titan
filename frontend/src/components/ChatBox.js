import React, { useState } from 'react';

const ChatBox = ({ token, user, chatHistory, setChatHistory }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const sendChatMessage = async () => {
    if (chatMessage.trim()) {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: chatMessage }),
        });
        const data = await res.json();
        setChatHistory([...chatHistory, data]);
        setChatMessage('');
      } catch (err) {
        console.error('Chat send failed:', err);
      }
    }
  };

  return (
    <div className={`chat-box ${chatOpen ? 'open' : ''}`}>
      <button className="chat-toggle btn" onClick={() => setChatOpen(!chatOpen)}>
        {chatOpen ? 'X' : 'Chat'}
      </button>
      {chatOpen && (
        <div className="chat-content animate-slide-in-right">
          <div className="chat-history">
            {chatHistory.map((msg) => (
              <p key={msg.id}>{msg.sender_id === user.id ? 'You' : 'Support'}: {msg.message}</p>
            ))}
          </div>
          <textarea value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Type a message..." />
          <button className="btn" onClick={sendChatMessage}>Send</button>
        </div>
      )}
    </div>
  );
};

export default ChatBox;