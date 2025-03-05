import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Peer from 'simple-peer';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Button, Badge } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import studentImg from '../images/student.jpg';

const StudentDashboard = ({ tutors, selectedTutor, setSelectedTutor, bookings, setBookings, token, theme }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState({ name: '', age: '', gender: '', education_level: '', subjects: [] });
  const [notes, setNotes] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedTutorForChat, setSelectedTutorForChat] = useState(null);
  const [progress, setProgress] = useState([]);
  const [tutorPosts, setTutorPosts] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [availableTutors, setAvailableTutors] = useState([]);
  const [videoCallActive, setVideoCallActive] = useState(false);
  const [peer, setPeer] = useState(null);
  const videoRef = useRef(null);
  const tutorVideoRef = useRef(null);
  const ws = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/student/profile', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setProfile(data || { name: '', age: '', gender: '', education_level: '', subjects: [] });
      } catch (err) {
        console.error('Profile fetch failed:', err);
      }
    };

    const fetchNotes = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/tutor/notes', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setNotes(data);
      } catch (err) {
        console.error('Notes fetch failed:', err);
      }
    };

    const fetchChat = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/chat', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setChatMessages(data);
      } catch (err) {
        console.error('Chat fetch failed:', err);
      }
    };

    const fetchProgress = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/student/progress', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setProgress(data || []);
      } catch (err) {
        console.error('Progress fetch failed:', err);
      }
    };

    const fetchTutorPosts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/tutor/posts', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setTutorPosts(data);
      } catch (err) {
        console.error('Tutor posts fetch failed:', err);
      }
    };

    const fetchAvailableTutors = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/bookings/available', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setAvailableTutors(data);
      } catch (err) {
        console.error('Available tutors fetch failed:', err);
      }
    };

    ws.current = new WebSocket('ws://localhost:5000');
    ws.current.onopen = () => console.log('WebSocket connected');
    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'chat') {
        setChatMessages((prev) => [...prev, msg.data]);
      } else if (msg.type === 'notification') {
        setNotifications((prev) => [...prev, msg.data]);
        if (Notification.permission === 'granted') {
          new Notification(msg.data.message);
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') new Notification(msg.data.message);
          });
        }
      } else if (msg.type === 'video-signal' && msg.recipientId === profile.user_id) {
        handleVideoSignal(msg.data);
      }
    };
    ws.current.onerror = (err) => console.error('WebSocket error:', err);
    ws.current.onclose = () => console.log('WebSocket closed');

    fetchProfile();
    fetchNotes();
    fetchChat();
    fetchProgress();
    fetchTutorPosts();
    fetchAvailableTutors();

    return () => ws.current && ws.current.close();
  }, [token, profile.user_id]);

  const handleSearch = (e) => setSearchQuery(e.target.value);
  const filteredTutors = tutors.filter((tutor) =>
    tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutor.subjects.some((sub) => sub.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const bookTutor = async (tutor, time) => {
    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tutor_id: tutor.user_id || tutor.id, time_slot: time }),
      });
      const data = await res.json();
      setBookings([...bookings, { ...data, tutor_name: tutor.name }]);
      ws.current.send(JSON.stringify({ type: 'booking', time_slot: time }));
    } catch (err) {
      console.error('Booking failed:', err);
    }
  };

  const sendChatMessage = () => {
    if (chatInput.trim() && selectedTutorForChat) {
      const msg = { type: 'chat', token, text: chatInput, senderId: profile.user_id, recipientId: selectedTutorForChat.user_id };
      ws.current.send(JSON.stringify(msg));
      setChatInput('');
    }
  };

  const handleChatOpen = (tutor) => {
    setSelectedTutorForChat(tutor);
  };

  const handleChatClose = () => {
    setSelectedTutorForChat(null);
    endVideoCall();
  };

  const handleVideoSignal = (signalData) => {
    if (!videoCallActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        const p = new Peer({ initiator: false, trickle: false, stream });
        p.on('signal', (data) => {
          ws.current.send(JSON.stringify({ type: 'video-signal', data, recipientId: selectedTutorForChat.user_id }));
        });
        p.on('stream', (remoteStream) => {
          tutorVideoRef.current.srcObject = remoteStream;
          tutorVideoRef.current.play();
        });
        p.signal(signalData);
        setPeer(p);
        setVideoCallActive(true);
      }).catch((err) => console.error('Video call error:', err));
    } else if (peer) {
      peer.signal(signalData);
    }
  };

  const startVideoCall = () => {
    if (!selectedTutorForChat) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      const p = new Peer({ initiator: true, trickle: false, stream });
      p.on('signal', (data) => {
        ws.current.send(JSON.stringify({ type: 'video-signal', data, recipientId: selectedTutorForChat.user_id }));
      });
      p.on('stream', (remoteStream) => {
        tutorVideoRef.current.srcObject = remoteStream;
        tutorVideoRef.current.play();
      });
      setPeer(p);
      setVideoCallActive(true);
    }).catch((err) => console.error('Video call error:', err));
  };

  const endVideoCall = () => {
    if (peer) peer.destroy();
    setVideoCallActive(false);
    videoRef.current.srcObject = null;
    tutorVideoRef.current.srcObject = null;
  };

  return (
    <section className="student-dashboard-container">
      <nav className="navbar">
        <h2>Tutor Titan</h2>
        <div>
          <Badge badgeContent={notifications.length} color="error">
            <NotificationsIcon className="nav-icon" onClick={() => setNotifications([])} />
          </Badge>
          <button className="nav-btn profile-btn" onClick={() => setShowProfile(!showProfile)}>
            Profile
          </button>
          <Link to="/settings" className="nav-btn">Settings</Link>
        </div>
      </nav>
      <div className="dashboard-grid">
        <div className={`profile-sidebar ${showProfile ? 'active' : ''}`}>
          <div className="profile-card animate-fade-in">
            <img src={studentImg} alt="Student" className="student-img" />
            <h2>Profile</h2>
            <p><strong>Name:</strong> {profile.name || 'Not set'}</p>
            <p><strong>Age:</strong> {profile.age || 'Not set'}</p>
            <p><strong>Gender:</strong> {profile.gender || 'Not set'}</p>
            <p><strong>Education:</strong> {profile.education_level || 'Not set'}</p>
            <p><strong>Subjects:</strong> {profile.subjects && profile.subjects.length ? profile.subjects.join(', ') : 'Not set'}</p>
          </div>
          <div className="progress-card animate-fade-in">
            <h2>Progress Report</h2>
            {progress.length ? (
              <ul>
                {progress.map((item, idx) => (
                  <li key={idx}>{item.subject}: {item.score}%</li>
                ))}
              </ul>
            ) : (
              <p>No progress data yet, bro!</p>
            )}
          </div>
        </div>
        <div className="main-content">
          <div className="tutors-section animate-slide-in">
            <h2><Link to="/tutors" className="tutor-link">Available Tutors</Link></h2>
            <div className="search-bar">
              <input type="text" placeholder="Search tutors..." value={searchQuery} onChange={handleSearch} />
            </div>
            <div className="tutor-list">
              {selectedTutor ? (
                <div className="tutor-profile animate-fade-in">
                  <h3>{selectedTutor.name}</h3>
                  <p><strong>Bio:</strong> {selectedTutor.bio || 'Not set'}</p>
                  <p><strong>Subjects:</strong> {selectedTutor.subjects.join(', ')}</p>
                  <p><strong>Availability:</strong> {selectedTutor.availability.join(', ')}</p>
                  <p><strong>Rate:</strong> ${selectedTutor.rate}</p>
                  <select onChange={(e) => bookTutor(selectedTutor, e.target.value)}>
                    <option value="">Book a Live Session</option>
                    {(selectedTutor.availability || []).map((slot, i) => (
                      <option key={i} value={slot}>{slot}</option>
                    ))}
                  </select>
                  <div className="tutor-buttons">
                    <button className="btn chat-btn" onClick={() => handleChatOpen(selectedTutor)}>Chat</button>
                    <button className="btn back-btn" onClick={() => setSelectedTutor(null)}>Back</button>
                  </div>
                  {selectedTutorForChat && (
                    <div className="chat-overlay animate-fade-in">
                      <div className="chat-header">
                        <h3>{selectedTutorForChat.name}</h3>
                        <button className="btn close-btn" onClick={handleChatClose}>X</button>
                      </div>
                      <div className="chat-messages whatsapp-style">
                        {chatMessages
                          .filter((msg) => msg.sender_id === selectedTutorForChat.user_id || msg.receiver_id === selectedTutorForChat.user_id)
                          .map((msg) => (
                            <div
                              key={msg.id}
                              className={`chat-message ${msg.sender_id === profile.user_id ? 'sent' : 'received'}`}
                            >
                              <p>{msg.message}</p>
                              <span>{new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</span>
                            </div>
                          ))}
                      </div>
                      {videoCallActive && (
                        <div className="video-container">
                          <video ref={videoRef} className="video-player" autoPlay muted />
                          <video ref={tutorVideoRef} className="video-player" autoPlay />
                        </div>
                      )}
                      <div className="chat-footer">
                        <textarea
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Type a message, bro..."
                        />
                        <div className="chat-actions">
                          <button className="btn send-btn" onClick={sendChatMessage}>Send</button>
                          {videoCallActive ? (
                            <button className="btn end-call-btn" onClick={endVideoCall}>End Call</button>
                          ) : (
                            <button className="btn video-btn" onClick={startVideoCall}>Video Call</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                filteredTutors.map((tutor) => (
                  <div key={tutor.id} className="tutor-card animate-bounce-in">
                    <h3>{tutor.name}</h3>
                    <p>{tutor.subjects.join(', ')}</p>
                    <p>${tutor.rate}/hr</p>
                    <button className="btn" onClick={() => setSelectedTutor(tutor)}>View</button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="resources-posts-section">
            <div className="notes-card animate-slide-in">
              <h2>Resource Hub</h2>
              <div className="notes-list">
                {notes.length ? notes.map((note) => (
                  <div key={note.id} className="note-item">
                    <a href={`data:${note.file_type};base64,${note.file_data}`} download={note.filename}>
                      {note.filename}
                    </a>
                    <span>{new Date(note.uploaded_at).toLocaleDateString()}</span>
                  </div>
                )) : <p>No resources yet, bro!</p>}
              </div>
            </div>
            <div className="posts-card animate-slide-in">
              <h2>Tutor Posts</h2>
              <div className="posts-list">
                {tutorPosts.length ? tutorPosts.map((post) => (
                  <div key={post.id} className="post-item">
                    <p><strong>{post.name}:</strong> {post.content}</p>
                    <span>{new Date(post.created_at).toLocaleString()}</span>
                  </div>
                )) : <p>No posts yet, bro!</p>}
              </div>
            </div>
          </div>
          <div className="calendar-chat-section">
            <div className="calendar-card animate-slide-in">
              <h2>Booking Calendar</h2>
              <Calendar
                onChange={setCalendarDate}
                value={calendarDate}
                tileContent={({ date }) => {
                  const day = date.toLocaleDateString();
                  const available = availableTutors.filter(tutor =>
                    tutor.availability.some(slot => slot.includes(day.split('/')[0] + '/' + day.split('/')[1]))
                  );
                  return available.length ? (
                    <div className="available-tutors">
                      {available.map(tutor => (
                        <Button key={tutor.id} onClick={() => bookTutor(tutor, day)}>{tutor.name}</Button>
                      ))}
                    </div>
                  ) : null;
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentDashboard;