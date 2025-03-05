import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Peer from 'simple-peer';

const VideoCallPage = ({ token, user, tutors, theme }) => {
  const { tutorId } = useParams();
  const [videoCallActive, setVideoCallActive] = useState(false);
  const [peer, setPeer] = useState(null);
  const videoRef = useRef(null);
  const tutorVideoRef = useRef(null);
  const ws = useRef(null);
  const tutor = tutors.find(t => t.user_id === parseInt(tutorId));

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:5000');
    ws.current.onopen = () => console.log('WebSocket connected');
    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'video-signal' && msg.recipientId === user.id && peer) {
        peer.signal(msg.data);
      }
    };
    ws.current.onerror = (err) => console.error('WebSocket error:', err);
    ws.current.onclose = () => console.log('WebSocket closed');

    return () => ws.current && ws.current.close();
  }, [user.id]);

  const startVideoCall = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      const p = new Peer({ initiator: true, trickle: false, stream });
      p.on('signal', (data) => {
        ws.current.send(JSON.stringify({ type: 'video-signal', data, recipientId: tutor.user_id }));
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
    <section className="video-call-container animate-fade-in">
      <nav className="navbar">
        <h2>Tutor Titan</h2>
        <div>
          <Link to="/tutors" className="nav-btn">Back to Tutors</Link>
        </div>
      </nav>
      <div className="video-call-header">
        <h1>Video Call with {tutor ? tutor.name : 'Tutor'}</h1>
      </div>
      <div className="video-call-content">
        <div className="video-container">
          <video ref={videoRef} className="video-player" autoPlay muted />
          <video ref={tutorVideoRef} className="video-player" autoPlay />
        </div>
        <div className="video-controls">
          {videoCallActive ? (
            <button className="btn end-call-btn" onClick={endVideoCall}>End Call</button>
          ) : (
            <button className="btn video-btn" onClick={startVideoCall}>Start Call</button>
          )}
        </div>
      </div>
    </section>
  );
};

export default VideoCallPage;