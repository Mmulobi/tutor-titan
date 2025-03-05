import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Peer from 'simple-peer';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import tutorImg from '../images/tutor.jpg';

const TutorDashboard = ({ tutorProfile: initialProfile, setTutorProfile, token, theme }) => {
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState(initialProfile || { name: '', bio: '', subjects: [], availability: [], rate: '' });
  const [subjectsAvailable] = useState(['Math', 'Science', 'English', 'History', 'Code', 'Physics', 'Chemistry', 'Biology']);
  const [selectedSubjects, setSelectedSubjects] = useState(profile.subjects || []);
  const [availability, setAvailability] = useState(profile.availability ? profile.availability.join(', ') : '');
  const [bookingCount, setBookingCount] = useState(0);
  const [notes, setNotes] = useState([]);
  const [students, setStudents] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [bookings, setBookings] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [videoCallActive, setVideoCallActive] = useState(false);
  const [peer, setPeer] = useState(null);
  const videoRef = useRef(null);
  const studentVideoRef = useRef(null);
  const ws = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/tutor/profile', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const updatedProfile = data || { name: '', bio: '', subjects: [], availability: [], rate: '' };
        setProfile(updatedProfile);
        setSelectedSubjects(updatedProfile.subjects || []);
        setAvailability(updatedProfile.availability ? updatedProfile.availability.join(', ') : '');
        setTutorProfile(updatedProfile);
      } catch (err) {
        console.error('Profile fetch failed:', err);
      }
    };

    const fetchBookingCount = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/bookings', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setBookingCount(data.length);
        setBookings(data);
      } catch (err) {
        console.error('Booking count fetch failed:', err);
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

    const fetchStudents = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/tutor/students', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setStudents(data);
      } catch (err) {
        console.error('Students fetch failed:', err);
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

    ws.current = new WebSocket('ws://localhost:5000');
    ws.current.onopen = () => console.log('WebSocket connected');
    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'chat') {
        setChatMessages((prev) => [...prev, msg.data]);
      } else if (msg.type === 'video-signal' && msg.recipientId === profile.user_id) {
        handleVideoSignal(msg.data);
      }
    };
    ws.current.onerror = (err) => console.error('WebSocket error:', err);
    ws.current.onclose = () => console.log('WebSocket closed');

    fetchProfile();
    fetchBookingCount();
    fetchNotes();
    fetchStudents();
    fetchChat();

    return () => ws.current && ws.current.close();
  }, [token, setTutorProfile, profile.user_id]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSubjectChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) selected.push(options[i].value);
    }
    setSelectedSubjects(selected);
    setProfile({ ...profile, subjects: selected });
  };

  const handleAvailabilityChange = (e) => {
    setAvailability(e.target.value);
    setProfile({ ...profile, availability: e.target.value ? e.target.value.split(', ') : [] });
  };

  const saveProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/tutor/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      setProfile(data);
      setTutorProfile(data);
      setSelectedSubjects(data.subjects || []);
      setAvailability(data.availability ? data.availability.join(', ') : '');
      setEditMode(false);
    } catch (err) {
      console.error('Profile save failed:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const fileData = reader.result.split(',')[1];
      const payload = {
        filename: file.name,
        file_type: file.type.split('/')[1],
        file_data: fileData,
      };
      try {
        const res = await fetch('http://localhost:5000/api/tutor/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setNotes((prev) => [...prev, data]);
      } catch (err) {
        console.error('File upload failed:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePostSubmit = async () => {
    if (!postContent.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/tutor/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: postContent }),
      });
      const data = await res.json();
      setPostContent('');
    } catch (err) {
      console.error('Post creation failed:', err);
    }
  };

  const sendChatMessage = () => {
    if (chatInput.trim() && selectedStudent) {
      const msg = { type: 'chat', token, text: chatInput, senderId: profile.user_id, recipientId: selectedStudent.id };
      ws.current.send(JSON.stringify(msg));
      setChatInput('');
    }
  };

  const handleVideoSignal = (signalData) => {
    if (!videoCallActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        const p = new Peer({ initiator: false, trickle: false, stream });
        p.on('signal', (data) => {
          ws.current.send(JSON.stringify({ type: 'video-signal', data, recipientId: selectedStudent?.id || signalData.senderId }));
        });
        p.on('stream', (remoteStream) => {
          studentVideoRef.current.srcObject = remoteStream;
          studentVideoRef.current.play();
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
    if (!selectedStudent) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      const p = new Peer({ initiator: true, trickle: false, stream });
      p.on('signal', (data) => {
        ws.current.send(JSON.stringify({ type: 'video-signal', data, recipientId: selectedStudent.id }));
      });
      p.on('stream', (remoteStream) => {
        studentVideoRef.current.srcObject = remoteStream;
        studentVideoRef.current.play();
      });
      setPeer(p);
      setVideoCallActive(true);
    }).catch((err) => console.error('Video call error:', err));
  };

  const endVideoCall = () => {
    if (peer) peer.destroy();
    setVideoCallActive(false);
    videoRef.current.srcObject = null;
    studentVideoRef.current.srcObject = null;
  };

  return (
    <section className="tutor-dashboard-container">
      <nav className="navbar">
        <h2>Tutor Titan</h2>
        <div>
          <button className="nav-btn profile-btn" onClick={() => setEditMode(!editMode)}>
            {editMode ? 'Close Profile' : 'Edit Profile'}
          </button>
          <Link to="/settings" className="nav-btn">Settings</Link>
        </div>
      </nav>
      <div className="dashboard-grid">
        <div className={`profile-sidebar ${editMode ? 'active' : ''}`}>
          <div className="profile-card animate-fade-in">
            <img src={tutorImg} alt="Tutor" className="tutor-img" />
            <h2>Profile</h2>
            {editMode ? (
              <div className="edit-form">
                <input name="name" value={profile.name || ''} onChange={handleProfileChange} placeholder="Name" />
                <textarea name="bio" value={profile.bio || ''} onChange={handleProfileChange} placeholder="Bio" />
                <select multiple value={selectedSubjects} onChange={handleSubjectChange}>
                  {subjectsAvailable.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
                <input
                  name="availability"
                  value={availability}
                  onChange={handleAvailabilityChange}
                  placeholder="Availability (e.g., Mon 10-12)"
                />
                <input name="rate" type="number" value={profile.rate || ''} onChange={handleProfileChange} placeholder="Rate ($/hr)" />
                <div className="form-buttons">
                  <button className="btn save-btn" onClick={saveProfile}>Save</button>
                  <button className="btn cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <p><strong>Name:</strong> {profile.name || 'Not set'}</p>
                <p><strong>Bio:</strong> {profile.bio || 'Not set'}</p>
                <p><strong>Subjects:</strong> {profile.subjects && profile.subjects.length ? profile.subjects.join(', ') : 'Not set'}</p>
                <p><strong>Availability:</strong> {profile.availability && profile.availability.length ? profile.availability.join(', ') : 'Not set'}</p>
                <p><strong>Rate:</strong> ${profile.rate || 'Not set'}</p>
                <p><strong>Students:</strong> {bookingCount}</p>
              </>
            )}
          </div>
        </div>
        <div className="main-content">
          <div className="tools-section animate-slide-in">
            <div className="notes-card">
              <h2>Resource Hub</h2>
              <input type="file" accept=".pdf,.docx,.jpg" onChange={handleFileUpload} />
              <div className="notes-list">
                {notes.map((note) => (
                  <div key={note.id} className="note-item">
                    <a href={`data:${note.file_type};base64,${note.file_data}`} download={note.filename}>
                      {note.filename}
                    </a>
                    <span>{new Date(note.uploaded_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="post-card">
              <h2>Create a Post</h2>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Share something with your students, bro!"
                rows="3"
              />
              <button className="btn post-btn" onClick={handlePostSubmit}>Post</button>
            </div>
          </div>
          <div className="students-schedule-section">
            <div className="students-card animate-slide-in">
              <h2>Students</h2>
              {students.length ? (
                <ul>
                  {students.map((student) => (
                    <li
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={selectedStudent?.id === student.id ? 'active' : ''}
                    >
                      {student.email}
                      <div className="student-actions">
                        <button className="btn chat-btn" onClick={() => setSelectedStudent(student)}>Chat</button>
                        {videoCallActive && selectedStudent?.id === student.id ? (
                          <button className="btn end-call-btn" onClick={endVideoCall}>End Call</button>
                        ) : (
                          <button className="btn video-btn" onClick={startVideoCall}>Video Call</button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No students yet, bro!</p>
              )}
            </div>
            <div className="schedule-card animate-slide-in">
              <h2>Schedule</h2>
              <Calendar
                onChange={setCalendarDate}
                value={calendarDate}
                tileContent={({ date }) => {
                  const day = date.toLocaleDateString();
                  const booked = bookings.filter(b => b.time_slot.includes(day.split('/')[0] + '/' + day.split('/')[1]));
                  return booked.length ? (
                    <div className="booked-slots">
                      {booked.map(b => (
                        <p key={b.id}>{b.tutor_name || 'Student'} - {b.time_slot}</p>
                      ))}
                    </div>
                  ) : null;
                }}
              />
            </div>
          </div>
          <div className="chat-video-section animate-slide-in">
            <div className="chat-card">
              <h2>Chat {selectedStudent ? `with ${selectedStudent.email}` : ''}</h2>
              {selectedStudent ? (
                <>
                  <div className="chat-messages">
                    {chatMessages
                      .filter((msg) => msg.sender_id === selectedStudent.id || msg.receiver_id === selectedStudent.id)
                      .map((msg) => (
                        <p key={msg.id}>{msg.sender_id === profile.user_id ? 'You' : selectedStudent.email}: {msg.message}</p>
                      ))}
                  </div>
                  <div className="chat-input">
                    <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." />
                    <button className="btn send-btn" onClick={sendChatMessage}>Send</button>
                  </div>
                </>
              ) : (
                <p>Select a student to chat, bro!</p>
              )}
            </div>
            {videoCallActive && (
              <div className="video-container">
                <video ref={videoRef} className="video-player" autoPlay muted />
                <video ref={studentVideoRef} className="video-player" autoPlay />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TutorDashboard;