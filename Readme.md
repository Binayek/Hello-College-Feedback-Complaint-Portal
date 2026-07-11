Hello College — Feedback & Complaint Portal


A complaint and feedback management system for academic institutions.


This project was developed solely for academic purposes and is submitted as a minor project for the 6th semester of the IOE Computer Engineering.

| **Component**      | **Technology / Tool**                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| Frontend           | React.js (Vite)                                                                    |
| Backend            | Node.js with Express.js                                                            |
| Database           | PostgreSQL                                                                         |
| Authentication     | JSON Web Tokens (JWT)                                                              |
| Version Control    | Git & GitHub                                                                       |
| Content Moderation | Profanity Filter & Keyword-Based Content Moderation *(Under Progress)*             |
| AI Integration     | AI-Powered Complaint Summarization using a Large Language Model *(Under Progress)* |


Project Structure

hello-college/
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── schema.sql                # Run this script in PostgreSQL to create the database
│   └── src/
│       ├── server.js
│       ├── config/
│       │   └── db.js
│       ├── middleware/
│       │   └── auth.js
│       ├── routes/
│       │   └── index.js
│       └── controllers/
│           ├── authController.js
│           ├── communityController.js
│           ├── complaintController.js
│           └── userController.js
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── utils/
        │   └── api.js
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        │   └── shared/
        │       ├── Sidebar.jsx
        │       └── UI.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── shared/
            │   └── CommunityBoard.jsx
            ├── student/
            │   └── StudentPages.jsx
            ├── teacher/
            │   └── TeacherPages.jsx
            └── admin/
                └── AdminPages.jsx



Channels

| Channel | Who | Description |
|---|---|---|
| Community Board | All roles | Open discussion, optional anonymity, comments |
| Report to Admin | Student → Admin | Formal complaint, tracked, assignable |

Roles

Student : Register themselves, post to community board, file complaints to admin, track complaint status.

Teacher : View community board, respond to complaints assigned to them, mark resolved.

Admin : Moderate community board, manage all complaints (assign to teacher or faculty, update status), view analytics, manage users, reveal anonymous identity in serious cases (audit logged).









API Summary

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/community              (search, category filter)
GET    /api/community/:id
POST   /api/community
POST   /api/community/:id/comments
DELETE /api/community/:id          (admin)

POST   /api/complaints             (student)
GET    /api/complaints/mine        (student)
GET    /api/complaints/assigned    (teacher)
GET    /api/complaints             (admin)
GET    /api/complaints/analytics   (admin)
GET    /api/complaints/:id
POST   /api/complaints/:id/assign  (admin)
PATCH  /api/complaints/:id/status  (admin)
PATCH  /api/complaints/:id/reveal  (admin)
POST   /api/complaints/:id/respond (teacher)

GET    /api/users/teachers
GET    /api/users/faculties
GET    /api/users                  (admin)
POST   /api/users                  (admin)
PATCH  /api/users/:id/toggle       (admin)

GET    /api/notifications
PATCH  /api/notifications/read
```