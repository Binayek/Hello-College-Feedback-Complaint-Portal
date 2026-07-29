# Hello College – Feedback & Complaint Portal

A modern, full-stack feedback and complaint management system designed for academic institutions. The platform enables students to submit feedback and complaints, teachers to manage assigned issues, and administrators to moderate discussions, monitor complaints, and manage users through a secure role-based dashboard.

## 🔗 Live Links

- **Frontend:** https://hello-college-ten.vercel.app/
- **Backend API:** *(https://hello-college-feedback-complaint-portal.onrender.com)*

---

# ✨ Features

## 🔹 Student Features

- Secure student registration and login
- Community discussion board with optional anonymous posting
- Submit complaints directly to administrators
- Track complaint status in real time
- Comment on community discussions
- Receive notifications for complaint updates

## 🔹 Teacher Features

- Secure authentication
- View assigned complaints
- Respond to complaints
- Update complaint resolution status
- Access community discussions

## 🔹 Admin Features

- Secure role-based authentication
- Moderate community posts
- Assign complaints to teachers or faculties
- Update complaint status
- Reveal anonymous users in serious cases (Audit Logged)
- Manage users and permissions
- Complaint analytics dashboard
- Community moderation tools

## 🔹 Content Moderation

- Built-in profanity filtering
- Keyword-based content moderation
- Anonymous posting support
- Automated moderation middleware

## 🔹 Technical Features

- JWT Authentication
- Role-Based Access Control (Student, Teacher, Admin)
- RESTful API architecture
- PostgreSQL database integration
- Protected API routes
- Modular backend architecture
- Centralized middleware
- Responsive frontend built with React

---

# 🛠️ Tech Stack

## Frontend

- **Framework:** React.js (Vite)
- **Language:** JavaScript
- **State Management:** React Context API
- **Styling:** CSS
- **HTTP Client:** Axios

## Backend

- **Framework:** Node.js
- **Server:** Express.js
- **Authentication:** JSON Web Tokens (JWT)
- **Database:** PostgreSQL
- **Content Moderation:** Profanity Filter & Keyword-Based Moderation

## Development Tools

- Git & GitHub

---

# 📦 Installation & Setup

## Prerequisites

- Node.js v18+
- PostgreSQL
- npm

---

## 1. Clone Repository

```bash
git clone https://github.com/Binayek/Hello-College-Feedback-Complaint-Portal.git

cd Hello-College-Feedback-Complaint-Portal
```

---

## 2. Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

---

## 3. Environment Setup

Create a `.env` file inside the **backend** directory.

```env
PORT=5000

DATABASE_URL=your_postgresql_connection_string

JWT_SECRET=your_jwt_secret

OPENAI_API_KEY=your_openai_key
```

*(Modify the variables according to your project configuration.)*

---

## 4. Database Setup

Create the PostgreSQL database and execute the provided schema.

```bash
psql -U postgres -d your_database -f schema.sql
```

---

## 5. Start the Development Server

### Backend

```bash
cd backend
npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

Open

```
http://localhost:5173
```

---

# 📁 Project Structure

```text
hello-college/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   ├── schema.sql
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── utils/
│   └── package.json
```

---

# 👥 User Roles

## 🎓 Student

- Register/Login
- Community discussions
- Anonymous posting
- Submit complaints
- Track complaint status
- Receive notifications

## 👨‍🏫 Teacher

- View assigned complaints
- Respond to complaints
- Resolve complaints
- Participate in discussions

## 👨‍💼 Admin

- Manage users
- Moderate community posts
- Assign complaints
- View complaint analytics
- Reveal anonymous identity (Audit Logged)
- Manage complaint workflow

---

# 🚀 Deployment

The application can be deployed using:

- **Frontend:** Vercel / Netlify
- **Backend:** Render / Railway / VPS
- **Database:** PostgreSQL (Neon, Supabase, Railway, etc.)

### Production Environment Variables

```env
DATABASE_URL=your_database_url

JWT_SECRET=your_secret_key

OPENAI_API_KEY=your_api_key
```

---

# 📝 API Endpoints

## Authentication

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

---

## Community

```
GET    /api/community
GET    /api/community/:id
POST   /api/community
POST   /api/community/:id/comments
DELETE /api/community/:id
```

---

## Complaints

```
POST   /api/complaints
GET    /api/complaints/mine
GET    /api/complaints/assigned
GET    /api/complaints
GET    /api/complaints/analytics
GET    /api/complaints/:id
POST   /api/complaints/:id/assign
PATCH  /api/complaints/:id/status
PATCH  /api/complaints/:id/reveal
POST   /api/complaints/:id/respond
```

---

## Users

```
GET    /api/users/teachers
GET    /api/users/faculties
GET    /api/users
POST   /api/users
PATCH  /api/users/:id/toggle
```

---

## Notifications

```
GET    /api/notifications
PATCH  /api/notifications/read
```

---

# 📄 License

This project was developed solely for academic purposes as a **Minor Project for the 6th Semester of IOE Computer Engineering**.

---

# 👨‍💻 Author

**Binayek**

GitHub: https://github.com/Binayek
