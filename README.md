# EventEase

EventEase is a modern, full-stack event management platform that enables organizers to create, manage, and promote events, while allowing participants to discover, RSVP, and interact with events in real time.
Live at https://event-ease-in.vercel.app/

## 🚀 Features
- User authentication (organizer & participant roles)
- Create, edit, cancel, and delete events (organizer)
- RSVP, cancel RSVP, and view event details (participant)
- Live, upcoming, completed, and canceled event states
- Email notifications for key actions
- Profile management (view, edit, delete account)
- Real-time attendee counts
- Feedback system for events
- Responsive, modern UI (React + Tailwind + Material-UI)
- Secure backend (Node.js, Express, MongoDB)

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Material-UI
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Email:** Nodemailer (with Gmail SMTP)
- **File Uploads:** Cloudinary (for event thumbnails)
- **Authentication:** JWT (access & refresh tokens)

## 📦 Project Structure
```
EventEase/
  BACKEND/         # Node.js/Express backend
  frontend/        # React frontend (Vite)
  README.md        # This file
  .gitignore       # Git ignore rules
```

## ⚡ Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/HarshAvichal/EventEase.git
cd EventEase
```

### 2. Setup the Backend
```bash
cd BACKEND
npm install
# Create a .env file (see below for required variables)
npm start
```

### 3. Setup the Frontend
```bash
cd ../frontend
npm install
# Create a .env.local file (see below for required variables)
npm run dev
```

### 4. Open in Browser
Visit [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal)

## 🔑 Environment Variables

### Backend (`BACKEND/.env`)
```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env.local`)
```
VITE_BACKEND_URL=http://localhost:3000
```

## 🤝 Contributing
1. Fork the repo and create your branch from `main`.
2. Commit your changes with clear messages.
3. Open a pull request describing your changes.

## 📄 License
This project is licensed under the MIT License.

---

**EventEase** — Your ultimate platform for managing and discovering events! 
