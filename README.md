# Tutor Titan

A modern tutoring platform connecting students with tutors for personalized learning experiences.

## Overview

Tutor Titan is a full-stack web application that facilitates online tutoring services. The platform enables students to find tutors, book sessions, communicate via chat, and conduct video calls for remote learning.

## Features

- **User Authentication**: Secure login and registration system with role-based access (student/tutor)
- **Tutor Profiles**: Detailed profiles with subjects, availability, and rates
- **Booking System**: Schedule and manage tutoring sessions
- **Real-time Chat**: Instant messaging between students and tutors
- **Video Calls**: Live video sessions for remote tutoring
- **Dark/Light Theme**: Customizable UI theme preferences

## Tech Stack

### Frontend
- React 19
- React Router 7
- Material UI 6
- WebRTC (via simple-peer)
- React Calendar

### Backend
- Node.js
- Express.js
- PostgreSQL
- WebSockets
- JSON Web Tokens for authentication

## Project Structure

```
tutor-titan/
├── frontend/              # React frontend application
│   ├── public/            # Static files
│   └── src/               # Source files
│       ├── components/    # React components
│       └── ...            # Other frontend code
└── server/                # Node.js backend API
    ├── src/               # Source files
    │   ├── routes/        # API routes
    │   └── services/      # Business logic
    └── ...                # Configuration files
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database

### Installation

1. Clone the repository
   ```
   git clone https://github.com/Mmulobi/tutor-titan.git
   cd tutor-titan
   ```

2. Install backend dependencies
   ```
   cd server
   npm install
   ```

3. Configure environment variables
   - Create a `.env` file in the server directory with the following variables:
     ```
     PORT=5000
     DATABASE_URL=postgresql://username:password@localhost:5432/tutortitan
     JWT_SECRET=your_jwt_secret
     FRONTEND_URL=http://localhost:3000
     ```

4. Install frontend dependencies
   ```
   cd ../frontend
   npm install
   ```

5. Configure frontend environment variables
   - Create a `.env` file in the frontend directory with:
     ```
     REACT_APP_API_URL=http://localhost:5000
     ```

### Running the Application

1. Start the backend server
   ```
   cd server
   npm run dev
   ```

2. Start the frontend application
   ```
   cd frontend
   npm start
   ```

3. Access the application at `http://localhost:3000`

## API Endpoints

- `/api/auth` - Authentication routes
- `/api/tutors` - Tutor management
- `/api/student` - Student management
- `/api/bookings` - Session booking
- `/api/chat` - Chat functionality

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License.
