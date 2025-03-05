import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

const ChatPage = ({ token, user, tutors, theme }) => {
  const { tutorId } = useParams();
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const tutor = tutors.find(t => t.user_id === parseInt(tutorId));
  const ws = useRef(null);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/chat', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setChatMessages(data.filter(msg => msg.sender_id === parseInt(tutorId) || msg.receiver_id === parseInt(tutorId)));
      } catch (err) {
        console.error('Chat fetch failed:', err);
      }
    };

    ws.current = new WebSocket('ws://localhost:5000');
    ws.current.onopen = () => console.log('WebSocket connected');
    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'chat' && (msg.data.sender_id === parseInt(tutorId) || msg.data.receiver_id === parseInt(tutorId))) {
        setChatMessages((prev) => [...prev, msg.data]);
      }
    };
    ws.current.onerror = (err) => console.error('WebSocket error:', err);
    ws.current.onclose = () => console.log('WebSocket closed');

    fetchChat();

    return () => ws.current && ws.current.close();
  }, [token, tutorId]);

  const sendChatMessage = () => {
    if (chatInput.trim() && tutor) {
      const msg = { type: 'chat', token, text: chatInput, senderId: user.id, recipientId: tutor.user_id };
      ws.current.send(JSON.stringify(msg));
      setChatInput('');
    }
  };

  return (
    <section className="chat-page-container animate-fade-in">
      <nav className="navbar">
        <h2>Tutor Titan</h2>
        <div>
          <Link to="/tutors" className="nav-btn">Back to Tutors</Link>
        </div>
      </nav>
      <div className="chat-page-header">
        <h1>Chat with {tutor ? tutor.name : 'Tutor'}</h1>
      </div>
      <div className="chat-card">
        <div className="chat-messages">
          {chatMessages.map((msg) => (
            <p key={msg.id}>{msg.sender_id === user.id ? 'You' : tutor.name}: {msg.message}</p>
          ))}
        </div>
        <div className="chat-input">
          <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type your message, bro..." />
          <button className="btn send-btn" onClick={sendChatMessage}>Send</button>
        </div>
      </div>
    </section>
  );
};

export default ChatPage;