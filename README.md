# 🚀 LocalPulse

> **Your City, Your Voice**

LocalPulse is a hyperlocal civic engagement platform built for Tier-2 and Tier-3 Indian cities. It enables citizens to report civic issues, discover nearby events, connect with local service providers, and collaborate with local authorities to build smarter, cleaner, and safer communities.

---

## 🌟 Project Overview

LocalPulse bridges the communication gap between citizens and local authorities through a location-based platform where users can:

- 📍 Report civic issues with geo-location and images
- 👍 Upvote and comment on reported issues
- 🕵️ Report issues anonymously
- 📅 Discover nearby community events
- 🔧 Find trusted local service providers
- 🔔 Receive issue status notifications
- 📊 Allow administrators to monitor and resolve issues efficiently

---

## ✨ Features

### 👤 Citizen

- User Registration & Login
- Location-Based Dashboard
- Report Civic Issues
- Upload Images
- Anonymous Reporting
- Community Feed
- Upvote Issues
- Comment on Issues
- Nearby Events
- Service Provider Directory
- Notifications
- My Reports
- User Profile

### 🛡️ Admin

- Secure Admin Login
- Dashboard Analytics
- View All Issues
- Update Issue Status
- Manage Events
- Manage Service Providers
- View Registered Users
- Monitor Platform Activity

---

## 🔄 Issue Workflow

```text
Citizen Reports Issue
          │
          ▼
      Open
          │
          ▼
  Under Review
          │
          ▼
    In Progress
          │
          ▼
      Resolved
```

Users automatically receive notifications whenever the issue status changes.

---

# 🛠 Tech Stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- Axios
- React Hook Form
- Zod
- TanStack Router
- Leaflet + OpenStreetMap
- shadcn/ui

### Backend

- FastAPI
- Python
- MongoDB
- JWT Authentication
- Motor (Async MongoDB Driver)

### Deployment

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

---

# 📁 Project Structure

```text
LocalPulse/
│
├── backend/
│   ├── app/
│   ├── uploads/
│   ├── main.py
│   └── requirements.txt
│
├── local-pulse-ui/
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.md
```

---

# 🌐 Live Demo

### Frontend

> https://YOUR-FRONTEND-URL.vercel.app

### Backend API

> https://localpulse-backend-b9lt.onrender.com

---

# 🔐 Demo Credentials

## 👨‍💼 Admin Login

Email

```text
admin@localpulse.com
```

Password

```text
Admin@123
```

---

## 👤 Citizen

Register a new account using the Sign Up page or use any existing citizen account.

---

# 📷 Core Modules

- Dashboard
- Issue Feed
- Report Issue
- Issue Details
- Events
- Providers
- Notifications
- My Reports
- Profile
- Admin Dashboard

---

# 📌 Future Enhancements

- AI-based Issue Categorization
- Duplicate Issue Detection
- Heatmap Visualization
- Authority Analytics
- Push Notifications
- Mobile Application
- Offline Reporting

---

# 🚀 Getting Started

## Backend

```bash
cd backend

python -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --reload
```

---

## Frontend

```bash
cd local-pulse-ui

npm install

npm run dev
```

---

# 📄 Environment Variables

Backend

```env
MONGODB_URI=
JWT_SECRET=
ACCESS_TOKEN_EXPIRE_MINUTES=
CORS_ORIGINS=
```

Frontend

```env
VITE_API_BASE_URL=https://localpulse-backend-b9lt.onrender.com/api/v1
```

---

# 👥 Contributors

- **Mitali Jadhav**
- **Atharva Bapat**

---

# ❤️ Built For

**DevFusion 3.0 – The Developers Hackathon**

Empowering citizens to build smarter cities through community-driven civic engagement.

---

## 📜 License

This project is developed for educational and hackathon purposes.
